import { Request, Response } from "express";
import { googleOAuthService } from "../../../shared/services/googleOAuthService";
import { generateJWT } from "../../../shared/utils/jwtUtils";
import { logInfo, logError } from "../../../shared/utils/logger";
import { pushNotificationService } from "../../../shared/services/pushNotificationService";

export const googleOAuthController = {
  // Get authorization URL
  getAuthUrl: async (req: Request, res: Response): Promise<void> => {
    try {
      if (!googleOAuthService.isConfigured()) {
        res.status(503).json({
          success: false,
          error: "Google OAuth is not configured",
        });
        return;
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
      logError("Error generating Google authorization URL:", error);
      res.status(500).json({
        success: false,
        error: "Error generating authorization URL",
      });
    }
  },

  // Handle OAuth callback
  handleCallback: async (req: Request, res: Response): Promise<void> => {
    try {
      const { code, state, error } = req.query;

      if (error) {
        logError("Error in OAuth callback:", { error, state });
        res.redirect(
          `${process.env.FRONTEND_ORIGIN}/auth/error?error=${error}`
        );
        return;
      }

      if (!code) {
        res.redirect(
          `${process.env.FRONTEND_ORIGIN}/auth/error?error=no_code`
        );
        return;
      }

      const tokens = await googleOAuthService.exchangeCodeForTokens(
        code as string
      );

      const googleUser = await googleOAuthService.getUserInfo(
        tokens.accessToken
      );

      const user =
        await googleOAuthService.createOrUpdateUserFromGoogle(googleUser);

      const jwtToken = generateJWT({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      if (user.pushSubscriptions && user.pushSubscriptions.length > 0) {
        try {
          const welcomeNotification =
            pushNotificationService.createNotification("welcome", {
              userId: user.id,
            });

          await pushNotificationService.sendNotificationToMany(
            user.pushSubscriptions,
            welcomeNotification
          );
        } catch (pushError) {
          logError("Error sending welcome notification:", pushError);
        }
      }

      logInfo("User authenticated successfully with Google", {
        email: user.email,
        userId: user.id,
      });

      res.redirect(
        `${process.env.FRONTEND_ORIGIN}/auth/success?token=${jwtToken}&state=${state || "default"}`
      );
    } catch (error) {
      logError("Error in Google OAuth callback:", error);
      res.redirect(
        `${process.env.FRONTEND_ORIGIN}/auth/error?error=auth_failed`
      );
    }
  },

  // Verify ID token (for frontend authentication)
  verifyIdToken: async (req: Request, res: Response): Promise<void> => {
    try {
      const { idToken } = req.body;

      if (!googleOAuthService.isConfigured()) {
        res.status(503).json({
          success: false,
          error: "Google OAuth is not configured",
        });
        return;
      }

      const googleUser = await googleOAuthService.verifyIdToken(idToken);

      const user =
        await googleOAuthService.createOrUpdateUserFromGoogle(googleUser);

      const jwtToken = generateJWT({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      logInfo("User authenticated successfully with Google ID Token", {
        email: user.email,
        userId: user.id,
      });

      res.json({
        success: true,
        data: {
          token: jwtToken,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            picture: user.picture,
            isEmailVerified: user.isEmailVerified,
          },
        },
      });
    } catch (error) {
      logError("Error verifying Google ID token:", error);
      res.status(401).json({
        success: false,
        error: "Invalid Google ID token",
      });
    }
  },

  // Refresh access token
  refreshToken: async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      if (!googleOAuthService.isConfigured()) {
        res.status(503).json({
          success: false,
          error: "Google OAuth is not configured",
        });
        return;
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
      logError("Error refreshing Google token:", error);
      res.status(401).json({
        success: false,
        error: "Error refreshing access token",
      });
    }
  },

  // Revoke tokens
  revokeTokens: async (req: Request, res: Response): Promise<void> => {
    try {
      const { accessToken } = req.body;
      const user = req.user;

      if (!googleOAuthService.isConfigured()) {
        res.status(503).json({
          success: false,
          error: "Google OAuth is not configured",
        });
        return;
      }

      if (accessToken) {
        await googleOAuthService.revokeTokens(accessToken);
      }

      if (user) {
        const { User } = await import("../../users/models/userModel");
        await User.findByIdAndUpdate(user.id, {
          $unset: { googleId: 1 },
        });
      }

      logInfo("Google tokens revoked successfully", {
        userId: user?.id,
      });

      res.json({
        success: true,
        message: "Tokens revoked successfully",
      });
    } catch (error) {
      logError("Error revoking Google tokens:", error);
      res.status(500).json({
        success: false,
        error: "Error revoking tokens",
      });
    }
  },
};
