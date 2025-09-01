import { Router, Request, Response } from "express";
import mongoose from "mongoose";
import { logInfo } from "../utils/logger";

const router = Router();

// Health check básico
router.get("/health", (req: Request, res: Response) => {
  (res as any).status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Health check completo con base de datos
router.get("/health/full", async (req: Request, res: Response) => {
  try {
    const dbStatus =
      mongoose.connection.readyState === 1 ? "connected" : "disconnected";

    const healthData = {
      status: "OK",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
      database: {
        status: dbStatus,
        readyState: mongoose.connection.readyState,
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024),
      },
      version: process.version,
    };

    logInfo("Health check performed", healthData);

    (res as any).status(200).json(healthData);
  } catch (error) {
    logInfo("Health check failed", { error: error });
    (res as any).status(503).json({
      status: "ERROR",
      timestamp: new Date().toISOString(),
      error: "Service unavailable",
    });
  }
});

// Readiness check para Kubernetes
router.get("/ready", async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return (res as any).status(503).json({
        status: "NOT_READY",
        reason: "Database not connected",
      });
    }

    (res as any).status(200).json({
      status: "READY",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    (res as any).status(503).json({
      status: "NOT_READY",
      reason: error,
    });
  }
});

// Liveness check para Kubernetes
router.get("/live", (req: Request, res: Response) => {
  (res as any).status(200).json({
    status: "ALIVE",
    timestamp: new Date().toISOString(),
  });
});

export default router;
