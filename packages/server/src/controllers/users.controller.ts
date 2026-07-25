import type { RequestHandler } from "express";
import { db } from "../lib/db.js";
import { normalizeRouteParam } from "./helpers.js";

export const listPendingUsers: RequestHandler = async (_req, res) => {
  const pendingUsers = await db.user.findMany({
    where: { isApproved: false },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
  });

  res.status(200).json({ data: pendingUsers });
};

export const approveUser: RequestHandler = async (req, res) => {
  const targetId = normalizeRouteParam(req.params.id);
  if (!targetId) {
    res.status(400).json({ message: "Invalid user id." });
    return;
  }

  const approverId = req.user?.sub;
  if (!approverId) {
    res.status(401).json({ message: "Unauthorized." });
    return;
  }

  const existing = await db.user.findUnique({
    where: { id: targetId },
    select: {
      id: true,
      isApproved: true,
      name: true,
      email: true,
      createdAt: true,
      approvedAt: true,
    },
  });

  if (!existing) {
    res.status(404).json({ message: "User not found." });
    return;
  }

  if (existing.isApproved) {
    res.status(409).json({ message: "User is already approved." });
    return;
  }

  const updated = await db.user.update({
    where: { id: targetId },
    data: {
      isApproved: true,
      approvedAt: new Date(),
      approvedById: approverId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      approvedAt: true,
      approvedById: true,
    },
  });

  res.status(200).json({ data: updated });
};

export const rejectUser: RequestHandler = async (req, res) => {
  const targetId = normalizeRouteParam(req.params.id);
  if (!targetId) {
    res.status(400).json({ message: "Invalid user id." });
    return;
  }

  const existing = await db.user.findUnique({
    where: { id: targetId },
    select: { id: true, isApproved: true },
  });

  if (!existing) {
    res.status(404).json({ message: "User not found." });
    return;
  }

  if (existing.isApproved) {
    res.status(409).json({ message: "Cannot reject an approved user." });
    return;
  }

  await db.user.delete({
    where: { id: targetId },
  });

  res.status(204).send();
};
