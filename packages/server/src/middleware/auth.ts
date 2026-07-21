import type { RequestHandler } from "express";
import { prisma } from "../lib/prisma.js";
import { verifyAccessToken } from "../utils/jwt.js";

export const requireAuth: RequestHandler = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ message: "Missing or invalid authorization token." });
    return;
  }

  const token = header.slice("Bearer ".length).trim();
  try {
    const payload = verifyAccessToken(token);

    const user = await prisma.adminUser.findUnique({
      where: { id: payload.sub },
      select: { isApproved: true },
    });
    if (!user) {
      res.status(401).json({ message: "Invalid token user." });
      return;
    }
    if (!user.isApproved) {
      res.status(403).json({ message: "Account pending admin approval." });
      return;
    }

    req.user = payload;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token." });
  }
};
