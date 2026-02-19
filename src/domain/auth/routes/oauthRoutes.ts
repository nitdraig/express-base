import { Router } from "express";
import { googleOAuthController } from "../controllers/googleOAuthController";
import { passportOAuthController } from "../controllers/passportOAuthController";
import { authenticate } from "../../../shared/middlewares/authMiddleware";
import { validateRequest } from "../../../shared/middlewares/validationMiddleware";
import { body } from "express-validator";

const router = Router();

// Route to get available providers
router.get("/providers", passportOAuthController.getAvailableProviders);

// OAuth routes with Passport.js (simpler and standard)
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

// Google-specific routes (for compatibility and additional features)
// These routes maintain specific features like verifyIdToken
router.post(
  "/google/token",
  [
    body("idToken").isString().notEmpty().withMessage("ID token required"),
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
      .withMessage("Refresh token required"),
    validateRequest,
  ],
  googleOAuthController.refreshToken
);
router.post("/google/revoke", authenticate, googleOAuthController.revokeTokens);

export default router;
