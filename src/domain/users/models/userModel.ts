import { Schema, model, Document, Types } from "mongoose";

export interface IUser extends Document {
  _id: Types.ObjectId;
  id: string;
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
        "Please enter a valid email",
      ],
    },
    password: {
      type: String,
      required: false, // Se valida manualmente en pre-save
      minlength: [8, "Password must be at least 8 characters"],
      validate: {
        validator: function (this: IUser, value: string | undefined) {
          // If there's an OAuth provider, password is not required
          if (this.oauthProvider) {
            return true;
          }
          // If there's no OAuth provider, password is required
          return value !== undefined && value !== null && value.length >= 8;
        },
        message:
          "Password is required for users without OAuth and must be at least 8 characters",
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

// Pre-save hook to validate password
UserSchema.pre("save", function (next) {
  // If it's a new user without OAuth, password is required
  if (!this.isNew || this.oauthProvider) {
    return next();
  }

  // If there's no password and no OAuth provider, it's an error
  if (!this.password && !this.oauthProvider) {
    return next(new Error("Password is required for users without OAuth"));
  }

  next();
});

export const User = model<IUser>("User", UserSchema);
