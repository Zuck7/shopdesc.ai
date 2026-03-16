import mongoose, { type Document, Schema } from "mongoose";

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  name: string;
  image?: string;
  googleId?: string;

  brandName?: string;
  defaultTone: "professional" | "casual" | "luxury" | "playful" | "custom";
  customToneInstructions?: string;

  plan: "free" | "starter" | "pro" | "enterprise";
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;

  monthlyGenerations: number;
  generationLimit: number;
  usageResetDate: Date;

  shopifyDomain?: string;
  shopifyAccessToken?: string;

  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String },
    name: { type: String, required: true, trim: true },
    image: { type: String },
    googleId: { type: String, sparse: true },

    brandName: { type: String },
    defaultTone: {
      type: String,
      enum: ["professional", "casual", "luxury", "playful", "custom"],
      default: "professional",
    },
    customToneInstructions: { type: String },

    plan: {
      type: String,
      enum: ["free", "starter", "pro", "enterprise"],
      default: "free",
    },
    stripeCustomerId: { type: String },
    stripeSubscriptionId: { type: String },

    monthlyGenerations: { type: Number, default: 0 },
    generationLimit: { type: Number, default: 5 },
    usageResetDate: { type: Date, default: Date.now },

    shopifyDomain: { type: String },
    shopifyAccessToken: { type: String },
  },
  { timestamps: true }
);

UserSchema.index({ email: 1 });
UserSchema.index({ stripeCustomerId: 1 });

export default mongoose.model<IUser>("User", UserSchema);
