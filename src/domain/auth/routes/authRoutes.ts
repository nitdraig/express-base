import { Router } from "express";
import { authController } from "../controllers/authController";
import oauthRoutes from "./oauthRoutes";
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

// OAuth routes (must go before other routes to avoid conflicts)
router.use("/oauth", oauthRoutes);

// Login with improved validations and rate limiting
router.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail().withMessage("Invalid email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  validateRequest,
  checkAccountLock,
  loginRateLimit,
  authController.login
);

// Refresh token
router.post(
  "/refresh-token",
  [body("token").notEmpty().withMessage("Token is required")],
  validateRequest,
  authController.refreshToken
);

// Request password reset
router.post(
  "/forgot-password",
  [body("email").isEmail().normalizeEmail().withMessage("Email inválido")],
  validateRequest,
  authController.forgotPassword
);

// Reset password with validation
router.post(
  "/reset-password",
  [
    body("token").notEmpty().withMessage("Token es requerido"),
    body("newPassword")
      .isLength({ min: 8 })
      .withMessage("New password must be at least 8 characters"),
  ],
  validateRequest,
  validatePasswordMiddleware,
  authController.resetPassword
);

// Verify activation token
router.post(
  "/verify-token",
  [body("token").notEmpty().withMessage("Token is required")],
  validateRequest,
  authController.verifyToken
);

// Logout (invalidates token)
router.post("/logout", authenticate, authController.logout);

export default router;
