import { OAuth2Client } from "google-auth-library";
import { ENV } from "../config/env";
import { logInfo, logError } from "../utils/logger";
import { User } from "../../domain/users/models/userModel";

// Tipos para OAuth
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

// Servicio de OAuth de Google
export class GoogleOAuthService {
  private oauth2Client: OAuth2Client;

  constructor() {
    this.oauth2Client = new OAuth2Client(
      ENV.GOOGLE_CLIENT_ID,
      ENV.GOOGLE_CLIENT_SECRET,
      `${ENV.API_URL}/auth/google/callback`
    );
  }

  // Generar URL de autorización
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

  // Intercambiar código por tokens
  async exchangeCodeForTokens(code: string): Promise<OAuthTokens> {
    try {
      const { tokens }: any = await this.oauth2Client.getToken(code);

      logInfo("Tokens de Google obtenidos exitosamente", {
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
      logError("Error intercambiando código por tokens:", error);
      throw new Error("Error obteniendo tokens de Google");
    }
  }

  // Obtener información del usuario
  async getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    try {
      this.oauth2Client.setCredentials({ access_token: accessToken });

      const oauth2 = this.oauth2Client;
      const userInfo = await oauth2.request({
        url: "https://www.googleapis.com/oauth2/v2/userinfo",
      });

      const data = userInfo.data as GoogleUserInfo;

      logInfo("Información de usuario de Google obtenida", {
        email: data.email,
        name: data.name,
      });

      return data;
    } catch (error) {
      logError("Error obteniendo información del usuario de Google:", error);
      throw new Error("Error obteniendo información del usuario");
    }
  }

  // Verificar token ID (para autenticación desde frontend)
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

      logInfo("Token ID de Google verificado exitosamente", {
        email: userInfo.email,
        name: userInfo.name,
      });

      return userInfo;
    } catch (error) {
      logError("Error verificando token ID de Google:", error);
      throw new Error("Token ID de Google inválido");
    }
  }

  // Refrescar token de acceso
  async refreshAccessToken(refreshToken: string): Promise<OAuthTokens> {
    try {
      this.oauth2Client.setCredentials({ refresh_token: refreshToken });

      const { credentials }: any = await this.oauth2Client.refreshAccessToken();

      logInfo("Token de acceso refrescado exitosamente");

      return {
        accessToken: credentials.accessToken!,
        refreshToken: credentials.refreshToken || refreshToken,
        scope: credentials.scope!,
        tokenType: credentials.tokenType!,
        expiryDate: credentials.expiryDate as number,
      };
    } catch (error) {
      logError("Error refrescando token de acceso:", error);
      throw new Error("Error refrescando token de acceso");
    }
  }

  // Revocar tokens
  async revokeTokens(accessToken: string): Promise<void> {
    try {
      await this.oauth2Client.revokeToken(accessToken);
      logInfo("Tokens de Google revocados exitosamente");
    } catch (error) {
      logError("Error revocando tokens de Google:", error);
      throw new Error("Error revocando tokens");
    }
  }

  // Crear o actualizar usuario desde Google
  async createOrUpdateUserFromGoogle(googleUser: GoogleUserInfo) {
    try {
      // Buscar usuario existente por email
      let user = await User.findOne({ email: googleUser.email });

      if (user) {
        // Actualizar información del usuario
        user.name = googleUser.name;
        user.picture = googleUser.picture;
        user.googleId = googleUser.id;
        user.isEmailVerified = googleUser.verifiedEmail;
        user.lastLoginAt = new Date();

        await user.save();

        logInfo("Usuario actualizado desde Google", { email: user.email });
      } else {
        // Crear nuevo usuario
        user = new User({
          email: googleUser.email,
          name: googleUser.name,
          picture: googleUser.picture,
          googleId: googleUser.id,
          isEmailVerified: googleUser.verifiedEmail,
          isActive: true,
          role: "user",
          lastLoginAt: new Date(),
        });

        await user.save();

        logInfo("Nuevo usuario creado desde Google", { email: user.email });
      }

      return user;
    } catch (error) {
      logError("Error creando/actualizando usuario desde Google:", error);
      throw new Error("Error procesando usuario de Google");
    }
  }

  // Verificar si el servicio está configurado
  isConfigured(): boolean {
    return !!(ENV.GOOGLE_CLIENT_ID && ENV.GOOGLE_CLIENT_SECRET);
  }
}

// Instancia singleton
export const googleOAuthService = new GoogleOAuthService();
