import express from "express";
import cors from "cors";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { swaggerDocs } from "./shared/config/swagger";
import { ENV } from "./shared/config/env";
import { registerRoutes } from "./shared/config/routes";
import { applySecurity } from "./shared/middlewares/segurity";
import { errorHandler } from "./shared/errors/errorHandler";

const app = express();

// Middlewares de seguridad (helmet, sanitize, rate-limit)
applySecurity(app);

// CORS
app.use(
  cors({
    origin: ENV.FRONTEND_ORIGIN,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
    exposedHeaders: ["Content-Disposition"],
    credentials: true,
  })
);

// Logs y body parsers
app.use(morgan("dev"));
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

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
app.use(errorHandler);

export default app;
