// src/domain/auth/services/authService.ts
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../../users/models/userModel";
import { sendEmail } from "./emailService";
import { emailContent, emailResetContent } from "./emailContent/emailContent";
import dotenv from "dotenv";
import { AppError } from "../../../shared/errors/appError";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";
const API = process.env.API_URL || "http://localhost:3000";

export const registerUser = async (
  email: string,
  password: string,
  role: "user" | "admin"
) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error("User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const activationToken = jwt.sign({ email }, JWT_SECRET, {
    expiresIn: "1d",
  });

  const newUser = new User({
    email,
    password: hashedPassword,
    role,
    isActive: false,
    activationToken,
  });

  await newUser.save();

  const activationLink = `${API}/auth/activate-account?token=${activationToken}`;
  const htmlContent = emailContent(email, activationLink);
  await sendEmail(email, "Activa tu cuenta en Sigii", htmlContent);

  return newUser;
};
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

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
  return token;
};
export const verifyActivationToken = async (token: string) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { email: string };

    if (!decoded.email) {
      throw new Error("Token inválido: falta email");
    }

    const updatedUser = await User.findOneAndUpdate(
      { email: decoded.email },
      { $set: { isActive: true } },
      { new: true }
    );

    if (!updatedUser) {
      throw new Error("Usuario no encontrado");
    }

    return {
      success: true,
      user: {
        id: updatedUser._id,
        email: updatedUser.email,
        isActive: updatedUser.isActive,
      },
    };
  } catch (error) {
    console.error("Error en verifyActivationToken:", error);
    throw error;
  }
};
export const generateResetToken = async (email: string) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error("Usuario no encontrado");

  const resetToken = jwt.sign({ id: user._id }, JWT_SECRET, {
    expiresIn: "15m",
  });
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
  await user.save();
  return resetToken;
};
export const requestPasswordReset = async (email: string) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error("Usuario no encontrado");

  const resetToken = jwt.sign({ id: user._id }, JWT_SECRET, {
    expiresIn: "15m",
  });
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
  await user.save();
  return resetToken;
};
export const resetPassword = async (token: string, newPassword: string) => {
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
export const sendPasswordResetEmail = async (email: string, token: string) => {
  const resetUrl = `${API}/auth/reset-password?token=${token}`;

  const htmlContent = emailResetContent(resetUrl);

  await sendEmail(
    email,
    "Restablecimiento de contraseña en Sigii",
    htmlContent
  );
};
export const verifyResetToken = (token: string): { email: string } => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { email: string };
    return decoded;
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
};
