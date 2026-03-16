import mongoose, { type Document, Schema } from "mongoose";

export interface IVariant {
  variantLabel: string;
  title: string;
  description: string;
  metaTitle?: string;
  metaDescription?: string;
  keywords: string[];
  bulletPoints: string[];
  seoScore?: number;
  readabilityScore?: number;
  wordCount: number;
  status: "generated" | "approved" | "rejected" | "edited";
  editedContent?: Record<string, unknown>;
}

export interface IGeneration extends Document {
  userId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  jobId?: mongoose.Types.ObjectId;

  platform: "shopify" | "amazon" | "etsy" | "woocommerce" | "generic";
  tone: "professional" | "casual" | "luxury" | "playful" | "custom";

  productBrief?: Record<string, unknown>;
  seoStrategy?: Record<string, unknown>;
  competitorAnalysis?: Record<string, unknown>;

  variants: IVariant[];

  totalTokensUsed: number;
  costEstimate: number;
  processingTimeMs: number;

  createdAt: Date;
}

const VariantSchema = new Schema<IVariant>(
  {
    variantLabel: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    metaTitle: { type: String },
    metaDescription: { type: String },
    keywords: [{ type: String }],
    bulletPoints: [{ type: String }],
    seoScore: { type: Number, min: 0, max: 100 },
    readabilityScore: { type: Number, min: 0, max: 100 },
    wordCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["generated", "approved", "rejected", "edited"],
      default: "generated",
    },
    editedContent: { type: Schema.Types.Mixed },
  },
  { _id: true }
);

const GenerationSchema = new Schema<IGeneration>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    jobId: { type: Schema.Types.ObjectId, ref: "BulkJob", index: true },

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

    productBrief: { type: Schema.Types.Mixed },
    seoStrategy: { type: Schema.Types.Mixed },
    competitorAnalysis: { type: Schema.Types.Mixed },

    variants: [VariantSchema],

    totalTokensUsed: { type: Number, default: 0 },
    costEstimate: { type: Number, default: 0 },
    processingTimeMs: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

GenerationSchema.index({ productId: 1, createdAt: -1 });

export default mongoose.model<IGeneration>("Generation", GenerationSchema);
