import { Router } from "express";
import { googleOAuthController } from "../controllers/googleOAuthController";
import { authenticate } from "../../../shared/middlewares/authMiddleware";
import { validateRequest } from "../../../shared/middlewares/validationMiddleware";
import { body } from "express-validator";

const router = Router();

// Rutas de OAuth de Google
router.get("/google", googleOAuthController.getAuthUrl);
router.get("/google/callback", googleOAuthController.handleCallback);
router.post(
  "/google/token",
  [
    body("idToken").isString().notEmpty().withMessage("Token ID requerido"),
    validateRequest,
  ],
  googleOAuthController.verifyIdToken
);
router.post(
  "/google/refresh",
  [
    body("refreshToken")
      .isString()
      .notEmpty()
      .withMessage("Refresh token requerido"),
    validateRequest,
  ],
  googleOAuthController.refreshToken
);
router.post("/google/revoke", authenticate, googleOAuthController.revokeTokens);

export default router;
