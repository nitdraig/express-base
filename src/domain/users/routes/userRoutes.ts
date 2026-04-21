import express from "express";
import { body } from "express-validator";
import {
  changePassword,
  deleteUser,
  getProfile,
  getUsersCount,
  updateProfile,
} from "../controllers/userControllers";
import {
  authenticate,
  authorize,
} from "../../../shared/middlewares/authMiddleware";
import {
  validateRequest,
  validatePasswordMiddleware,
} from "../../../shared/middlewares/validationMiddleware";

const router = express.Router();

// Rutas protegidas que requieren autenticación
router.get("/me", authenticate, getProfile);

router.put(
  "/profile",
  authenticate,
  [
    body("email")
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage("Email inválido"),
  ],
  validateRequest,
  updateProfile
);

router.put(
  "/change-password",
  authenticate,
  [
    body("currentPassword")
      .notEmpty()
      .withMessage("Contraseña actual es requerida"),
    body("newPassword")
      .isLength({ min: 8 })
      .withMessage("Nueva contraseña debe tener al menos 8 caracteres"),
  ],
  validateRequest,
  validatePasswordMiddleware,
  changePassword
);

// Rutas administrativas
router.delete(
  "/:id",
  authenticate,
  authorize(["admin", "superAdmin"]),
  deleteUser
);

router.get(
  "/count",
  authenticate,
  authorize(["admin", "superAdmin"]),
  getUsersCount
);

export default router;
