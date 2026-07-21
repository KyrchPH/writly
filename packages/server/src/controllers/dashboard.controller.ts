import type { RequestHandler } from "express";
import { prisma } from "../lib/prisma.js";

export const getDashboardStats: RequestHandler = async (req, res) => {
  const userId = req.user?.sub;
  const [projects, services, certificates, reviews, loginLogs] = await Promise.all([
    prisma.project.count(),
    prisma.service.count(),
    prisma.certificate.count(),
    prisma.review.count(),
    userId
      ? prisma.adminLoginLog.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            deviceName: true,
            userAgent: true,
            createdAt: true,
          },
        })
      : Promise.resolve([]),
  ]);

  res.status(200).json({
    stats: {
      projects,
      services,
      certificates,
      reviews,
    },
    loginLogs,
  });
};
