import { Request, Response } from "express";
import {
  changeUserPassword,
  countUsers,
  getUserProfile,
  updateUserProfile,
  deleteUser as deleteUserService,
} from "../services/userServices";

export const getProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const user = await getUserProfile(userId);

    if (!user) {
      res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
      return;
    }

    // No enviar información sensible
    const {
      password,
      resetPasswordToken,
      resetPasswordExpires,
      activationToken,
      ...safeUser
    } = user.toObject();

    res.json({
      success: true,
      user: safeUser,
    });
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

    // Solo permitir actualizar campos seguros
    const allowedFields = ["email"];
    const filteredData = Object.keys(updateData)
      .filter((key) => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updateData[key];
        return obj;
      }, {} as any);

    const updatedUser = await updateUserProfile(userId, filteredData);

    if (!updatedUser) {
      res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
      return;
    }

    // No enviar información sensible
    const {
      password,
      resetPasswordToken,
      resetPasswordExpires,
      activationToken,
      ...safeUser
    } = updatedUser.toObject();

    res.json({
      success: true,
      user: safeUser,
      message: "Perfil actualizado exitosamente",
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar el perfil",
    });
  }
};
export const changePassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { currentPassword, newPassword } = req.body;

    await changeUserPassword(userId, currentPassword, newPassword);

    res.json({
      success: true,
      message: "Contraseña cambiada exitosamente",
    });
  } catch (error: any) {
    console.error("Error changing password:", error);

    const statusCode = error.message?.includes("incorrect") ? 400 : 500;
    const message = error.message || "Error al cambiar la contraseña";

    res.status(statusCode).json({
      success: false,
      message,
    });
  }
};
export const getUsersCount = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const count = await countUsers();
    res.json({ success: true, count });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error al contar usuarios" });
  }
};

export const deleteUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const deletedUser = await deleteUserService(id);

    if (!deletedUser) {
      res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
      return;
    }

    res.json({
      success: true,
      message: "Usuario eliminado exitosamente",
      user: deletedUser,
    });
  } catch (error: any) {
    console.error("Error deleting user:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Error al eliminar usuario",
    });
  }
};
