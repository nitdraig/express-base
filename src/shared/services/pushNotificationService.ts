import webpush from "web-push";
import { ENV } from "../config/env";
import { logInfo, logError } from "../utils/logger";

// Tipos para notificaciones push
export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushNotification {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  data?: Record<string, any>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
  timestamp?: number;
}

export interface NotificationPayload {
  notification: PushNotification;
  subscription: PushSubscription;
  options?: {
    TTL?: number;
    urgency?: "very-low" | "low" | "normal" | "high";
    topic?: string;
  };
}

// Servicio de Notificaciones Push
export class PushNotificationService {
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  // Inicializar el servicio
  private initialize() {
    try {
      // Generar VAPID keys si no existen
      if (!ENV.VAPID_PUBLIC_KEY || !ENV.VAPID_PRIVATE_KEY) {
        const vapidKeys = webpush.generateVAPIDKeys();

        logInfo(
          "VAPID keys generadas automáticamente. Agrega estas variables a tu .env:",
          {
            VAPID_PUBLIC_KEY: vapidKeys.publicKey,
            VAPID_PRIVATE_KEY: vapidKeys.privateKey,
          }
        );

        // Usar las keys generadas para esta sesión
        webpush.setVapidDetails(
          `mailto:${ENV.SMTP_FROM || "noreply@yourdomain.com"}`,
          vapidKeys.publicKey,
          vapidKeys.privateKey
        );
      } else {
        // Usar las keys configuradas
        webpush.setVapidDetails(
          `mailto:${ENV.SMTP_FROM || "noreply@yourdomain.com"}`,
          ENV.VAPID_PUBLIC_KEY,
          ENV.VAPID_PRIVATE_KEY
        );
      }

      this.isInitialized = true;
      logInfo("Servicio de notificaciones push inicializado correctamente");
    } catch (error) {
      logError("Error inicializando servicio de notificaciones push:", error);
      this.isInitialized = false;
    }
  }

  // Enviar notificación individual
  async sendNotification(payload: NotificationPayload): Promise<boolean> {
    if (!this.isInitialized) {
      throw new Error("Servicio de notificaciones push no inicializado");
    }

    try {
      const pushPayload = JSON.stringify({
        notification: payload.notification,
        data: payload.notification.data || {},
      });

      const pushOptions = {
        TTL: payload.options?.TTL || 86400, // 24 horas por defecto
        urgency: payload.options?.urgency || "normal",
        topic: payload.options?.topic,
        headers: {
          "Content-Type": "application/json",
          Urgency: payload.options?.urgency || "normal",
        },
      };

      await webpush.sendNotification(
        payload.subscription,
        pushPayload,
        pushOptions
      );

      logInfo("Notificación push enviada exitosamente", {
        title: payload.notification.title,
        endpoint: payload.subscription.endpoint.substring(0, 50) + "...",
      });

      return true;
    } catch (error: any) {
      if (error.statusCode === 410) {
        logError("Suscripción push expirada o inválida", {
          endpoint: payload.subscription.endpoint,
        });
        // Aquí podrías eliminar la suscripción de la base de datos
      } else {
        logError("Error enviando notificación push:", error);
      }
      return false;
    }
  }

  // Enviar notificación a múltiples suscripciones
  async sendNotificationToMany(
    subscriptions: PushSubscription[],
    notification: PushNotification,
    options?: NotificationPayload["options"]
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    const promises = subscriptions.map(async (subscription) => {
      try {
        const success = await this.sendNotification({
          subscription,
          notification,
          options,
        });

        if (success) {
          results.success++;
        } else {
          results.failed++;
        }
      } catch (error) {
        results.failed++;
        results.errors.push(
          error instanceof Error ? error.message : "Unknown error"
        );
      }
    });

    await Promise.allSettled(promises);

    logInfo("Notificación push enviada a múltiples suscripciones", {
      total: subscriptions.length,
      success: results.success,
      failed: results.failed,
    });

    return results;
  }

  // Enviar notificación a todos los usuarios
  async sendNotificationToAllUsers(
    notification: PushNotification,
    options?: NotificationPayload["options"]
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    try {
      // Importar el modelo de usuario dinámicamente para evitar dependencias circulares
      const { User } = await import("../../domain/users/models/userModel");

      // Obtener todas las suscripciones activas
      const users = await User.find({
        "pushSubscriptions.0": { $exists: true },
        isActive: true,
      });

      const allSubscriptions: PushSubscription[] = [];
      users.forEach((user) => {
        if (user.pushSubscriptions) {
          allSubscriptions.push(...user.pushSubscriptions);
        }
      });

      return await this.sendNotificationToMany(
        allSubscriptions,
        notification,
        options
      );
    } catch (error) {
      logError("Error enviando notificación a todos los usuarios:", error);
      return {
        success: 0,
        failed: 0,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  }

  // Enviar notificación a usuarios por rol
  async sendNotificationToRole(
    role: string,
    notification: PushNotification,
    options?: NotificationPayload["options"]
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    try {
      const { User } = await import("../../domain/users/models/userModel");

      const users = await User.find({
        role,
        "pushSubscriptions.0": { $exists: true },
        isActive: true,
      });

      const subscriptions: PushSubscription[] = [];
      users.forEach((user) => {
        if (user.pushSubscriptions) {
          subscriptions.push(...user.pushSubscriptions);
        }
      });

      return await this.sendNotificationToMany(
        subscriptions,
        notification,
        options
      );
    } catch (error) {
      logError("Error enviando notificación por rol:", error);
      return {
        success: 0,
        failed: 0,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  }

  // Crear notificaciones predefinidas
  createNotification(type: string, data: any): PushNotification {
    const baseNotification: PushNotification = {
      title: "",
      body: "",
      icon: "/icons/notification-icon.png",
      badge: "/icons/badge-icon.png",
      timestamp: Date.now(),
      requireInteraction: false,
      silent: false,
    };

    switch (type) {
      case "welcome":
        return {
          ...baseNotification,
          title: "¡Bienvenido!",
          body: "Gracias por registrarte en nuestra plataforma.",
          icon: "/icons/welcome-icon.png",
          data: { type: "welcome", userId: data.userId },
        };

      case "security_alert":
        return {
          ...baseNotification,
          title: "Alerta de Seguridad",
          body: "Se detectó un nuevo inicio de sesión en tu cuenta.",
          icon: "/icons/security-icon.png",
          requireInteraction: true,
          data: { type: "security_alert", loginInfo: data.loginInfo },
        };

      case "password_changed":
        return {
          ...baseNotification,
          title: "Contraseña Actualizada",
          body: "Tu contraseña ha sido cambiada exitosamente.",
          icon: "/icons/password-icon.png",
          data: { type: "password_changed", timestamp: data.timestamp },
        };

      case "account_locked":
        return {
          ...baseNotification,
          title: "Cuenta Bloqueada",
          body: "Tu cuenta ha sido temporalmente bloqueada por múltiples intentos fallidos.",
          icon: "/icons/lock-icon.png",
          requireInteraction: true,
          data: { type: "account_locked", unlockTime: data.unlockTime },
        };

      case "custom":
        return {
          ...baseNotification,
          title: data.title,
          body: data.body,
          icon: data.icon || baseNotification.icon,
          data: data.customData || {},
        };

      default:
        throw new Error(`Tipo de notificación no reconocido: ${type}`);
    }
  }

  // Validar suscripción push
  async validateSubscription(subscription: PushSubscription): Promise<boolean> {
    try {
      const testNotification: PushNotification = {
        title: "Test",
        body: "Esta es una notificación de prueba",
        silent: true,
      };

      await this.sendNotification({
        subscription,
        notification: testNotification,
      });

      return true;
    } catch (error) {
      return false;
    }
  }

  // Obtener VAPID public key
  getVapidPublicKey(): string {
    if (!this.isInitialized) {
      throw new Error("Servicio de notificaciones push no inicializado");
    }
    return ENV.VAPID_PUBLIC_KEY || "";
  }

  // Verificar si el servicio está configurado
  isConfigured(): boolean {
    return this.isInitialized;
  }
}

// Instancia singleton
export const pushNotificationService = new PushNotificationService();
