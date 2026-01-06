import { Request, Response, NextFunction } from "express";
import passport from "passport";
import { generateJWT } from "../../../shared/utils/jwtUtils";
import { logInfo, logError } from "../../../shared/utils/logger";
import { pushNotificationService } from "../../../shared/services/pushNotificationService";

// Función helper para manejar el callback después de la autenticación
const handleOAuthCallback = (provider: string) => {
  return async (req: Request, res: Response) => {
    try {
      // El usuario ya está autenticado por Passport, está en req.user
      const user = (req as any).user;

      if (!user) {
        logError(`Usuario no encontrado en callback de ${provider}`);
        return res.redirect(
          `${process.env.FRONTEND_ORIGIN}/auth/error?error=user_not_found&provider=${provider}`
        );
      }

      // Generar JWT
      const jwtToken = generateJWT({
        id: user._id as string,
        email: user.email,
        role: user.role,
      });

      // Enviar notificación de bienvenida si es nuevo usuario
      if (user.pushSubscriptions && user.pushSubscriptions.length > 0) {
        try {
          const welcomeNotification =
            pushNotificationService.createNotification("welcome", {
              userId: user._id,
            });

          await pushNotificationService.sendNotificationToMany(
            user.pushSubscriptions,
            welcomeNotification
          );
        } catch (pushError) {
          logError("Error enviando notificación de bienvenida:", pushError);
        }
      }

      logInfo(`Usuario autenticado exitosamente con ${provider}`, {
        email: user.email,
        userId: user._id as string,
        provider,
      });

      // Redirigir al frontend con el token
      const state = (req.query.state as string) || "default";
      res.redirect(
        `${process.env.FRONTEND_ORIGIN}/auth/success?token=${jwtToken}&state=${state}&provider=${provider}`
      );
    } catch (error) {
      logError(`Error procesando callback de ${provider}:`, error);
      res.redirect(
        `${process.env.FRONTEND_ORIGIN}/auth/error?error=processing_error&provider=${provider}`
      );
    }
  };
};

export const passportOAuthController = {
  // Iniciar autenticación OAuth
  authenticate: (provider: string) => {
    return passport.authenticate(provider, {
      scope: provider === "github" ? ["user:email"] : ["profile", "email"],
      session: false, // No usamos sesiones, usamos JWT
    });
  },

  // Callback de autenticación OAuth
  handleCallback: (provider: string) => {
    return [
      passport.authenticate(provider, { session: false }),
      handleOAuthCallback(provider),
    ];
  },

  // Obtener proveedores disponibles
  getAvailableProviders: async (req: Request, res: Response) => {
    try {
      const providers = [
        {
          provider: "google",
          configured: !!(
            process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
          ),
        },
        {
          provider: "facebook",
          configured: !!(
            process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET
          ),
        },
        {
          provider: "github",
          configured: !!(
            process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
          ),
        },
      ];

      res.json({
        success: true,
        data: {
          providers: providers.filter((p) => p.configured),
          all: providers,
        },
      });
    } catch (error) {
      logError("Error obteniendo proveedores OAuth:", error);
      res.status(500).json({
        success: false,
        error: "Error obteniendo proveedores OAuth",
      });
    }
  },
};

