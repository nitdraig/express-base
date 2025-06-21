import { Request, Response, NextFunction } from "express";
import {
  loginUser,
  registerUser,
  requestPasswordReset,
  resetPassword,
  verifyActivationToken,
  verifyResetToken,
} from "../services/authService";

import jwt from "jsonwebtoken";
import { AppError } from "../../../shared/errors/appError";
import { User } from "../../users/models/userModel";

export const authController = {
  /**
   * Login de usuario
   */

  login: async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({ error: "Email y contraseña son requeridos" });
        return;
      }

      const token = await loginUser(email, password);
      res.status(200).json({ token });
    } catch (error: any) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        console.error("Login error:", error);
        res.status(500).json({ error: "Error interno del servidor" });
      }
    }
  },
  register: async (req: Request, res: Response) => {
    const { email, password, role } = req.body;

    try {
      await registerUser(email, password, role);
      res
        .status(201)
        .json({ success: true, message: "User registered successfully" });
    } catch (error) {
      res.status(400).json({ success: false, error: (error as Error).message });
    }
  },
  /**
   * Refresh del token de acceso (usando refresh token)
   */

  refreshToken: async (req: Request, res: Response): Promise<void> => {
    try {
      const { token } = req.body;

      if (!token) {
        res.status(400).json({ message: "Token is required" });
        return;
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        userId: string;
        email: string;
        role: string;
      };

      const user = await User.findById(decoded.userId).select("-password");
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      if (!user.isActive) {
        res.status(403).json({ message: "Account not activated" });
        return;
      }

      const newToken = jwt.sign(
        {
          userId: user._id,
          email: user.email,
          role: user.role,
        },
        process.env.JWT_SECRET!,
        { expiresIn: "1h" }
      );

      res.json({
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
        res.status(401).json({ message: "Token expired" });
        return;
      }

      if (error instanceof jwt.JsonWebTokenError) {
        res.status(401).json({ message: "Invalid token" });
        return;
      }

      res.status(500).json({ message: "Internal server error" });
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

      if (!token) {
        throw new Error("Token no proporcionado");
      }

      const result = await verifyActivationToken(token);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
};
