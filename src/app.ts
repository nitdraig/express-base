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

const app = express();

// Middlewares de seguridad (helmet, sanitize, rate-limit)
applySecurity(app);

// Compresión gzip
app.use(compression());

// CORS más restrictivo
app.use(
  cors({
    origin: ENV.FRONTEND_ORIGIN,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
    exposedHeaders: ["Content-Disposition"],
    credentials: true,
    maxAge: 86400, // 24 horas
  })
);

// Sanitización de entrada
app.use(sanitizeInput);

// Logs estructurados
app.use(requestLogger);

// Logs de desarrollo
if (ENV.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Body parsers con límites más estrictos
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
  })
);
app.use(
  express.urlencoded({
    extended: true,
    limit: "10kb",
    parameterLimit: 10,
  })
);

// Rutas principales
registerRoutes(app);

// Swagger (solo si no es producción)
if (ENV.NODE_ENV !== "production") {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
}

// Ruta principal
app.get("/", (_req, res) => {
  res.send(`
<title>Flowfolio API | Powered by Excelso</title>
    <div style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px;">
      <h1>Welcome to Sigii API</h1>
      <p>You’ve reached a point very few do. If this is a critical bug or security issue, please report it to info@miningtalent.net — rewards may apply.</p>
      <a href="https://excelso.xyz" style="color: #2b4c7e;"> -> Excelso Web <- </a>
    </div>
  `);
});

// 404
app.use((req: any, res: any, next: any) => {
  if (req.path !== "/") {
    return res.status(404).send(`
      <title>404 | Flowfolio API</title>
      <div style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px;">
        <h1>Not Found</h1>
        <a href="https://excelso.xyz" style="color: #2b4c7e;"> -> Excelso Web <- </a>
      </div>
    `);
  }
  next();
});

// Manejo global de errores
app.use(errorHandler as any);

export default app;
