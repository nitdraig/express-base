import bcrypt from "bcrypt";
import { IUser, User } from "../models/userModel";
import { validatePassword } from "../../../shared/utils/passwordUtils";
import { logInfo, logError } from "../../../shared/utils/logger";
export const getUserProfile = async (userId: string): Promise<IUser | null> => {
  const user = await User.findById(userId).select(
    "-password -resetPasswordToken -resetPasswordExpires"
  );
  return user;
};
export const getAllUsers = async (): Promise<IUser[]> => {
  const users = await User.find(
    {},
    { firstName: 1, lastName: 1, email: 1, role: 1, _id: 0 }
  ).exec();
  return users;
};
export const modifyUserById = async (
  userId: string,
  updateData: Partial<IUser>
): Promise<IUser | null> => {
  const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
    new: true,
  }).select("-password -resetPasswordToken -resetPasswordExpires");
  return updatedUser;
};
export const updateUserProfile = async (
  userId: string,
  updateData: Partial<IUser>
): Promise<IUser | null> => {
  const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
    new: true,
  }).select("-password -resetPasswordToken -resetPasswordExpires");
  return updatedUser;
};
export const changeUserPassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<IUser | null> => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("Usuario no encontrado");
  }

  // Verificar contraseña actual
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    throw new Error("Contraseña actual incorrecta");
  }

  // Validar nueva contraseña
  const validation = validatePassword(newPassword);
  if (!validation.isValid) {
    throw new Error(
      `Nueva contraseña no cumple los requisitos: ${validation.errors.join(", ")}`
    );
  }

  // Verificar que la nueva contraseña no sea igual a la actual
  const isSamePassword = await bcrypt.compare(newPassword, user.password);
  if (isSamePassword) {
    throw new Error("La nueva contraseña no puede ser igual a la actual");
  }

  // Hashear nueva contraseña
  const hashedPassword = await bcrypt.hash(newPassword, 12);
  user.password = hashedPassword;

  // Limpiar tokens de reset
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  await user.save();

  logInfo(`Password changed for user ${userId}`);

  return user;
};
export const deleteUser = async (userId: string): Promise<any> => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("Usuario no encontrado");
  }

  // Soft delete - marcar como inactivo en lugar de eliminar
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      isActive: false,
      deletedAt: new Date(),
    },
    { new: true }
  ).select("-password -resetPasswordToken -resetPasswordExpires");

  logInfo(`User ${userId} marked as inactive`);

  return updatedUser;
};
export const countUsers = async (filters = {}): Promise<number> => {
  return await User.countDocuments(filters);
};
