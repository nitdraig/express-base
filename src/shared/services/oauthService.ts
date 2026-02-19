import { User, IUser } from "../../domain/users/models/userModel";
import { logInfo, logError } from "../utils/logger";

// Common interface for OAuth user information
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

// Unified service to handle OAuth users
export class OAuthService {
  /**
   * Create or update user from OAuth information
   */
  async createOrUpdateUser(
    provider: OAuthProvider,
    oauthUser: OAuthUserInfo,
    providerIdField: keyof IUser
  ) {
    try {
      // Find existing user by email or provider ID
      let user = await User.findOne({
        $or: [
          { email: oauthUser.email },
          { [providerIdField]: oauthUser.id },
        ],
      });

      if (user) {
        // Update existing user information
        user.name = oauthUser.name || user.name;
        user.picture = oauthUser.picture || user.picture;
        user[providerIdField] = oauthUser.id as any;
        user.oauthProvider = provider;
        user.isEmailVerified = oauthUser.verifiedEmail ?? user.isEmailVerified ?? false;
        user.lastLoginAt = new Date();
        
        // If user didn't have password and now comes from OAuth, ensure it's not required
        if (!user.password && provider) {
          // Ya está bien, el password es opcional para OAuth
        }

        await user.save();

        logInfo(`User updated from ${provider}`, { 
          email: user.email,
          provider 
        });
      } else {
        // Create new user
        const userData: any = {
          email: oauthUser.email,
          name: oauthUser.name,
          picture: oauthUser.picture,
          [providerIdField]: oauthUser.id,
          oauthProvider: provider,
          isEmailVerified: oauthUser.verifiedEmail ?? false,
          isActive: true, // OAuth users are automatically activated
          role: "student", // Default role
          lastLoginAt: new Date(),
        };

        user = new User(userData);
        await user.save();

        logInfo(`New user created from ${provider}`, { 
          email: user.email,
          provider 
        });
      }

      return user;
    } catch (error: any) {
      logError(`Error creating/updating user from ${provider}:`, error);
      
      // If error is due to duplicate email, try to find by provider
      if (error.code === 11000 && error.keyPattern?.email) {
        const existingUser = await User.findOne({ 
          [providerIdField]: oauthUser.id 
        });
        if (existingUser) {
          return existingUser;
        }
      }
      
      throw new Error(`Error processing user from ${provider}`);
    }
  }

  /**
   * Unlink OAuth account from a user
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
        throw new Error("User not found");
      }

      logInfo(`Provider ${provider} unlinked from user`, { 
        userId,
        provider 
      });

      return user;
    } catch (error) {
      logError(`Error unlinking provider ${provider}:`, error);
      throw error;
    }
  }

  /**
   * Get ID field name according to provider
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

// Singleton instance
export const oauthService = new OAuthService();

