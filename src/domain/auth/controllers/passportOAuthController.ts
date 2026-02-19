import { Request, Response, NextFunction } from "express";
import passport from "passport";
import { generateJWT } from "../../../shared/utils/jwtUtils";
import { logInfo, logError } from "../../../shared/utils/logger";
import { pushNotificationService } from "../../../shared/services/pushNotificationService";

// Helper function to handle callback after authentication
const handleOAuthCallback = (provider: string) => {
  return async (req: Request, res: Response) => {
    try {
      // User is already authenticated by Passport, it's in req.user
      const user = (req as any).user;

      if (!user) {
        logError(`User not found in ${provider} callback`);
        return res.redirect(
          `${process.env.FRONTEND_ORIGIN}/auth/error?error=user_not_found&provider=${provider}`
        );
      }

      // Generate JWT
      const jwtToken = generateJWT({
        id: user._id as string,
        email: user.email,
        role: user.role,
      });

      // Send welcome notification if new user
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
          logError("Error sending welcome notification:", pushError);
        }
      }

      logInfo(`User authenticated successfully with ${provider}`, {
        email: user.email,
        userId: user._id as string,
        provider,
      });

      // Redirect to frontend with token
      const state = (req.query.state as string) || "default";
      res.redirect(
        `${process.env.FRONTEND_ORIGIN}/auth/success?token=${jwtToken}&state=${state}&provider=${provider}`
      );
    } catch (error) {
      logError(`Error processing ${provider} callback:`, error);
      res.redirect(
        `${process.env.FRONTEND_ORIGIN}/auth/error?error=processing_error&provider=${provider}`
      );
    }
  };
};

export const passportOAuthController = {
  // Start OAuth authentication
  authenticate: (provider: string) => {
    return passport.authenticate(provider, {
      scope: provider === "github" ? ["user:email"] : ["profile", "email"],
      session: false, // We don't use sessions, we use JWT
    });
  },

  // OAuth authentication callback
  handleCallback: (provider: string) => {
    return [
      passport.authenticate(provider, { session: false }),
      handleOAuthCallback(provider),
    ];
  },

  // Get available providers
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
      logError("Error getting OAuth providers:", error);
      res.status(500).json({
        success: false,
        error: "Error getting OAuth providers",
      });
    }
  },
};
