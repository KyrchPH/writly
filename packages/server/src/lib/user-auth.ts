import { randomBytes } from "crypto";
import type { DecodedIdToken } from "firebase-admin/auth";
import { db } from "./db.js";
import { getFirebaseAdminAuth } from "./firebase-admin.js";
import { hashPassword } from "../utils/password.js";

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const getDeviceName = (userAgent?: string) => {
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

export const verifyFirebaseIdToken = (token: string) =>
  getFirebaseAdminAuth().verifyIdToken(token);

export const findUserForFirebaseToken = async (decoded: DecodedIdToken) => {
  const firebaseUid = decoded.uid;
  const email = decoded.email ? normalizeEmail(decoded.email) : "";

  const byFirebaseUid = await db.user.findUnique({
    where: { firebaseUid },
  });
  if (byFirebaseUid) return byFirebaseUid;

  if (!email) return null;
  return db.user.findUnique({ where: { email } });
};

export const syncUserFromFirebaseToken = async (decoded: DecodedIdToken) => {
  const firebaseUid = decoded.uid;
  const email = decoded.email ? normalizeEmail(decoded.email) : "";
  if (!email) {
    throw new Error("Firebase account does not have an email address.");
  }

  const existing = await findUserForFirebaseToken(decoded);
  if (existing) {
    const updates: Record<string, unknown> = {};
    if (existing.firebaseUid !== firebaseUid) updates.firebaseUid = firebaseUid;
    if (existing.email !== email) updates.email = email;
    if (!existing.name && decoded.name) updates.name = decoded.name;
    if (decoded.picture && existing.photoUrl !== decoded.picture) {
      updates.photoUrl = decoded.picture;
    }

    if (Object.keys(updates).length === 0) {
      return existing;
    }

    return db.user.update({
      where: { id: existing.id },
      data: updates,
    });
  }

  const fallbackName = email.split("@")[0];
  const passwordHash = await hashPassword(randomBytes(32).toString("hex"));
  return db.user.create({
    data: {
      firebaseUid,
      name: (decoded.name || fallbackName).trim(),
      email,
      photoUrl: decoded.picture,
      passwordHash,
      isApproved: true,
      approvedAt: new Date(),
    },
  });
};

export const recordUserLogin = async (userId: string, userAgent?: string) =>
  db.userLoginLog.create({
    data: {
      userId,
      deviceName: getDeviceName(userAgent),
      userAgent,
    },
  });
