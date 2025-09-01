// src/shared/middlewares/validationMiddleware.ts
import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { ValidationError } from "../errors/validationError";
import { validatePassword } from "../utils/passwordUtils";

export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError(errors.array());
  }
  next();
};

// Middleware específico para validación de contraseñas
export const validatePasswordMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { password } = req.body;

  if (!password) {
    res.status(400).json({
      error: "Password is required",
      field: "password",
    });
    return;
  }

  const validation = validatePassword(password);

  if (!validation.isValid) {
    res.status(400).json({
      error: "Password validation failed",
      details: validation.errors,
      field: "password",
    });
    return;
  }

  next();
};

// Middleware para validación de email
export const validateEmailMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({
      error: "Email is required",
      field: "email",
    });
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({
      error: "Invalid email format",
      field: "email",
    });
    return;
  }

  next();
};

// Middleware para sanitización de entrada
export const sanitizeInput = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Sanitizar strings
  if (req.body) {
    Object.keys(req.body).forEach((key) => {
      if (typeof req.body[key] === "string") {
        req.body[key] = req.body[key].trim();
      }
    });
  }

  // Sanitizar query parameters
  if (req.query) {
    Object.keys(req.query).forEach((key) => {
      if (typeof req.query[key] === "string") {
        req.query[key] = (req.query[key] as string).trim();
      }
    });
  }

  next();
};
