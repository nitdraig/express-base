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

export type OAuthProvider =
  | "google"
  | "facebook"
  | "github"
  | "twitter"
  | "microsoft"
  | "apple";

export type OAuthProviderIdField =
  | "googleId"
  | "facebookId"
  | "githubId"
  | "twitterId"
  | "microsoftId"
  | "appleId";

function setProviderIdOnUser(
  user: IUser,
  field: OAuthProviderIdField,
  id: string
): void {
  switch (field) {
    case "googleId":
      user.googleId = id;
      return;
    case "facebookId":
      user.facebookId = id;
      return;
    case "githubId":
      user.githubId = id;
      return;
    case "twitterId":
      user.twitterId = id;
      return;
    case "microsoftId":
      user.microsoftId = id;
      return;
    case "appleId":
      user.appleId = id;
      return;
  }
}

function isMongoDuplicateKeyError(
  error: unknown
): error is { code: number; keyPattern?: { email?: boolean } } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === 11000
  );
}

// Unified service to handle OAuth users
export class OAuthService {
  /**
   * Create or update user from OAuth information
   */
  async createOrUpdateUser(
    provider: OAuthProvider,
    oauthUser: OAuthUserInfo,
    providerIdField: OAuthProviderIdField
  ): Promise<IUser> {
    try {
      const providerFilter: Record<string, string> = {
        [providerIdField]: oauthUser.id,
      };

      let user = await User.findOne({
        $or: [{ email: oauthUser.email }, providerFilter],
      });

      if (user) {
        user.name = oauthUser.name || user.name;
        user.picture = oauthUser.picture || user.picture;
        setProviderIdOnUser(user, providerIdField, oauthUser.id);
        user.oauthProvider = provider;
        user.isEmailVerified =
          oauthUser.verifiedEmail ?? user.isEmailVerified ?? false;
        user.lastLoginAt = new Date();

        await user.save();

        logInfo(`User updated from ${provider}`, {
          email: user.email,
          provider,
        });
      } else {
        const newUser = new User({
          email: oauthUser.email,
          name: oauthUser.name,
          picture: oauthUser.picture,
          oauthProvider: provider,
          isEmailVerified: oauthUser.verifiedEmail ?? false,
          isActive: true,
          role: "student",
          lastLoginAt: new Date(),
        });
        setProviderIdOnUser(newUser, providerIdField, oauthUser.id);
        await newUser.save();
        user = newUser;

        logInfo(`New user created from ${provider}`, {
          email: user.email,
          provider,
        });
      }

      return user;
    } catch (error: unknown) {
      logError(`Error creating/updating user from ${provider}:`, error);

      if (isMongoDuplicateKeyError(error) && error.keyPattern?.email) {
        const existingUser = await User.findOne({
          [providerIdField]: oauthUser.id,
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
          $unset: { [providerIdField]: 1, oauthProvider: 1 },
        },
        { new: true }
      );

      if (!user) {
        throw new Error("User not found");
      }

      logInfo(`Provider ${provider} unlinked from user`, {
        userId,
        provider,
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
  private getProviderIdField(provider: OAuthProvider): OAuthProviderIdField {
    const fieldMap: Record<OAuthProvider, OAuthProviderIdField> = {
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
