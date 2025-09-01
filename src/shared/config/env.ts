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
  API_URL: process.env.API_URL ?? "http://localhost:5000",

  // Base de datos
  DB_URI: process.env.DB_URI!,
  MONGODB_REPLICA_SET: process.env.MONGODB_REPLICA_SET,

  // JWT
  JWT_SECRET: process.env.JWT_SECRET!,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "7d",
  PASSWORD_RESET_EXPIRES_IN: parseInt(
    process.env.PASSWORD_RESET_EXPIRES_IN ?? "900000",
    10
  ), // 15 minutos en ms

  // Frontend
  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN ?? "http://localhost:3000",

  // Email
  SMTP_HOST: process.env.SMTP_HOST ?? "smtp.gmail.com",
  SMTP_PORT: parseInt(process.env.SMTP_PORT ?? "587", 10),
  SMTP_SECURE: process.env.SMTP_SECURE === "true",
  SMTP_USER: process.env.SMTP_USER ?? "",
  SMTP_PASS: process.env.SMTP_PASS ?? "",
  SMTP_FROM: process.env.SMTP_FROM ?? "noreply@yourdomain.com",

  // Ethereal Email (desarrollo)
  ETHEREAL_USER: process.env.ETHEREAL_USER ?? "test@ethereal.email",
  ETHEREAL_PASS: process.env.ETHEREAL_PASS ?? "test123",

  // Redis (opcional)
  REDIS_URL: process.env.REDIS_URL,

  // AWS S3 (opcional)
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_REGION: process.env.AWS_REGION ?? "us-east-1",
  AWS_S3_BUCKET: process.env.AWS_S3_BUCKET,

  // Stripe (opcional)
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,

  // Google OAuth (opcional)
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,

  // Push Notifications (opcional)
  VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY,

  // Sentry (opcional)
  SENTRY_DSN: process.env.SENTRY_DSN,
} as const;
