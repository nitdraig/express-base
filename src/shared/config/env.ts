import dotenv from "dotenv";
dotenv.config();

// Validación de variables de entorno críticas
const requiredEnvVars = ["DB_URI", "JWT_SECRET"];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

export const ENV = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: parseInt(process.env.PORT ?? "5000", 10),
  DB_URI: process.env.DB_URI!,
  JWT_SECRET: process.env.JWT_SECRET!,
  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN ?? "http://localhost:3000",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "7d",
  PASSWORD_RESET_EXPIRES_IN: parseInt(
    process.env.PASSWORD_RESET_EXPIRES_IN ?? "900000",
    10
  ), // 15 minutos en ms
} as const;
