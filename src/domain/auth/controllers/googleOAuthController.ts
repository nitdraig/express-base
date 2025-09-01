import { Request, Response } from "express";
import { googleOAuthService } from "../../../shared/services/googleOAuthService";
import { generateJWT } from "../../../shared/utils/jwtUtils";
import { logInfo, logError } from "../../../shared/utils/logger";
import { pushNotificationService } from "../../../shared/services/pushNotificationService";

export const googleOAuthController = {
  // Obtener URL de autorización
  getAuthUrl: async (req: Request, res: Response) => {
    try {
      if (!googleOAuthService.isConfigured()) {
        return res.status(503).json({
          success: false,
          error: "OAuth de Google no está configurado",
        });
      }

      const state = req.query.state as string;
      const authUrl = googleOAuthService.generateAuthUrl(state);

      res.json({
        success: true,
        data: {
          authUrl,
          state: state || "default",
        },
      });
    } catch (error) {
      logError("Error generando URL de autorización de Google:", error);
      res.status(500).json({
        success: false,
        error: "Error generando URL de autorización",
      });
    }
  },

  // Manejar callback de OAuth
  handleCallback: async (req: Request, res: Response) => {
    try {
      const { code, state, error } = req.query;

      if (error) {
        logError("Error en callback de OAuth:", { error, state });
        return res.redirect(
          `${process.env.FRONTEND_ORIGIN}/auth/error?error=${error}`
        );
      }

      if (!code) {
        return res.redirect(
          `${process.env.FRONTEND_ORIGIN}/auth/error?error=no_code`
        );
      }

      // Intercambiar código por tokens
      const tokens = await googleOAuthService.exchangeCodeForTokens(
        code as string
      );

      // Obtener información del usuario
      const googleUser = await googleOAuthService.getUserInfo(
        tokens.accessToken
      );

      // Crear o actualizar usuario
      const user =
        await googleOAuthService.createOrUpdateUserFromGoogle(googleUser);

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

      logInfo("Usuario autenticado exitosamente con Google", {
        email: user.email,
        userId: user._id as string,
      });

      // Redirigir al frontend con el token
      res.redirect(
        `${process.env.FRONTEND_ORIGIN}/auth/success?token=${jwtToken}&state=${state || "default"}`
      );
    } catch (error) {
      logError("Error en callback de OAuth de Google:", error);
      res.redirect(
        `${process.env.FRONTEND_ORIGIN}/auth/error?error=auth_failed`
      );
    }
  },

  // Verificar token ID (para autenticación desde frontend)
  verifyIdToken: async (req: Request, res: Response) => {
    try {
      const { idToken } = req.body;

      if (!googleOAuthService.isConfigured()) {
        return res.status(503).json({
          success: false,
          error: "OAuth de Google no está configurado",
        });
      }

      // Verificar token ID
      const googleUser = await googleOAuthService.verifyIdToken(idToken);

      // Crear o actualizar usuario
      const user =
        await googleOAuthService.createOrUpdateUserFromGoogle(googleUser);

      // Generar JWT
      const jwtToken = generateJWT({
        id: user._id as string,
        email: user.email,
        role: user.role,
      });

      logInfo("Usuario autenticado exitosamente con Google ID Token", {
        email: user.email,
        userId: user._id,
      });

      res.json({
        success: true,
        data: {
          token: jwtToken,
          user: {
            id: user._id as string,
            email: user.email,
            name: user.name,
            role: user.role,
            picture: user.picture,
            isEmailVerified: user.isEmailVerified,
          },
        },
      });
    } catch (error) {
      logError("Error verificando token ID de Google:", error);
      res.status(401).json({
        success: false,
        error: "Token ID de Google inválido",
      });
    }
  },

  // Refrescar token de acceso
  refreshToken: async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;

      if (!googleOAuthService.isConfigured()) {
        return res.status(503).json({
          success: false,
          error: "OAuth de Google no está configurado",
        });
      }

      const tokens = await googleOAuthService.refreshAccessToken(refreshToken);

      res.json({
        success: true,
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiryDate
            ? Math.floor((tokens.expiryDate - Date.now()) / 1000)
            : undefined,
        },
      });
    } catch (error) {
      logError("Error refrescando token de Google:", error);
      res.status(401).json({
        success: false,
        error: "Error refrescando token de acceso",
      });
    }
  },

  // Revocar tokens
  revokeTokens: async (req: Request, res: Response) => {
    try {
      const { accessToken } = req.body;
      const user = (req as any).user;

      if (!googleOAuthService.isConfigured()) {
        return res.status(503).json({
          success: false,
          error: "OAuth de Google no está configurado",
        });
      }

      if (accessToken) {
        await googleOAuthService.revokeTokens(accessToken);
      }

      // Limpiar googleId del usuario
      if (user) {
        const { User } = await import("../../users/models/userModel");
        await User.findByIdAndUpdate(user.id, {
          $unset: { googleId: 1 },
        });
      }

      logInfo("Tokens de Google revocados exitosamente", {
        userId: user?.id,
      });

      res.json({
        success: true,
        message: "Tokens revocados exitosamente",
      });
    } catch (error) {
      logError("Error revocando tokens de Google:", error);
      res.status(500).json({
        success: false,
        error: "Error revocando tokens",
      });
    }
  },
};
