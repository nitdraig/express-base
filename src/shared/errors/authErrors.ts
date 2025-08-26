import { ApiError } from "./apiError";

export class UnauthorizedError extends ApiError {
  constructor(message = "No autorizado") {
    super(401, message);
  }

  serializeErrors() {
    return { statusCode: this.statusCode, message: this.message };
  }
}

export class InvalidCredentialsError extends ApiError {
  constructor() {
    super(401, "Credenciales inválidas");
  }

  serializeErrors() {
    return { statusCode: this.statusCode, message: this.message };
  }
}

export class TokenExpiredError extends ApiError {
  constructor() {
    super(401, "Token expirado");
  }

  serializeErrors() {
    return { statusCode: this.statusCode, message: this.message };
  }
}

export class ForbiddenError extends ApiError {
  constructor() {
    super(403, "Acceso prohibido");
  }

  serializeErrors() {
    return { statusCode: this.statusCode, message: this.message };
  }
}
