import type { RequestHandler } from "express";
import {
  findUserForFirebaseToken,
  verifyFirebaseIdToken,
} from "../lib/user-auth.js";

export const requireAuth: RequestHandler = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ message: "Missing or invalid authorization token." });
    return;
  }

  const token = header.slice("Bearer ".length).trim();
  try {
    const decoded = await verifyFirebaseIdToken(token);
    const user = await findUserForFirebaseToken(decoded);
    if (!user) {
      res.status(401).json({ message: "Invalid token user." });
      return;
    }
    if (!user.isApproved) {
      res.status(403).json({ message: "Account pending admin approval." });
      return;
    }

    req.user = {
      sub: user.id,
      email: user.email,
      firebaseUid: decoded.uid,
    };
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token." });
  }
};
