import { Request, Response } from "express";
import {
  changeUserPassword,
  countUsers,
  getUserProfile,
  updateUserProfile,
} from "../services/userServices";

export const getProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const user = await getUserProfile(userId);
    if (!user) {
      res
        .status(404)
        .json({ success: false, message: "Usuario no encontrado" });
      return;
    }
    res.json({ success: true, user });
  } catch (error) {
    console.error("Error al obtener el perfil:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener el perfil del usuario",
    });
  }
};
export const updateProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const updateData = req.body;
    const updatedUser = await updateUserProfile(userId, updateData);
    if (!updatedUser) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }
    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Error updating profile:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update profile" });
  }
};
export const changePassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
      return;
    }
    await changeUserPassword(userId, currentPassword, newPassword);
    res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res
      .status(400)
      .json({ success: false, message: error || "Failed to change password" });
  }
};
export const getUsersCount = async (req: Request, res: Response) => {
  try {
    const count = await countUsers();
    res.json({ success: true, count });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error al contar usuarios" });
  }
};
