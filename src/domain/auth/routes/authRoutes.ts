import { Router } from "express";
import { authController } from "../controllers/authController";
import { body } from "express-validator";
import {
  validateRequest,
  validatePasswordMiddleware,
  validateEmailMiddleware,
} from "../../../shared/middlewares/validationMiddleware";
import { authenticate } from "../../../shared/middlewares/authMiddleware";
import {
  loginRateLimit,
  checkAccountLock,
} from "../../../shared/middlewares/loginRateLimit";
import { asyncHandler } from "../../../shared/utils/asyncHandler";

const router = Router();

// Login con validaciones mejoradas y rate limiting
router.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail().withMessage("Email inválido"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Contraseña debe tener al menos 6 caracteres"),
  ],
  validateRequest,
  checkAccountLock,
  loginRateLimit,
  authController.login
);

// Refresh token
router.post(
  "/refresh-token",
  [body("token").notEmpty().withMessage("Token es requerido")],
  validateRequest,
  authController.refreshToken
);

// Solicitar reset de contraseña
router.post(
  "/forgot-password",
  [body("email").isEmail().normalizeEmail().withMessage("Email inválido")],
  validateRequest,
  authController.forgotPassword
);

// Reset de contraseña con validación
router.post(
  "/reset-password",
  [
    body("token").notEmpty().withMessage("Token es requerido"),
    body("newPassword")
      .isLength({ min: 8 })
      .withMessage("Nueva contraseña debe tener al menos 8 caracteres"),
  ],
  validateRequest,
  validatePasswordMiddleware,
  authController.resetPassword
);

// Verificar token de activación
router.post(
  "/verify-token",
  [body("token").notEmpty().withMessage("Token es requerido")],
  validateRequest,
  authController.verifyToken
);

// Logout (invalida token)
router.post("/logout", authenticate, authController.logout);

export default router;
