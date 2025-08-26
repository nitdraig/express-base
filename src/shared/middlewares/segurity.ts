// shared/middlewares/security.ts
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import rateLimit from "express-rate-limit";
import { Express } from "express";
import express from "express";

export const applySecurity = (app: Express) => {
  app.use(helmet());

  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 300,
      message: "Too many requests from this IP, please try again later.",
    })
  );

  app.use(mongoSanitize());
};
