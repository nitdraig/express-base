/**
 * Variables mínimas antes de cargar módulos que lean `ENV`.
 * En CI/local puedes sobrescribir con el entorno real.
 */
process.env.DB_URI =
  process.env.DB_URI ?? "mongodb://127.0.0.1:27017/express_base_jest";
process.env.JWT_SECRET =
  process.env.JWT_SECRET ?? "jest-jwt-secret-must-be-at-least-32-chars";
process.env.PULSE_BEARER_TOKEN =
  process.env.PULSE_BEARER_TOKEN ?? "jest-pulse-bearer-token";
