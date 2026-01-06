import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import { Strategy as GitHubStrategy } from "passport-github2";
import { ENV } from "./env";
import { oauthService } from "../services/oauthService";
import { generateJWT } from "../utils/jwtUtils";
import { logInfo, logError } from "../utils/logger";
import { User } from "../../domain/users/models/userModel";

// Serialización de usuario para sesiones (si las usas)
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Estrategia de Google
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

          logInfo("Usuario autenticado con Google via Passport", {
            email: user.email,
            userId: user._id,
          });

          return done(null, user);
        } catch (error) {
          logError("Error en estrategia de Google:", error);
          return done(error, null);
        }
      }
    )
  );
}

// Estrategia de Facebook
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

          logInfo("Usuario autenticado con Facebook via Passport", {
            email: user.email,
            userId: user._id,
          });

          return done(null, user);
        } catch (error) {
          logError("Error en estrategia de Facebook:", error);
          return done(error, null);
        }
      }
    )
  );
}

// Estrategia de GitHub
if (ENV.GITHUB_CLIENT_ID && ENV.GITHUB_CLIENT_SECRET) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: ENV.GITHUB_CLIENT_ID,
        clientSecret: ENV.GITHUB_CLIENT_SECRET,
        callbackURL: `${ENV.API_URL}/auth/oauth/github/callback`,
        scope: ["user:email"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // GitHub puede no proporcionar email en el perfil público
          // Necesitamos obtenerlo de la API si no está disponible
          let email = profile.emails?.[0]?.value || "";

          if (!email) {
            // Intentar obtener email de la API de GitHub usando fetch nativo
            try {
              const emailResponse = await fetch("https://api.github.com/user/emails", {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  Accept: "application/vnd.github.v3+json",
                },
              });

              if (emailResponse.ok) {
                const emails = await emailResponse.json();
                const primaryEmail = emails.find((e: any) => e.primary);
                email = primaryEmail?.email || emails[0]?.email || "";
              } else {
                email = `${profile.username}@users.noreply.github.com`;
              }
            } catch (emailError) {
              logError("Error obteniendo email de GitHub:", emailError);
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

          logInfo("Usuario autenticado con GitHub via Passport", {
            email: user.email,
            userId: user._id,
          });

          return done(null, user);
        } catch (error) {
          logError("Error en estrategia de GitHub:", error);
          return done(error, null);
        }
      }
    )
  );
}

export default passport;

