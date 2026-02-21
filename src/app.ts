import express from "express";
import cors from "cors";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import compression from "compression";
import { swaggerDocs } from "./shared/config/swagger";
import { ENV } from "./shared/config/env";
import { registerRoutes } from "./shared/config/routes";
import { applySecurity } from "./shared/middlewares/security";
import { errorHandler } from "./shared/errors/errorHandler";
import { requestLogger, logInfo } from "./shared/utils/logger";
import { sanitizeInput } from "./shared/middlewares/validationMiddleware";
import passport from "./shared/config/passport";

const app = express();

// Security middlewares (helmet, sanitize, rate-limit)
applySecurity(app);

// Gzip compression
app.use(compression());

// More restrictive CORS
app.use(
  cors({
    origin: ENV.FRONTEND_ORIGIN,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
    exposedHeaders: ["Content-Disposition"],
    credentials: true,
    maxAge: 86400, // 24 hours
  }),
);

// Initialize Passport
app.use(passport.initialize());

// Input sanitization
app.use(sanitizeInput);

// Structured logs
app.use(requestLogger);

// Development logs
if (ENV.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Body parsers with more strict limits
app.use(
  express.json({
    limit: "10kb",
    strict: true,
    verify: (req, res, buf: any) => {
      try {
        JSON.parse(buf);
      } catch (e) {
        (res as any).status(400).json({ error: "Invalid JSON" } as any);
        throw new Error("Invalid JSON");
      }
    },
  }),
);
app.use(
  express.urlencoded({
    extended: true,
    limit: "10kb",
    parameterLimit: 10,
  }),
);

// Main routes
registerRoutes(app);

// Swagger (only if not production)
if (ENV.NODE_ENV !== "production") {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
}

// Home route
app.get("/", (_req, res) => {
  res.send(`
<title>Express Base API | Powered by Excelso</title>
    <div style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px;">
      <h1>Welcome to Express Base API</h1>
      <p>You’ve reached a point very few do. If this is a critical bug or security issue, please report it to me@agustin.top — rewards may apply.</p>
      <a href="https://agustin.top" style="color: #2b4c7e;"> -> AgustinAvellaneda Web <- </a>
    </div>
  `);
});

// 404
app.use((req: any, res: any, next: any) => {
  if (req.path !== "/") {
    return res.status(404).send(`
      <title>404 | Express Base API</title>
      <div style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px;">
        <h1>Not Found</h1>
        <a href="https://agustin.top" style="color: #2b4c7e;"> -> Agustin Avellaneda Web <- </a>
      </div>
    `);
  }
  next();
});

// Error handler
app.use(errorHandler as any);

export default app;
