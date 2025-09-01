import { Router } from "express";

import authRoutes from "./../../domain/auth/routes/authRoutes";
import userRoutes from "./../../domain/users/routes/userRoutes";
import healthRoutes from "../routes/healthRoutes";

export const registerRoutes = (app: Router): void => {
  // Health check routes (prioridad alta)
  app.use("/", healthRoutes);

  // API routes
  app.use("/auth", authRoutes);
  app.use("/users", userRoutes);
  app.use("/health", healthRoutes);
};
