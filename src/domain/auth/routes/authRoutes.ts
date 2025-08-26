import { Router } from "express";
import { authController } from "../controllers/authController";
import { body } from "express-validator";
import { refreshAccessToken } from "../services/authService";
import { validateRequest } from "../../../shared/middlewares/validationMiddleware";

const router = Router();

router.post(
  "/login",
  [body("email").isEmail(), body("password").isLength({ min: 6 })],
  validateRequest,
  authController.login
);

router.post("/refresh-token", authController.refreshToken);
router.post("/forgot-password", authController.forgotPassword);

router.post("/reset-password", authController.resetPassword);
router.post("/verify-token", authController.verifyToken);
router.post("/refresh-token", async ({ req, res }: any) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }

    const newToken = await refreshAccessToken(token);
    res.json({ token: newToken });
  } catch (error) {
    console.error("Refresh token error Routes:", error);
    res.status(401).json({ message: error });
  }
});

export default router;
