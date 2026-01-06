import { User, IUser } from "../../domain/users/models/userModel";
import { logInfo, logError } from "../utils/logger";

// Interfaz común para información de usuario OAuth
export interface OAuthUserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
  firstName?: string;
  lastName?: string;
  verifiedEmail?: boolean;
}

export type OAuthProvider = "google" | "facebook" | "github" | "twitter" | "microsoft" | "apple";

// Servicio unificado para manejar usuarios OAuth
export class OAuthService {
  /**
   * Crear o actualizar usuario desde información OAuth
   */
  async createOrUpdateUser(
    provider: OAuthProvider,
    oauthUser: OAuthUserInfo,
    providerIdField: keyof IUser
  ) {
    try {
      // Buscar usuario existente por email o por ID del proveedor
      let user = await User.findOne({
        $or: [
          { email: oauthUser.email },
          { [providerIdField]: oauthUser.id },
        ],
      });

      if (user) {
        // Actualizar información del usuario existente
        user.name = oauthUser.name || user.name;
        user.picture = oauthUser.picture || user.picture;
        user[providerIdField] = oauthUser.id as any;
        user.oauthProvider = provider;
        user.isEmailVerified = oauthUser.verifiedEmail ?? user.isEmailVerified ?? false;
        user.lastLoginAt = new Date();
        
        // Si el usuario no tenía password y ahora viene de OAuth, asegurar que no se requiera
        if (!user.password && provider) {
          // Ya está bien, el password es opcional para OAuth
        }

        await user.save();

        logInfo(`Usuario actualizado desde ${provider}`, { 
          email: user.email,
          provider 
        });
      } else {
        // Crear nuevo usuario
        const userData: any = {
          email: oauthUser.email,
          name: oauthUser.name,
          picture: oauthUser.picture,
          [providerIdField]: oauthUser.id,
          oauthProvider: provider,
          isEmailVerified: oauthUser.verifiedEmail ?? false,
          isActive: true, // Usuarios OAuth se activan automáticamente
          role: "student", // Rol por defecto
          lastLoginAt: new Date(),
        };

        user = new User(userData);
        await user.save();

        logInfo(`Nuevo usuario creado desde ${provider}`, { 
          email: user.email,
          provider 
        });
      }

      return user;
    } catch (error: any) {
      logError(`Error creando/actualizando usuario desde ${provider}:`, error);
      
      // Si el error es por email duplicado, intentar buscar por proveedor
      if (error.code === 11000 && error.keyPattern?.email) {
        const existingUser = await User.findOne({ 
          [providerIdField]: oauthUser.id 
        });
        if (existingUser) {
          return existingUser;
        }
      }
      
      throw new Error(`Error procesando usuario de ${provider}`);
    }
  }

  /**
   * Desvincular cuenta OAuth de un usuario
   */
  async unlinkOAuthProvider(userId: string, provider: OAuthProvider) {
    try {
      const providerIdField = this.getProviderIdField(provider);
      
      const user = await User.findByIdAndUpdate(
        userId,
        {
          $unset: { [providerIdField]: 1 },
          $set: { 
            oauthProvider: null,
          },
        },
        { new: true }
      );

      if (!user) {
        throw new Error("Usuario no encontrado");
      }

      logInfo(`Proveedor ${provider} desvinculado del usuario`, { 
        userId,
        provider 
      });

      return user;
    } catch (error) {
      logError(`Error desvinculando proveedor ${provider}:`, error);
      throw error;
    }
  }

  /**
   * Obtener el nombre del campo de ID según el proveedor
   */
  private getProviderIdField(provider: OAuthProvider): keyof IUser {
    const fieldMap: Record<OAuthProvider, keyof IUser> = {
      google: "googleId",
      facebook: "facebookId",
      github: "githubId",
      twitter: "twitterId",
      microsoft: "microsoftId",
      apple: "appleId",
    };
    return fieldMap[provider];
  }
}

// Instancia singleton
export const oauthService = new OAuthService();

