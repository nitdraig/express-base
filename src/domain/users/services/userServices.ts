import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { IUser, User } from "../models/userModel";

dotenv.config();
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
    throw new Error("User not found");
  }
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    throw new Error("Current password is incorrect");
  }
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  await user.save();
  return user;
};
export const deleteUser = async (userId: string): Promise<any> => {
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { isActive: false },
    { new: true }
  ).select("-password -resetPasswordToken -resetPasswordExpires");
  return updatedUser;
};
export const countUsers = async (filters = {}): Promise<number> => {
  return await User.countDocuments(filters);
};
