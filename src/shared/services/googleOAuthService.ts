import { OAuth2Client } from "google-auth-library";
import { ENV } from "../config/env";
import { logInfo, logError } from "../utils/logger";
import { User } from "../../domain/users/models/userModel";

// Types for OAuth
export interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture: string;
  givenName?: string;
  familyName?: string;
  locale?: string;
  verifiedEmail: boolean;
}

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  scope: string;
  tokenType: string;
  expiryDate?: number;
}

// Google OAuth service
export class GoogleOAuthService {
  private oauth2Client: OAuth2Client;

  constructor() {
    this.oauth2Client = new OAuth2Client(
      ENV.GOOGLE_CLIENT_ID,
      ENV.GOOGLE_CLIENT_SECRET,
      `${ENV.API_URL}/auth/google/callback`
    );
  }

  // Generate authorization URL
  generateAuthUrl(state?: string): string {
    const scopes = [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      prompt: "consent",
      state: state || "default",
    });
  }

  // Exchange code for tokens
  async exchangeCodeForTokens(code: string): Promise<OAuthTokens> {
    try {
      const { tokens }: any = await this.oauth2Client.getToken(code);

      logInfo("Google tokens obtained successfully", {
        hasAccessToken: !!tokens.accessToken,
        hasRefreshToken: !!tokens.refreshToken,
      });

      return {
        accessToken: tokens.accessToken!,
        refreshToken: tokens.refreshToken,
        scope: tokens.scope!,
        tokenType: tokens.tokenType!,
        expiryDate: tokens.expiryDate,
      };
    } catch (error) {
      logError("Error exchanging code for tokens:", error);
      throw new Error("Error getting Google tokens");
    }
  }

  // Get user information
  async getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    try {
      this.oauth2Client.setCredentials({ access_token: accessToken });

      const oauth2 = this.oauth2Client;
      const userInfo = await oauth2.request({
        url: "https://www.googleapis.com/oauth2/v2/userinfo",
      });

      const data = userInfo.data as GoogleUserInfo;

      logInfo("Google user information obtained", {
        email: data.email,
        name: data.name,
      });

      return data;
    } catch (error) {
      logError("Error getting Google user information:", error);
      throw new Error("Error getting user information");
    }
  }

  // Verify ID token (for frontend authentication)
  async verifyIdToken(idToken: string): Promise<GoogleUserInfo> {
    try {
      const ticket = await this.oauth2Client.verifyIdToken({
        idToken,
        audience: ENV.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload()!;

      const userInfo: GoogleUserInfo = {
        id: payload.sub!,
        email: payload.email!,
        name: payload.name!,
        picture: payload.picture!,
        givenName: payload.given_name,
        familyName: payload.family_name,
        locale: payload.locale,
        verifiedEmail: payload.email_verified!,
      };

      logInfo("Google ID token verified successfully", {
        email: userInfo.email,
        name: userInfo.name,
      });

      return userInfo;
    } catch (error) {
      logError("Error verifying Google ID token:", error);
      throw new Error("Invalid Google ID token");
    }
  }

  // Refresh access token
  async refreshAccessToken(refreshToken: string): Promise<OAuthTokens> {
    try {
      this.oauth2Client.setCredentials({ refresh_token: refreshToken });

      const { credentials }: any = await this.oauth2Client.refreshAccessToken();

      logInfo("Access token refreshed successfully");

      return {
        accessToken: credentials.accessToken!,
        refreshToken: credentials.refreshToken || refreshToken,
        scope: credentials.scope!,
        tokenType: credentials.tokenType!,
        expiryDate: credentials.expiryDate as number,
      };
    } catch (error) {
      logError("Error refreshing access token:", error);
      throw new Error("Error refreshing access token");
    }
  }

  // Revoke tokens
  async revokeTokens(accessToken: string): Promise<void> {
    try {
      await this.oauth2Client.revokeToken(accessToken);
      logInfo("Google tokens revoked successfully");
    } catch (error) {
      logError("Error revoking Google tokens:", error);
      throw new Error("Error revoking tokens");
    }
  }

  // Create or update user from Google
  async createOrUpdateUserFromGoogle(googleUser: GoogleUserInfo) {
    const { oauthService } = await import("./oauthService");
    
    const oauthUserInfo = {
      id: googleUser.id,
      email: googleUser.email,
      name: googleUser.name,
      picture: googleUser.picture,
      firstName: googleUser.givenName,
      lastName: googleUser.familyName,
      verifiedEmail: googleUser.verifiedEmail,
    };

    return oauthService.createOrUpdateUser("google", oauthUserInfo, "googleId");
  }

  // Alias for compatibility with unified controller
  async createOrUpdateUserFromProvider(googleUser: GoogleUserInfo) {
    return this.createOrUpdateUserFromGoogle(googleUser);
  }

  // Check if service is configured
  isConfigured(): boolean {
    return !!(ENV.GOOGLE_CLIENT_ID && ENV.GOOGLE_CLIENT_SECRET);
  }
}

// Singleton instance
export const googleOAuthService = new GoogleOAuthService();
