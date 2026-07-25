import type { RequestHandler } from "express";
import { db } from "../lib/db.js";

export const getDashboardStats: RequestHandler = async (req, res) => {
  const userId = req.user?.sub;
  const [projects, services, certificates, reviews, loginLogs] = await Promise.all([
    db.project.count(),
    db.service.count(),
    db.certificate.count(),
    db.review.count(),
    userId
      ? db.userLoginLog.findMany({
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
