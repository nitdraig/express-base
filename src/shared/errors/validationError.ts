// src/core/errors/validationError.ts
import { ApiError } from "./apiError";
import { ValidationError as ExpressValidationError } from "express-validator";

export class ValidationError extends ApiError {
  constructor(public errors: ExpressValidationError[]) {
    super(400, "Error de validación", errors);
  }

  serializeErrors() {
    return {
      statusCode: this.statusCode,
      message: this.message,
      details: this.errors.map((err) => ({
        field: err,
        message: err.msg,
      })),
    };
  }
}
