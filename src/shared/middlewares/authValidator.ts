import Joi from "joi";
import { Request, Response, NextFunction } from "express";

const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    next();
  };
};

export const loginValidator = validate(
  Joi.object({
    email: Joi.string().email().required().messages({
      "string.empty": "El email es requerido",
      "string.email": "Debe ser un email válido",
    }),
    password: Joi.string().min(6).required().messages({
      "string.empty": "La contraseña es requerida",
      "string.min": "La contraseña debe tener al menos 6 caracteres",
    }),
  })
);

export const resetRequestValidator = validate(
  Joi.object({
    email: Joi.string().email().required(),
  })
);

export const passwordResetValidator = validate(
  Joi.object({
    token: Joi.string().required(),
    newPassword: Joi.string().min(6).required(),
  })
);

export const refreshTokenValidator = validate(
  Joi.object({
    refreshToken: Joi.string().required(),
  })
);
