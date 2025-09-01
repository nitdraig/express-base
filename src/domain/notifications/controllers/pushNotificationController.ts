import { Request, Response } from "express";
import { pushNotificationService } from "../../../shared/services/pushNotificationService";
import { User } from "../../users/models/userModel";
import { logInfo, logError } from "../../../shared/utils/logger";

export const pushNotificationController = {
  // Obtener VAPID public key
  getVapidPublicKey: async (req: Request, res: Response) => {
    try {
      if (!pushNotificationService.isConfigured()) {
        return res.status(503).json({
          success: false,
          error: "Servicio de notificaciones push no configurado",
        });
      }

      const publicKey = pushNotificationService.getVapidPublicKey();

      res.json({
        success: true,
        data: {
          publicKey,
        },
      });
    } catch (error) {
      logError("Error obteniendo VAPID public key:", error);
      res.status(500).json({
        success: false,
        error: "Error obteniendo clave pública",
      });
    }
  },

  // Suscribir usuario a notificaciones push
  subscribe: async (req: Request, res: Response) => {
    try {
      const { subscription } = req.body;
      const user = (req as any).user;

      if (!pushNotificationService.isConfigured()) {
        return res.status(503).json({
          success: false,
          error: "Servicio de notificaciones push no configurado",
        });
      }

      // Validar suscripción
      const isValid =
        await pushNotificationService.validateSubscription(subscription);
      if (!isValid) {
        return res.status(400).json({
          success: false,
          error: "Suscripción push inválida",
        });
      }

      // Verificar si la suscripción ya existe
      const existingUser = await User.findById(user.id);
      const subscriptionExists = existingUser?.pushSubscriptions?.some(
        (sub) => sub.endpoint === subscription.endpoint
      );

      if (subscriptionExists) {
        return res.json({
          success: true,
          message: "Suscripción ya existe",
        });
      }

      // Agregar suscripción al usuario
      await User.findByIdAndUpdate(user.id, {
        $push: { pushSubscriptions: subscription },
      });

      logInfo("Usuario suscrito a notificaciones push", {
        userId: user.id,
        endpoint: subscription.endpoint.substring(0, 50) + "...",
      });

      res.json({
        success: true,
        message: "Suscripción exitosa",
      });
    } catch (error) {
      logError("Error suscribiendo usuario a notificaciones push:", error);
      res.status(500).json({
        success: false,
        error: "Error procesando suscripción",
      });
    }
  },

  // Desuscribir usuario de notificaciones push
  unsubscribe: async (req: Request, res: Response) => {
    try {
      const { endpoint } = req.body;
      const user = (req as any).user;

      await User.findByIdAndUpdate(user.id, {
        $pull: { pushSubscriptions: { endpoint } },
      });

      logInfo("Usuario desuscrito de notificaciones push", {
        userId: user.id,
        endpoint: endpoint.substring(0, 50) + "...",
      });

      res.json({
        success: true,
        message: "Desuscripción exitosa",
      });
    } catch (error) {
      logError("Error desuscribiendo usuario de notificaciones push:", error);
      res.status(500).json({
        success: false,
        error: "Error procesando desuscripción",
      });
    }
  },

  // Enviar notificación de prueba
  sendTestNotification: async (req: Request, res: Response) => {
    try {
      const { title, body } = req.body;
      const user = (req as any).user;

      if (!pushNotificationService.isConfigured()) {
        return res.status(503).json({
          success: false,
          error: "Servicio de notificaciones push no configurado",
        });
      }

      const userDoc = await User.findById(user.id);
      if (
        !userDoc?.pushSubscriptions ||
        userDoc.pushSubscriptions.length === 0
      ) {
        return res.status(400).json({
          success: false,
          error: "No tienes suscripciones push activas",
        });
      }

      const notification = pushNotificationService.createNotification(
        "custom",
        {
          title,
          body,
          customData: { type: "test", userId: user.id },
        }
      );

      const result = await pushNotificationService.sendNotificationToMany(
        userDoc.pushSubscriptions,
        notification
      );

      logInfo("Notificación de prueba enviada", {
        userId: user.id,
        success: result.success,
        failed: result.failed,
      });

      res.json({
        success: true,
        data: result,
        message: "Notificación de prueba enviada",
      });
    } catch (error) {
      logError("Error enviando notificación de prueba:", error);
      res.status(500).json({
        success: false,
        error: "Error enviando notificación de prueba",
      });
    }
  },

  // Enviar notificación a todos los usuarios (solo admin)
  sendToAllUsers: async (req: Request, res: Response) => {
    try {
      const { title, body } = req.body;
      const user = (req as any).user;

      // Verificar permisos de admin
      if (!["admin", "superAdmin"].includes(user.role)) {
        return res.status(403).json({
          success: false,
          error: "No tienes permisos para enviar notificaciones masivas",
        });
      }

      if (!pushNotificationService.isConfigured()) {
        return res.status(503).json({
          success: false,
          error: "Servicio de notificaciones push no configurado",
        });
      }

      const notification = pushNotificationService.createNotification(
        "custom",
        {
          title,
          body,
          customData: { type: "broadcast", sentBy: user.id },
        }
      );

      const result =
        await pushNotificationService.sendNotificationToAllUsers(notification);

      logInfo("Notificación masiva enviada", {
        sentBy: user.id,
        success: result.success,
        failed: result.failed,
      });

      res.json({
        success: true,
        data: result,
        message: "Notificación enviada a todos los usuarios",
      });
    } catch (error) {
      logError("Error enviando notificación masiva:", error);
      res.status(500).json({
        success: false,
        error: "Error enviando notificación masiva",
      });
    }
  },

  // Enviar notificación a usuarios por rol (solo admin)
  sendToRole: async (req: Request, res: Response) => {
    try {
      const { role, title, body } = req.body;
      const user = (req as any).user;

      // Verificar permisos de admin
      if (!["admin", "superAdmin"].includes(user.role)) {
        return res.status(403).json({
          success: false,
          error: "No tienes permisos para enviar notificaciones masivas",
        });
      }

      if (!pushNotificationService.isConfigured()) {
        return res.status(503).json({
          success: false,
          error: "Servicio de notificaciones push no configurado",
        });
      }

      const notification = pushNotificationService.createNotification(
        "custom",
        {
          title,
          body,
          customData: { type: "role_broadcast", role, sentBy: user.id },
        }
      );

      const result = await pushNotificationService.sendNotificationToRole(
        role,
        notification
      );

      logInfo("Notificación enviada por rol", {
        role,
        sentBy: user.id,
        success: result.success,
        failed: result.failed,
      });

      res.json({
        success: true,
        data: result,
        message: `Notificación enviada a usuarios con rol: ${role}`,
      });
    } catch (error) {
      logError("Error enviando notificación por rol:", error);
      res.status(500).json({
        success: false,
        error: "Error enviando notificación por rol",
      });
    }
  },
};
