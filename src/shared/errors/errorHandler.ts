import { Request, Response, NextFunction } from "express";
import { ENV } from "../config/env";

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  // Log del error para debugging
  console.error("Unhandled error:", err);

  // En desarrollo, mostrar detalles del error
  if (ENV.NODE_ENV === "development") {
    return res.status(500).json({
      error: "Internal Server Error",
      message: err.message,
      stack: err.stack,
    });
  }

  // En producción, solo mensaje genérico
  res.status(500).json({
    error: "Internal Server Error",
    message: "Something went wrong. Please try again later.",
  });
}
