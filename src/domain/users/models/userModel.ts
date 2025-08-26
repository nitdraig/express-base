import { Schema, model, Document } from "mongoose";

export interface IUser extends Document {
  role: "superAdmin" | "admin" | "student" | "teacher" | "tutor";
  password: string;
  email: string;
  isActive: boolean;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  activationToken?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "superAdmin", "teacher", "student", "tutor"],
      required: true,
    },
    isActive: { type: Boolean, default: false },
    activationToken: { type: String, default: null },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
  },
  { timestamps: true }
);

export const User = model<IUser>("User", UserSchema);
