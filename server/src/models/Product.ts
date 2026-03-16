import mongoose, { type Document, Schema } from "mongoose";

export interface IProduct extends Document {
  userId: mongoose.Types.ObjectId;
  source: "manual" | "csv" | "shopify";
  externalId?: string;

  name: string;
  category?: string;
  subcategory?: string;
  features: string[];
  benefits: string[];
  price?: number;
  currency: string;
  images: string[];
  brand?: string;
  targetAudience?: string;
  rawData?: Record<string, unknown>;
  tags: string[];

  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    source: {
      type: String,
      enum: ["manual", "csv", "shopify"],
      default: "manual",
    },
    externalId: { type: String },

    name: { type: String, required: true, trim: true },
    category: { type: String },
    subcategory: { type: String },
    features: [{ type: String }],
    benefits: [{ type: String }],
    price: { type: Number },
    currency: { type: String, default: "USD" },
    images: [{ type: String }],
    brand: { type: String },
    targetAudience: { type: String },
    rawData: { type: Schema.Types.Mixed },
    tags: [{ type: String }],
  },
  { timestamps: true }
);

ProductSchema.index({ userId: 1, source: 1 });
ProductSchema.index({ userId: 1, name: "text" });

export default mongoose.model<IProduct>("Product", ProductSchema);
