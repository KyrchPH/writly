import { Router } from "express";
import { createHash, randomBytes } from "crypto";
import { z } from "zod";
import { env, isEmailConfigured } from "../config/env.js";
import { sendPasswordResetEmail } from "../lib/mailer.js";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/async-handler.js";
import { comparePassword, hashPassword } from "../utils/password.js";
import { signAccessToken } from "../utils/jwt.js";

const signupSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(32).max(256),
  newPassword: z.string().min(8).max(128),
});

const normalizeEmail = (email: string) => email.trim().toLowerCase();
const hashResetToken = (token: string) =>
  createHash("sha256").update(`${token}:${env.JWT_SECRET}`).digest("hex");

const getDeviceName = (userAgent?: string) => {
  if (!userAgent) return "Unknown device";
  const browser = /Edg\//.test(userAgent)
    ? "Edge"
    : /Chrome\//.test(userAgent)
      ? "Chrome"
      : /Firefox\//.test(userAgent)
        ? "Firefox"
        : /Safari\//.test(userAgent)
          ? "Safari"
          : "Browser";
  const platform = /Windows NT/.test(userAgent)
    ? "Windows"
    : /Mac OS X/.test(userAgent)
      ? "macOS"
      : /Android/.test(userAgent)
        ? "Android"
        : /iPhone|iPad/.test(userAgent)
          ? "iOS"
          : /Linux/.test(userAgent)
            ? "Linux"
            : "Device";
  return `${browser} on ${platform}`;
};

export const authRouter = Router();

authRouter.post("/signup", asyncHandler(async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: "Invalid signup payload.",
      errors: parsed.error.flatten(),
    });
    return;
  }

  const email = normalizeEmail(parsed.data.email);
  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ message: "Email is already in use." });
    return;
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const signupResult = await prisma.$transaction(async (tx) => {
    const adminCount = await tx.adminUser.count();
    const shouldAutoApprove = adminCount === 0;
    const now = new Date();

    const user = await tx.adminUser.create({
      data: {
        name: parsed.data.name.trim(),
        email,
        passwordHash,
        isApproved: shouldAutoApprove,
        approvedAt: shouldAutoApprove ? now : undefined,
      },
    });

    return { user, shouldAutoApprove };
  });

  if (!signupResult.shouldAutoApprove) {
    res.status(202).json({
      message: "Signup submitted. Awaiting admin approval.",
      user: {
        id: signupResult.user.id,
        name: signupResult.user.name,
        email: signupResult.user.email,
        createdAt: signupResult.user.createdAt,
      },
    });
    return;
  }

  const token = signAccessToken({
    sub: signupResult.user.id,
    email: signupResult.user.email,
  });
  res.status(201).json({
    token,
    user: {
      id: signupResult.user.id,
      name: signupResult.user.name,
      email: signupResult.user.email,
      createdAt: signupResult.user.createdAt,
    },
  });
}));

authRouter.post("/login", asyncHandler(async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: "Invalid login payload.",
      errors: parsed.error.flatten(),
    });
    return;
  }

  const email = normalizeEmail(parsed.data.email);
  const user = await prisma.adminUser.findUnique({ where: { email } });
  if (!user) {
    res.status(401).json({ message: "Invalid credentials." });
    return;
  }

  const isValidPassword = await comparePassword(parsed.data.password, user.passwordHash);
  if (!isValidPassword) {
    res.status(401).json({ message: "Invalid credentials." });
    return;
  }

  if (!user.isApproved) {
    res.status(403).json({ message: "Account pending admin approval." });
    return;
  }

  const userAgent = req.get("user-agent") || undefined;
  await prisma.adminLoginLog.create({
    data: {
      userId: user.id,
      deviceName: getDeviceName(userAgent),
      userAgent,
    },
  });

  const token = signAccessToken({ sub: user.id, email: user.email });
  res.status(200).json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    },
  });
}));

authRouter.post("/forgot-password", asyncHandler(async (req, res) => {
  const parsed = forgotPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: "Invalid forgot-password payload.",
      errors: parsed.error.flatten(),
    });
    return;
  }

  if (!isEmailConfigured) {
    res.status(500).json({
      message: "Password reset is unavailable. Gmail API email is not configured.",
    });
    return;
  }

  const email = normalizeEmail(parsed.data.email);
  const user = await prisma.adminUser.findUnique({ where: { email } });

  // Return a generic response to avoid account enumeration.
  const genericSuccess = {
    message:
      "If the email exists, a password reset link has been sent.",
  };

  if (!user) {
    res.status(200).json(genericSuccess);
    return;
  }

  const now = new Date();
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashResetToken(token);
  const expiresAt = new Date(
    now.getTime() + env.PASSWORD_RESET_TOKEN_TTL_MINUTES * 60 * 1000,
  );

  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: now },
  });

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  const baseAdminUrl = env.ADMIN_APP_URL.replace(/\/+$/, "");
  const resetUrl = `${baseAdminUrl}?resetToken=${encodeURIComponent(token)}`;

  try {
    await sendPasswordResetEmail({
      to: user.email,
      resetUrl,
      expiresInMinutes: env.PASSWORD_RESET_TOKEN_TTL_MINUTES,
    });
  } catch (error) {
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, tokenHash },
      data: { usedAt: new Date() },
    });

    const message =
      error instanceof Error ? error.message : "Failed to send reset email.";
    res.status(500).json({ message });
    return;
  }

  res.status(200).json(genericSuccess);
}));

authRouter.post("/reset-password", asyncHandler(async (req, res) => {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: "Invalid reset-password payload.",
      errors: parsed.error.flatten(),
    });
    return;
  }

  const now = new Date();
  const tokenHash = hashResetToken(parsed.data.token.trim());
  const resetRecord = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
  });

  if (
    !resetRecord ||
    resetRecord.usedAt ||
    resetRecord.expiresAt.getTime() < now.getTime()
  ) {
    res.status(400).json({ message: "Invalid or expired reset token." });
    return;
  }

  const newPasswordHash = await hashPassword(parsed.data.newPassword);

  await prisma.$transaction([
    prisma.adminUser.update({
      where: { id: resetRecord.userId },
      data: { passwordHash: newPasswordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetRecord.id },
      data: { usedAt: now },
    }),
    prisma.passwordResetToken.updateMany({
      where: { userId: resetRecord.userId, usedAt: null },
      data: { usedAt: now },
    }),
  ]);

  res.status(200).json({ message: "Password reset successful." });
}));

authRouter.get("/me", requireAuth, asyncHandler(async (req, res) => {
  const userId = req.user?.sub;
  if (!userId) {
    res.status(401).json({ message: "Unauthorized." });
    return;
  }

  const user = await prisma.adminUser.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      isApproved: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    res.status(404).json({ message: "User not found." });
    return;
  }

  res.status(200).json({ user });
}));
