import { Router } from "express";
import { googleOAuthController } from "../controllers/googleOAuthController";
import { passportOAuthController } from "../controllers/passportOAuthController";
import { authenticate } from "../../../shared/middlewares/authMiddleware";
import { validateRequest } from "../../../shared/middlewares/validationMiddleware";
import { body } from "express-validator";

const router = Router();

// Ruta para obtener proveedores disponibles
router.get("/providers", passportOAuthController.getAvailableProviders);

// Rutas OAuth con Passport.js (más simples y estándar)
router.get(
  "/google",
  passportOAuthController.authenticate("google")
);

router.get(
  "/google/callback",
  ...passportOAuthController.handleCallback("google")
);

router.get(
  "/facebook",
  passportOAuthController.authenticate("facebook")
);

router.get(
  "/facebook/callback",
  ...passportOAuthController.handleCallback("facebook")
);

router.get(
  "/github",
  passportOAuthController.authenticate("github")
);

router.get(
  "/github/callback",
  ...passportOAuthController.handleCallback("github")
);

// Rutas específicas de Google (para compatibilidad y funcionalidades adicionales)
// Estas rutas mantienen funcionalidades específicas como verifyIdToken
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
