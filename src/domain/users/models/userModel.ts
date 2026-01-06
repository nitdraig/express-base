import { Schema, model, Document } from "mongoose";

export interface IUser extends Document {
  name?: string;
  role: "superAdmin" | "admin" | "student" | "teacher" | "tutor";
  password?: string;
  email: string;
  isActive: boolean;
  isEmailVerified?: boolean;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  activationToken?: string;
  deletedAt?: Date;
  lastLoginAt?: Date;
  loginAttempts?: number;
  lockUntil?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  // OAuth
  oauthProvider?:
    | "google"
    | "facebook"
    | "github"
    | "twitter"
    | "microsoft"
    | "apple";
  googleId?: string;
  facebookId?: string;
  githubId?: string;
  twitterId?: string;
  microsoftId?: string;
  appleId?: string;
  picture?: string;
  // Push Notifications
  pushSubscriptions?: Array<{
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  }>;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Por favor ingrese un email válido",
      ],
    },
    password: {
      type: String,
      required: false, // Se valida manualmente en pre-save
      minlength: [8, "La contraseña debe tener al menos 8 caracteres"],
      validate: {
        validator: function (this: IUser, value: string | undefined) {
          // Si hay proveedor OAuth, el password no es requerido
          if (this.oauthProvider) {
            return true;
          }
          // Si no hay proveedor OAuth, el password es requerido
          return value !== undefined && value !== null && value.length >= 8;
        },
        message:
          "La contraseña es requerida para usuarios sin OAuth y debe tener al menos 8 caracteres",
      },
    },
    role: {
      type: String,
      enum: ["admin", "superAdmin", "teacher", "student", "tutor"],
      required: true,
      default: "student",
    },
    isActive: { type: Boolean, default: false },
    isEmailVerified: { type: Boolean, default: false },
    activationToken: { type: String, default: null },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
    // OAuth
    oauthProvider: {
      type: String,
      enum: ["google", "facebook", "github", "twitter", "microsoft", "apple"],
      sparse: true,
    },
    googleId: { type: String, sparse: true },
    facebookId: { type: String, sparse: true },
    githubId: { type: String, sparse: true },
    twitterId: { type: String, sparse: true },
    microsoftId: { type: String, sparse: true },
    appleId: { type: String, sparse: true },
    picture: { type: String },
    // Push Notifications
    pushSubscriptions: [
      {
        endpoint: { type: String, required: true },
        keys: {
          p256dh: { type: String, required: true },
          auth: { type: String, required: true },
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.resetPasswordToken;
        delete ret.resetPasswordExpires;
        delete ret.activationToken;
        return ret;
      },
    },
  }
);

// Pre-save hook para validar password
UserSchema.pre("save", function (next) {
  // Si es un nuevo usuario sin OAuth, el password es requerido
  if (!this.isNew || this.oauthProvider) {
    return next();
  }

  // Si no hay password y no hay proveedor OAuth, es un error
  if (!this.password && !this.oauthProvider) {
    return next(new Error("Password es requerido para usuarios sin OAuth"));
  }

  next();
});

export const User = model<IUser>("User", UserSchema);
