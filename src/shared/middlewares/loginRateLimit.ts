import rateLimit from "express-rate-limit";
import { User } from "../../domain/users/models/userModel";
import { logWarn, logError } from "../utils/logger";

// Rate limiting para intentos de login
export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 intentos
  message: {
    error: "Demasiados intentos de login. Intente nuevamente en 15 minutos.",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: async (req, res) => {
    try {
      const { email } = req.body;
      if (email) {
        // Incrementar contador de intentos fallidos
        await User.findOneAndUpdate(
          { email },
          {
            $inc: { loginAttempts: 1 },
            $set: { lockUntil: new Date(Date.now() + 15 * 60 * 1000) },
          }
        );

        logWarn(`Multiple login attempts for email: ${email}`, {
          ip: req.ip,
          userAgent: req.get("User-Agent"),
        });
      }

      res.status(429).json({
        error:
          "Demasiados intentos de login. Intente nuevamente en 15 minutos.",
        retryAfter: "15 minutes",
      });
    } catch (error) {
      logError("Error in login rate limit handler", error);
      res.status(429).json({
        error:
          "Demasiados intentos de login. Intente nuevamente en 15 minutos.",
      });
    }
  },
});

// Middleware para verificar si la cuenta está bloqueada
export const checkAccountLock = async (
  req: any,
  res: any,
  next: any
): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      next();
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      next();
      return;
    }

    // Verificar si la cuenta está bloqueada
    if (user.lockUntil && user.lockUntil > new Date()) {
      const remainingTime = Math.ceil(
        (user.lockUntil.getTime() - Date.now()) / 1000 / 60
      );

      logWarn(`Login attempt on locked account: ${email}`, {
        ip: req.ip,
        remainingLockTime: `${remainingTime} minutes`,
      });

      res.status(423).json({
        error: `Cuenta temporalmente bloqueada. Intente nuevamente en ${remainingTime} minutos.`,
        lockUntil: user.lockUntil,
      });
      return;
    }

    // Si la cuenta no está bloqueada, resetear contadores
    if ((user.loginAttempts && user.loginAttempts > 0) || user.lockUntil) {
      await User.findByIdAndUpdate(user._id, {
        loginAttempts: 0,
        lockUntil: null,
      });
    }

    next();
  } catch (error) {
    logError("Error checking account lock", error);
    next();
  }
};
