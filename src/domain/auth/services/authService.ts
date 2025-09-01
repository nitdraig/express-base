import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { sendEmail } from "./emailService";
import dotenv from "dotenv";
import { AppError } from "../../../shared/errors/appError";
import { User } from "../../users/models/userModel";
dotenv.config();

import { ENV } from "../../../shared/config/env";

const JWT_SECRET = ENV.JWT_SECRET;
const FRONTEND_URL = ENV.FRONTEND_ORIGIN;
const JWT_EXPIRES_IN = ENV.JWT_EXPIRES_IN;
const REFRESH_TOKEN_EXPIRES_IN = "7d";
interface TokenPayload {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
}
export const loginUser = async (email: string, password: string) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new AppError(
      "Usuario no encontrado. Contacte con el administrador.",
      401
    );
  }

  if (!user.isActive) {
    throw new AppError(
      "Su cuenta no está verificada. Consulte su correo electrónico para activarlo.",
      403
    );
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AppError("Credenciales incorrectas. Intente nuevamente.", 401);
  }

  const payload = {
    id: user._id,
    email: user.email,
    role: user.role,
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  return token;
};

export const refreshAccessToken = async (
  refreshToken: string
): Promise<string> => {
  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET) as TokenPayload;

    const newToken = jwt.sign(
      {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );
    return newToken;
  } catch (error) {
    throw new Error("Invalid refresh token");
  }
};

export const generateResetToken = async (email: string) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error("Usuario no encontrado");

  const resetToken = jwt.sign({ id: user._id }, JWT_SECRET, {
    expiresIn: "6h",
  });
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
  await user.save();
  return resetToken;
};

export const resetPassword = async (token: any, newPassword: string) => {
  const decoded: any = jwt.verify(token, JWT_SECRET);
  const user = await User.findById(decoded.id);
  if (!user || !user.resetPasswordExpires) {
    throw new Error("Token inválido o expirado");
  }

  const now = Date.now();
  if (user.resetPasswordExpires.getTime() < now) {
    throw new Error("Token expirado");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  await user.save();
};

export const verifyResetToken = (token: string): { email: string } => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { email: string };
    return decoded;
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
};
export const requestPasswordReset = async (email: string) => {
  const user = await User.findOne({ email });
  if (!user) return;

  const resetToken = jwt.sign({ id: user._id }, JWT_SECRET, {
    expiresIn: "15m",
  });

  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
  await user.save();

  await sendPasswordResetEmail(email, resetToken);
};
export const sendPasswordResetEmail = async (email: string, token: string) => {
  const resetUrl = `${FRONTEND_URL}/auth/reset-password?token=${token}`;

  const htmlContent = `
     <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; padding: 20px;">
      <h2 style="color: #b8860b;">🔑 Restablecimiento de contraseña</h2>
           <p>Hola, Hemos recibido una solicitud para restablecer tu contraseña. Haz clic en el botón de abajo para continuar:</p>
      <p>
        <a 
          href="${resetUrl}" 
          style="display: inline-block; padding: 10px 20px; background-color: #b8860b; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;"
        >
          Restablecer contraseña
        </a>
      </p>
      <p>Si no realizaste esta solicitud, puedes ignorar este mensaje de forma segura.</p>
      <hr style="margin: 30px 0;">
      <p style="font-size: 12px; color: #888;">
        Este enlace expirará en 24 horas por motivos de seguridad.
      </p>
    </div>
  `;

  await sendEmail(
    email,
    "Restablecimiento de contraseña en Sigii",
    htmlContent
  );
};
export const verifyActivationToken = async (token: string) => {
  try {
    // 1. Verificar y decodificar el token
    const decoded = jwt.verify(token, JWT_SECRET) as { email: string };
    console.log("Token decodificado:", decoded);

    if (!decoded.email) {
      throw new Error("Token inválido: falta email");
    }

    // 2. Buscar y actualizar el usuario en una sola operación
    const updatedUser = await User.findOneAndUpdate(
      { email: decoded.email },
      { $set: { isActive: true } },
      { new: true } // Retorna el documento actualizado
    );

    if (!updatedUser) {
      throw new Error("Usuario no encontrado");
    }

    console.log("Usuario activado:", updatedUser); // Debug

    return {
      success: true,
      user: {
        id: updatedUser._id,
        email: updatedUser.email,
        isActive: updatedUser.isActive, // Debería ser true
      },
    };
  } catch (error) {
    console.error("Error en verifyActivationToken:", error);
    throw error;
  }
};
