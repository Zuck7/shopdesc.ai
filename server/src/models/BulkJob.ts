import mongoose, { type Document, Schema } from "mongoose";

export interface IBulkJob extends Document {
  userId: mongoose.Types.ObjectId;

  status: "queued" | "processing" | "completed" | "failed" | "cancelled";
  platform: "shopify" | "amazon" | "etsy" | "woocommerce" | "generic";
  tone: "professional" | "casual" | "luxury" | "playful" | "custom";
  includeCompetitor: boolean;

  productIds: mongoose.Types.ObjectId[];
  totalProducts: number;
  completedProducts: number;
  failedProducts: number;

  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
}

const BulkJobSchema = new Schema<IBulkJob>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["queued", "processing", "completed", "failed", "cancelled"],
      default: "queued",
    },
    platform: {
      type: String,
      enum: ["shopify", "amazon", "etsy", "woocommerce", "generic"],
      default: "generic",
    },
    tone: {
      type: String,
      enum: ["professional", "casual", "luxury", "playful", "custom"],
      default: "professional",
    },
    includeCompetitor: { type: Boolean, default: false },

    productIds: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    totalProducts: { type: Number, default: 0 },
    completedProducts: { type: Number, default: 0 },
    failedProducts: { type: Number, default: 0 },

    startedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

BulkJobSchema.index({ userId: 1, status: 1 });

export default mongoose.model<IBulkJob>("BulkJob", BulkJobSchema);
