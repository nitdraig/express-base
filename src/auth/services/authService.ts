// src/domain/auth/services/authService.ts
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../models/userModel";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

export const registerUser = async (
  firstName: string,
  lastName: string,
  email: string,
  password: string,
  role: "admin" | "user"
) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({
    firstName,
    lastName,
    email,
    password: hashedPassword,
    role,
  });
  await newUser.save();
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
export const loginUser = async (email: string, password: string) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error("Usuario no encontrado");

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) throw new Error("Contraseña incorrecta");

  const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
    expiresIn: "1h",
  });
  return token;
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
