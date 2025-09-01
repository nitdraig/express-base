// shared/middlewares/security.ts
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import rateLimit from "express-rate-limit";
import { Express } from "express";

export const applySecurity = (app: Express) => {
  // Configuración de Helmet para headers de seguridad
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    })
  );

  // Rate limiting más granular
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 100, // máximo 100 requests por ventana
      message: {
        error: "Too many requests from this IP, please try again later.",
        retryAfter: "15 minutes",
      },
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  // Rate limiting específico para autenticación
  app.use(
    "/auth",
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 5, // máximo 5 intentos de login por 15 minutos
      message: {
        error: "Too many login attempts, please try again later.",
        retryAfter: "15 minutes",
      },
    })
  );

  // Sanitización de MongoDB
  app.use(
    mongoSanitize({
      replaceWith: "_",
    })
  );

  // Headers adicionales de seguridad
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
  });
};
