import { Request, Response } from "express";
import {
  registerUser,
  loginUser,
  generateResetToken,
  resetPassword,
} from "../services/authService";

export const register = async (req: Request, res: Response) => {
  const { firstName, lastName, email, password, role } = req.body;
  try {
    await registerUser(firstName, lastName, email, password, role);
    res.status(201).json({ message: "Usuario registrado con éxito" });
  } catch (error) {
    res.status(400).json({ error: error });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const token = await loginUser(email, password);
    res.status(200).json({ token });
  } catch (error) {
    res.status(400).json({ error: error });
  }
};

export const requestPasswordReset = async (req: Request, res: Response) => {
  const { email } = req.body;
  try {
    const resetToken = await generateResetToken(email);
    res
      .status(200)
      .json({ message: "Revisa tu correo para resetear la contraseña" });
  } catch (error) {
    res.status(400).json({ error: error });
  }
};

export const resetPasswordHandler = async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;
  try {
    await resetPassword(token, newPassword);
    res.status(200).json({ message: "Contraseña actualizada con éxito" });
  } catch (error) {
    res.status(400).json({ error: error });
  }
};
