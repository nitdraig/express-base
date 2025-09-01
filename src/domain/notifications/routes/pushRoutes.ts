import { Router } from "express";
import { pushNotificationController } from "../controllers/pushNotificationController";
import { authenticate } from "../../../shared/middlewares/authMiddleware";
import { validateRequest } from "../../../shared/middlewares/validationMiddleware";
import { body } from "express-validator";

const router = Router();

// Rutas de notificaciones push
router.get("/vapid-public-key", pushNotificationController.getVapidPublicKey);
router.post(
  "/subscribe",
  [
    authenticate,
    body("subscription").isObject().withMessage("Suscripción requerida"),
    body("subscription.endpoint")
      .isString()
      .notEmpty()
      .withMessage("Endpoint requerido"),
    body("subscription.keys.p256dh")
      .isString()
      .notEmpty()
      .withMessage("P256DH key requerida"),
    body("subscription.keys.auth")
      .isString()
      .notEmpty()
      .withMessage("Auth key requerida"),
    validateRequest,
  ],
  pushNotificationController.subscribe
);
router.delete(
  "/unsubscribe",
  [
    authenticate,
    body("endpoint").isString().notEmpty().withMessage("Endpoint requerido"),
    validateRequest,
  ],
  pushNotificationController.unsubscribe
);
router.post(
  "/test",
  [
    authenticate,
    body("title").isString().notEmpty().withMessage("Título requerido"),
    body("body").isString().notEmpty().withMessage("Cuerpo requerido"),
    validateRequest,
  ],
  pushNotificationController.sendTestNotification
);

// Rutas administrativas (solo admin)
router.post(
  "/send-to-all",
  [
    authenticate,
    body("title").isString().notEmpty().withMessage("Título requerido"),
    body("body").isString().notEmpty().withMessage("Cuerpo requerido"),
    validateRequest,
  ],
  pushNotificationController.sendToAllUsers
);
router.post(
  "/send-to-role",
  [
    authenticate,
    body("role").isString().notEmpty().withMessage("Rol requerido"),
    body("title").isString().notEmpty().withMessage("Título requerido"),
    body("body").isString().notEmpty().withMessage("Cuerpo requerido"),
    validateRequest,
  ],
  pushNotificationController.sendToRole
);

export default router;
