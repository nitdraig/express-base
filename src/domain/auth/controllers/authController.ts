import { Request, Response, NextFunction } from "express";
import {
  loginUser,
  requestPasswordReset,
  resetPassword,
  verifyActivationToken,
  verifyResetToken,
} from "../services/authService";
import jwt from "jsonwebtoken";
import { AppError } from "../../../shared/errors/appError";
import { User } from "../../users/models/userModel";
import { ENV } from "../../../shared/config/env";

export const authController = {
  /**
   * Login de usuario
   */
  login: async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      const token = await loginUser(email, password);
      res.status(200).json({
        success: true,
        token,
        message: "Login exitoso",
      });
    } catch (error: any) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message,
        });
      } else {
        console.error("Login error:", error);
        res.status(500).json({
          success: false,
          error: "Error interno del servidor",
        });
      }
    }
  },

  /**
   * Refresh del token de acceso (usando refresh token)
   */

  refreshToken: async (req: Request, res: Response): Promise<void> => {
    try {
      const { token } = req.body;

      // Verificar y decodificar el token
      const decoded = jwt.verify(token, ENV.JWT_SECRET) as {
        id: string;
        email: string;
        role: string;
      };

      // Buscar usuario en la base de datos
      const user = await User.findById(decoded.id).select("-password");
      if (!user) {
        res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
        });
        return;
      }

      // Verificar si la cuenta está activa
      if (!user.isActive) {
        res.status(403).json({
          success: false,
          message: "Cuenta no activada",
        });
        return;
      }

      // Generar nuevo token
      const newToken = jwt.sign(
        {
          id: user._id,
          email: user.email,
          role: user.role,
        },
        ENV.JWT_SECRET,
        { expiresIn: "1h" }
      );

      res.json({
        success: true,
        token: newToken,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("Refresh token error authController:", error);

      if (error instanceof jwt.TokenExpiredError) {
        res.status(401).json({
          success: false,
          message: "Token expirado",
        });
        return;
      }

      if (error instanceof jwt.JsonWebTokenError) {
        res.status(401).json({
          success: false,
          message: "Token inválido",
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  },
  /**
   * Solicitud de restablecimiento de contraseña
   */
  forgotPassword: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;
      if (!email) {
        throw new Error("Email is required");
      }

      await requestPasswordReset(email);
      res.status(200).json({ message: "Password reset request sent" });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Verificación del token de restablecimiento
   */
  verifyResetToken: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.body;
      if (!token) {
        throw new Error("Token is required");
      }

      const payload = verifyResetToken(token);
      res.status(200).json({ email: payload.email });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Restablecer contraseña (con token válido)
   */
  resetPassword: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) {
        throw new Error("Token y nueva contraseña son requeridos");
      }

      await resetPassword(token, newPassword);
      res.status(200).json({ message: "Contraseña actualizada correctamente" });
    } catch (error) {
      next(error);
    }
  },

  verifyToken: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.body;

      const result = await verifyActivationToken(token);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Logout de usuario
   */
  logout: async (req: Request, res: Response): Promise<void> => {
    try {
      // En una implementación más avanzada, aquí se invalidaría el token
      // Por ahora, solo devolvemos éxito
      res.status(200).json({
        success: true,
        message: "Logout exitoso",
      });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({
        success: false,
        error: "Error durante el logout",
      });
    }
  },
};
