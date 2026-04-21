import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import {
  Strategy as GitHubStrategy,
  type Profile as GitHubProfile,
} from "passport-github2";
import { ENV } from "./env";
import { oauthService } from "../services/oauthService";
import { logInfo, logError } from "../utils/logger";
import { User } from "../../domain/users/models/userModel";

// User serialization for sessions (if you use them)
passport.serializeUser((user: Express.User, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user ?? false);
  } catch (error) {
    done(error, false);
  }
});

// Google strategy
if (ENV.GOOGLE_CLIENT_ID && ENV.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: ENV.GOOGLE_CLIENT_ID,
        clientSecret: ENV.GOOGLE_CLIENT_SECRET,
        callbackURL: `${ENV.API_URL}/auth/oauth/google/callback`,
        scope: ["profile", "email"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const oauthUserInfo = {
            id: profile.id,
            email: profile.emails?.[0]?.value || "",
            name: profile.displayName || "",
            picture: profile.photos?.[0]?.value,
            firstName: profile.name?.givenName,
            lastName: profile.name?.familyName,
            verifiedEmail: profile.emails?.[0]?.verified || false,
          };

          const user = await oauthService.createOrUpdateUser(
            "google",
            oauthUserInfo,
            "googleId"
          );

          logInfo("User authenticated with Google via Passport", {
            email: user.email,
            userId: user._id,
          });

          return done(null, user);
        } catch (error) {
          logError("Error in Google strategy:", error);
          return done(error, false);
        }
      }
    )
  );
}

// Facebook strategy
if (ENV.FACEBOOK_APP_ID && ENV.FACEBOOK_APP_SECRET) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: ENV.FACEBOOK_APP_ID,
        clientSecret: ENV.FACEBOOK_APP_SECRET,
        callbackURL: `${ENV.API_URL}/auth/oauth/facebook/callback`,
        profileFields: ["id", "displayName", "photos", "email", "first_name", "last_name"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const oauthUserInfo = {
            id: profile.id,
            email: profile.emails?.[0]?.value || "",
            name: profile.displayName || "",
            picture: profile.photos?.[0]?.value,
            firstName: profile.name?.givenName,
            lastName: profile.name?.familyName,
            verifiedEmail: true, // Facebook verifica emails
          };

          const user = await oauthService.createOrUpdateUser(
            "facebook",
            oauthUserInfo,
            "facebookId"
          );

          logInfo("User authenticated with Facebook via Passport", {
            email: user.email,
            userId: user._id,
          });

          return done(null, user);
        } catch (error) {
          logError("Error in Facebook strategy:", error);
          return done(error, false);
        }
      }
    )
  );
}

// GitHub strategy
if (ENV.GITHUB_CLIENT_ID && ENV.GITHUB_CLIENT_SECRET) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: ENV.GITHUB_CLIENT_ID,
        clientSecret: ENV.GITHUB_CLIENT_SECRET,
        callbackURL: `${ENV.API_URL}/auth/oauth/github/callback`,
        scope: ["user:email"],
      },
      async (
        accessToken: string,
        refreshToken: string,
        profile: GitHubProfile,
        done: (
          err: Error | null | unknown,
          user?: Express.User | false,
          info?: object
        ) => void
      ) => {
        try {
          // GitHub may not provide email in public profile
          // We need to get it from the API if not available
          let email = profile.emails?.[0]?.value || "";

          if (!email) {
            // Try to get email from GitHub API using native fetch
            try {
              const emailResponse = await fetch("https://api.github.com/user/emails", {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  Accept: "application/vnd.github.v3+json",
                },
              });

              if (emailResponse.ok) {
                const emails = (await emailResponse.json()) as Array<{
                  email: string;
                  primary?: boolean;
                }>;
                const primaryEmail = emails.find((e) => e.primary);
                email = primaryEmail?.email || emails[0]?.email || "";
              } else {
                email = `${profile.username}@users.noreply.github.com`;
              }
            } catch (emailError) {
              logError("Error getting email from GitHub:", emailError);
              email = `${profile.username}@users.noreply.github.com`;
            }
          }

          const oauthUserInfo = {
            id: profile.id.toString(),
            email: email,
            name: profile.displayName || profile.username || "",
            picture: profile.photos?.[0]?.value,
            verifiedEmail: true, // GitHub verifica emails
          };

          const user = await oauthService.createOrUpdateUser(
            "github",
            oauthUserInfo,
            "githubId"
          );

          logInfo("User authenticated with GitHub via Passport", {
            email: user.email,
            userId: user._id,
          });

          return done(null, user);
        } catch (error) {
          logError("Error in GitHub strategy:", error);
          return done(error, false);
        }
      }
    )
  );
}

export default passport;

