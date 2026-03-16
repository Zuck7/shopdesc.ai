# ProductWriter AI — Copilot Project Instructions

> **This document is the single source of truth for GitHub Copilot and any AI assistant working on this project.**
> Drop this into your repo root or reference it in VS Code Copilot custom instructions.

---

## 1. WHAT IS THIS PROJECT?

**ProductWriter AI** is a B2B SaaS platform that uses a multi-agent AI architecture to automatically generate SEO-optimized product descriptions, titles, and meta tags for e-commerce sellers on Shopify, Amazon, Etsy, and WooCommerce.

### The Problem
E-commerce sellers with 100–10,000+ products need unique, SEO-optimized descriptions for each product. Manual copywriting costs $50–200 per product. Bad descriptions = poor search rankings = no sales. Existing AI writing tools (Jasper, Copy.ai) are generic — not purpose-built for e-commerce product listings.

### The Solution
Sellers upload product data (CSV, Shopify sync, or manual entry) → 4 specialized AI agents collaborate to generate SEO-optimized, conversion-focused product content → Output is formatted for their specific platform → Bulk processing handles 500+ products in one job.

### Target Users
- Shopify store owners (4.4M+ stores globally)
- Amazon third-party sellers (~2M active)
- Etsy sellers (~7.5M active)
- WooCommerce site owners (~3.9M sites)
- E-commerce agencies managing multiple stores

### Business Model
| Plan | Price | Limit |
|------|-------|-------|
| Free | $0/mo | 5 products/month |
| Starter | $29/mo | 100 products/month |
| Pro | $79/mo | 1,000 products/month |
| Enterprise | $199/mo | Unlimited + API access |

---

## 2. MULTI-AGENT ARCHITECTURE (CORE DIFFERENTIATOR)

This project uses **4 specialized AI agents** orchestrated via LangGraph. Each agent has a single responsibility and they execute in a defined pipeline:

```
Product Data → [Product Analysis Agent] → [SEO Agent] → [Copywriting Agent] → Final Output
                                              ↑
                                    [Competitor Agent] (optional, parallel)
```

### Agent Definitions

#### Agent 1: Product Analysis Agent
- **Input:** Raw product data (name, category, features, price, images, raw CSV fields)
- **Role:** Understands the product deeply — extracts core features, identifies benefits vs features, determines target audience, identifies product category and subcategory, extracts key selling points
- **Output:** Structured product brief (ProductBrief Pydantic model)
- **LLM:** GPT-4o-mini (fast, cheap, sufficient for analysis)

#### Agent 2: SEO Agent
- **Input:** ProductBrief from Agent 1 + target platform
- **Role:** Researches relevant keywords via SerpAPI/DataForSEO, determines primary/secondary/long-tail keywords, analyzes search intent, calculates keyword difficulty, optimizes for the specific platform's search algorithm (Amazon A9, Google Shopping, Etsy search)
- **Output:** SEO strategy (SEOStrategy Pydantic model with keywords, target density, meta tag recommendations)
- **LLM:** GPT-4o-mini + SerpAPI tool calls

#### Agent 3: Copywriting Agent
- **Input:** ProductBrief + SEOStrategy + tone setting + platform constraints
- **Role:** Writes 3 variant descriptions (A/B/C testing), generates optimized titles, creates meta titles and meta descriptions, adapts to brand voice/tone, respects platform character limits
- **Output:** 3 ContentVariant objects, each with title, description, meta title, meta description, keywords
- **LLM:** GPT-4o (higher quality needed for final copy output)

#### Agent 4: Competitor Agent (Optional)
- **Input:** Product category/keywords from SEO Agent
- **Role:** Analyzes top 5 competitor listings from the target platform, identifies what they do well, finds gaps and opportunities, suggests differentiation angles
- **Output:** CompetitorAnalysis object with strengths, weaknesses, opportunities
- **LLM:** GPT-4o-mini + SerpAPI/web scraping tools
- **Note:** This agent runs in parallel with the Copywriting Agent when enabled

### Agent Orchestration (LangGraph)
```python
# Simplified orchestration flow
from langgraph.graph import StateGraph, END

workflow = StateGraph(GenerationState)

workflow.add_node("product_analysis", product_analysis_agent)
workflow.add_node("seo_research", seo_agent)
workflow.add_node("competitor_analysis", competitor_agent)
workflow.add_node("copywriting", copywriting_agent)
workflow.add_node("quality_check", quality_check_node)

workflow.set_entry_point("product_analysis")
workflow.add_edge("product_analysis", "seo_research")

# After SEO, fan out to competitor (optional) and copywriting in parallel
workflow.add_conditional_edges(
    "seo_research",
    should_analyze_competitors,
    {
        True: "competitor_analysis",
        False: "copywriting"
    }
)
workflow.add_edge("competitor_analysis", "copywriting")
workflow.add_edge("copywriting", "quality_check")
workflow.add_edge("quality_check", END)
```

---

## 3. TECH STACK — MERN + Python AI Agents

### Frontend (React SPA)
| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 18.x | UI library — single-page application |
| **Vite** | 5.x | Build tool — fast HMR, ESBuild bundling |
| **TypeScript** | 5.x | Type safety across the entire frontend |
| **React Router** | 6.x | Client-side routing |
| **TailwindCSS** | 3.x | Utility-first CSS |
| **ShadCN/UI** | latest | Accessible, customizable component library built on Radix UI |
| **TanStack Query (React Query)** | 5.x | Server state management, caching, background refetching |
| **Zustand** | 5.x | Lightweight client-side state (auth tokens, UI state) |
| **React Hook Form + Zod** | latest | Form management with schema validation |
| **Recharts** | 2.x | Dashboard analytics charts |
| **Axios** | 1.x | HTTP client for API calls |
| **Papa Parse** | 5.x | CSV parsing in the browser (preview before upload) |

### Backend (Express API)
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Node.js** | 20 LTS | Runtime |
| **Express** | 4.x | HTTP framework |
| **TypeScript** | 5.x | Type safety on the server |
| **MongoDB** | 7.x | Primary database (document store) |
| **Mongoose** | 8.x | MongoDB ODM — schemas, validation, middleware |
| **Redis** | 7.x | Caching, rate limiting, session store, job queue broker |
| **BullMQ** | 5.x | Background job queue for bulk generation |
| **Passport.js** | 0.7+ | Authentication strategies (local, Google OAuth, Shopify OAuth) |
| **jsonwebtoken** | 9.x | JWT creation and verification |
| **bcryptjs** | 2.x | Password hashing |
| **Stripe SDK** | latest | Subscription billing, webhooks, customer portal |
| **multer** | 1.x | File upload handling (CSV) |
| **express-rate-limit** | 7.x | Rate limiting middleware |
| **helmet** | 7.x | Security headers |
| **cors** | 2.x | CORS configuration |
| **express-validator / Zod** | latest | Request validation |
| **winston** | 3.x | Structured logging |

### AI Agent Service (Python Microservice)
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Python** | 3.12 | AI/ML ecosystem |
| **FastAPI** | 0.115+ | High-performance async API for agent endpoints |
| **LangGraph** | 0.4+ | Multi-agent orchestration, state management, conditional routing |
| **LangChain** | 0.3+ | LLM integrations, prompt management, output parsing |
| **OpenAI SDK** | 1.x | GPT-4o and GPT-4o-mini access |
| **Anthropic SDK** | 0.4+ | Claude 3.5 Sonnet as fallback LLM |
| **Pydantic** | 2.x | Structured output validation for all agent outputs |
| **SerpAPI** | latest | Keyword research and competitor listing data |
| **httpx** | 0.27+ | Async HTTP client for external API calls |
| **uvicorn** | 0.30+ | ASGI server |

### Infrastructure & DevOps
| Technology | Purpose |
|-----------|---------|
| **Docker + Docker Compose** | Local development environment (all services) |
| **GitHub Actions** | CI/CD pipeline |
| **Vercel / Netlify** | Frontend SPA hosting |
| **Railway / Render** | Express API + Python agent service hosting |
| **MongoDB Atlas** | Managed MongoDB (free tier available) |
| **Upstash Redis** | Managed Redis (serverless, pay-per-request) |
| **Sentry** | Error monitoring and performance tracking |
| **Resend** | Transactional emails (welcome, password reset, job complete) |

### External APIs
| API | Purpose | Pricing |
|-----|---------|---------|
| **OpenAI API** | GPT-4o / GPT-4o-mini for all agents | ~$0.002–0.01 per product |
| **SerpAPI** | Keyword research + competitor scraping | $50/mo for 5,000 searches |
| **Shopify Admin API** | Product sync, OAuth, push descriptions back | Free (per-app) |
| **Stripe** | Subscription billing | 2.9% + $0.30 per transaction |
| **Resend** | Transactional email | Free up to 3,000 emails/mo |

---

## 4. DATABASE SCHEMA (MongoDB + Mongoose)

### Users Collection

```typescript
// server/src/models/User.ts

import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  name: string;
  image?: string;
  googleId?: string;

  // Brand settings
  brandName?: string;
  defaultTone: "professional" | "casual" | "luxury" | "playful" | "custom";
  customToneInstructions?: string;

  // Subscription
  plan: "free" | "starter" | "pro" | "enterprise";
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;

  // Usage tracking
  monthlyGenerations: number;
  generationLimit: number;
  usageResetDate: Date;

  // Shopify integration
  shopifyDomain?: string;
  shopifyAccessToken?: string; // encrypted

  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
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
```

### Products Collection

```typescript
// server/src/models/Product.ts

import mongoose, { Schema, Document } from "mongoose";

export interface IProduct extends Document {
  userId: mongoose.Types.ObjectId;
  source: "manual" | "csv" | "shopify";
  externalId?: string; // Shopify product ID

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
  rawData?: Record<string, any>;
  tags: string[];

  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
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
```

### Generations Collection

```typescript
// server/src/models/Generation.ts

import mongoose, { Schema, Document } from "mongoose";

export interface IVariant {
  variantLabel: string; // "A", "B", "C"
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
  editedContent?: Record<string, any>;
}

export interface IGeneration extends Document {
  userId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  jobId?: mongoose.Types.ObjectId;

  platform: "shopify" | "amazon" | "etsy" | "woocommerce" | "generic";
  tone: "professional" | "casual" | "luxury" | "playful" | "custom";

  // Agent outputs
  productBrief?: Record<string, any>;
  seoStrategy?: Record<string, any>;
  competitorAnalysis?: Record<string, any>;

  // Generated variants
  variants: IVariant[];

  // Metadata
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
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
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
```

### BulkJobs Collection

```typescript
// server/src/models/BulkJob.ts

import mongoose, { Schema, Document } from "mongoose";

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
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },

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
```

---

## 5. PROJECT STRUCTURE

```
productwriter-ai/
├── .github/
│   ├── copilot-instructions.md          # THIS FILE
│   └── workflows/
│       ├── ci.yml                       # Lint + test + type-check on PR
│       └── deploy.yml                   # Deploy client + server + agents
├── docker-compose.yml                   # Local dev: mongo, redis, all services
├── .env                                 # Local environment variables
│
├── client/                              # React SPA (Vite)
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── package.json
│   ├── Dockerfile
│   └── src/
│       ├── main.tsx                     # App entry point
│       ├── App.tsx                      # Router setup
│       ├── components/
│       │   ├── ui/                      # ShadCN/UI components
│       │   │   ├── button.tsx
│       │   │   ├── card.tsx
│       │   │   ├── dialog.tsx
│       │   │   ├── data-table.tsx
│       │   │   ├── input.tsx
│       │   │   ├── select.tsx
│       │   │   ├── toast.tsx
│       │   │   ├── tabs.tsx
│       │   │   ├── badge.tsx
│       │   │   ├── progress.tsx
│       │   │   ├── skeleton.tsx
│       │   │   └── dropdown-menu.tsx
│       │   ├── products/
│       │   │   ├── ProductCard.tsx
│       │   │   ├── ProductTable.tsx
│       │   │   ├── CsvUpload.tsx
│       │   │   ├── ProductForm.tsx
│       │   │   └── ShopifySyncButton.tsx
│       │   ├── generations/
│       │   │   ├── VariantCard.tsx
│       │   │   ├── VariantComparison.tsx
│       │   │   ├── SeoScoreBadge.tsx
│       │   │   ├── GenerationProgress.tsx
│       │   │   └── PlatformFormatter.tsx
│       │   ├── dashboard/
│       │   │   ├── Sidebar.tsx
│       │   │   ├── StatsCards.tsx
│       │   │   ├── RecentGenerations.tsx
│       │   │   └── UsageMeter.tsx
│       │   ├── billing/
│       │   │   ├── PricingCards.tsx
│       │   │   └── UsageBar.tsx
│       │   ├── layout/
│       │   │   ├── DashboardLayout.tsx
│       │   │   ├── AuthLayout.tsx
│       │   │   └── Header.tsx
│       │   └── shared/
│       │       ├── LoadingSpinner.tsx
│       │       ├── ErrorBoundary.tsx
│       │       ├── EmptyState.tsx
│       │       └── ProtectedRoute.tsx
│       ├── pages/
│       │   ├── auth/
│       │   │   ├── LoginPage.tsx
│       │   │   ├── RegisterPage.tsx
│       │   │   └── ForgotPasswordPage.tsx
│       │   ├── dashboard/
│       │   │   └── DashboardPage.tsx
│       │   ├── products/
│       │   │   ├── ProductsListPage.tsx
│       │   │   ├── ProductDetailPage.tsx
│       │   │   ├── NewProductPage.tsx
│       │   │   └── ImportProductsPage.tsx
│       │   ├── generate/
│       │   │   ├── GeneratePage.tsx
│       │   │   └── JobProgressPage.tsx
│       │   ├── results/
│       │   │   ├── ResultsListPage.tsx
│       │   │   └── GenerationDetailPage.tsx
│       │   ├── competitors/
│       │   │   └── CompetitorAnalysisPage.tsx
│       │   ├── settings/
│       │   │   ├── ProfilePage.tsx
│       │   │   ├── BrandVoicePage.tsx
│       │   │   ├── BillingPage.tsx
│       │   │   └── IntegrationsPage.tsx
│       │   ├── analytics/
│       │   │   └── AnalyticsPage.tsx
│       │   └── LandingPage.tsx
│       ├── hooks/
│       │   ├── useProducts.ts           # TanStack Query hooks for products
│       │   ├── useGenerations.ts        # TanStack Query hooks for generations
│       │   ├── useBulkJob.ts            # Real-time job progress polling
│       │   ├── useUsage.ts              # Usage quota hooks
│       │   └── useAuth.ts              # Auth state hook
│       ├── stores/
│       │   ├── authStore.ts             # Zustand — JWT token, user info
│       │   └── uiStore.ts              # Zustand — sidebar, modals, theme
│       ├── lib/
│       │   ├── api.ts                   # Axios instance with interceptors (auth, refresh, error handling)
│       │   ├── queryClient.ts           # TanStack Query client config
│       │   └── utils.ts                 # General utilities (formatters, validators)
│       └── types/
│           ├── product.ts
│           ├── generation.ts
│           ├── user.ts
│           ├── billing.ts
│           └── agent.ts                 # Types matching Python Pydantic models
│
├── server/                              # Express API (Node.js)
│   ├── tsconfig.json
│   ├── package.json
│   ├── Dockerfile
│   └─��� src/
│       ├── index.ts                     # Express app entry — connect DB, start server
│       ├── app.ts                       # Express app setup — middleware, routes
│       ├── config/
│       │   ├── db.ts                    # MongoDB connection (mongoose.connect)
│       │   ├── redis.ts                 # Redis client (ioredis)
│       │   ├── queue.ts                 # BullMQ queue + worker setup
│       │   ├── stripe.ts               # Stripe client initialization
│       │   ├── passport.ts             # Passport strategies (local, google, shopify)
│       │   └── env.ts                  # Environment variable validation (Zod)
│       ├── models/
│       │   ├── User.ts
│       │   ├── Product.ts
│       │   ├── Generation.ts
│       │   └── BulkJob.ts
│       ├── routes/
│       │   ├── auth.routes.ts           # /api/auth/*
│       │   ├── product.routes.ts        # /api/products/*
│       │   ├── generation.routes.ts     # /api/generate/*, /api/generations/*
│       │   ├── competitor.routes.ts     # /api/competitors/*
│       │   ├── billing.routes.ts        # /api/billing/*
│       │   └── user.routes.ts           # /api/user/*
│       ├── controllers/
│       │   ├── auth.controller.ts
│       │   ├── product.controller.ts
│       │   ├── generation.controller.ts
│       │   ├── competitor.controller.ts
│       │   ├── billing.controller.ts
│       │   └── user.controller.ts
│       ├── middleware/
│       │   ├── auth.ts                  # JWT verification middleware
│       │   ├── rateLimiter.ts           # express-rate-limit config
│       │   ├── planLimiter.ts           # Check usage vs plan limits before generation
│       │   ├── validate.ts              # Zod schema validation middleware
│       │   └── errorHandler.ts          # Global error handler
│       ├── services/
│       │   ├── agentClient.ts           # HTTP client to call Python FastAPI service
│       │   ├── shopify.service.ts       # Shopify Admin API interactions
│       │   ├── stripe.service.ts        # Stripe subscription lifecycle helpers
│       │   ├── email.service.ts         # Resend transactional emails
│       │   ├── csv.service.ts           # CSV parsing, validation, mapping
│       │   └── cache.service.ts         # Redis caching helpers
│       ├── workers/
│       │   └── generation.worker.ts     # BullMQ worker — processes bulk generation jobs
│       ├── validators/
│       │   ├── auth.validator.ts        # Zod schemas for auth routes
│       │   ├── product.validator.ts     # Zod schemas for product routes
│       │   ├── generation.validator.ts  # Zod schemas for generation routes
│       │   └── billing.validator.ts     # Zod schemas for billing routes
│       └── utils/
│           ├── logger.ts                # Winston logger setup
│           ├── encryption.ts            # Encrypt/decrypt Shopify tokens
│           └── helpers.ts               # General helpers
│
├── agents/                              # Python AI Agent Service
│   ├── Dockerfile
│   ├── pyproject.toml                   # Project config + dependencies (use uv or pip)
│   ├── requirements.txt                 # Pinned dependencies
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                      # FastAPI application entry point
│   │   ├── config.py                    # Environment variables, settings
│   │   ├── orchestrator.py              # LangGraph workflow definition
│   │   ├── agents/
│   │   │   ├── __init__.py
│   │   │   ├── product_analysis.py      # Product Analysis Agent
│   │   │   ├── seo.py                   # SEO Agent
│   │   │   ├── copywriting.py           # Copywriting Agent
│   │   │   └── competitor.py            # Competitor Analysis Agent
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── schemas.py               # Pydantic models for all agent I/O
│   │   │   └── prompts.py               # All prompt templates
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── llm.py                   # LLM client wrapper (OpenAI + Anthropic fallback)
│   │   │   ├── serpapi.py               # SerpAPI wrapper for keyword/competitor data
│   │   │   └── scoring.py              # SEO score + readability score calculator
│   │   └── routers/
│   │       ├── __init__.py
│   │       ├── generate.py              # /generate/single, /generate/batch endpoints
│   │       ├── competitors.py           # /competitors/analyze endpoint
│   │       └── health.py               # /health endpoint
│   └── tests/
│       ├── test_agents/
│       │   ├── test_product_analysis.py
│       │   ├── test_seo.py
│       │   ├── test_copywriting.py
│       │   └── test_competitor.py
│       ├── test_orchestrator.py
│       └── conftest.py
│
└── docs/
    ├── API.md                           # API endpoint documentation
    ├── AGENTS.md                        # Agent architecture deep-dive
    └── DEPLOYMENT.md                    # Deployment guide
```

---

## 6. PYDANTIC MODELS (Python Agent Service)

All agent inputs/outputs MUST be strictly typed with Pydantic v2 models:

```python
# agents/app/models/schemas.py

from pydantic import BaseModel, Field
from enum import Enum
from typing import Optional


class Platform(str, Enum):
    SHOPIFY = "shopify"
    AMAZON = "amazon"
    ETSY = "etsy"
    WOOCOMMERCE = "woocommerce"
    GENERIC = "generic"


class Tone(str, Enum):
    PROFESSIONAL = "professional"
    CASUAL = "casual"
    LUXURY = "luxury"
    PLAYFUL = "playful"
    CUSTOM = "custom"


# ── Agent 1: Product Analysis ──

class ProductInput(BaseModel):
    """Raw product data from the user"""
    name: str
    category: str | None = None
    features: list[str] = Field(default_factory=list)
    price: float | None = None
    currency: str = "USD"
    brand: str | None = None
    images: list[str] = Field(default_factory=list)
    raw_description: str | None = None
    raw_data: dict | None = None


class ProductBrief(BaseModel):
    """Structured output from Product Analysis Agent"""
    product_name: str
    product_type: str
    category: str
    subcategory: str | None = None
    core_features: list[str] = Field(min_length=1, max_length=10)
    key_benefits: list[str] = Field(min_length=1, max_length=10)
    target_audience: str
    use_cases: list[str]
    unique_selling_points: list[str]
    price_positioning: str  # "budget", "mid-range", "premium", "luxury"
    emotional_triggers: list[str]  # urgency, exclusivity, comfort, etc.


# ── Agent 2: SEO ──

class Keyword(BaseModel):
    term: str
    search_volume: int | None = None
    difficulty: int | None = None  # 0-100
    relevance: float = Field(ge=0, le=1)  # 0-1
    keyword_type: str  # "primary", "secondary", "long-tail"


class SEOStrategy(BaseModel):
    """Structured output from SEO Agent"""
    primary_keyword: Keyword
    secondary_keywords: list[Keyword]
    long_tail_keywords: list[Keyword]
    target_word_count: int
    target_keyword_density: float  # percentage
    meta_title_max_length: int
    meta_description_max_length: int
    platform_specific_notes: str
    search_intent: str  # "transactional", "informational", "navigational"


# ── Agent 3: Copywriting ──

class ContentVariant(BaseModel):
    """A single generated variant"""
    variant_label: str  # "A", "B", "C"
    title: str
    description: str
    meta_title: str
    meta_description: str
    keywords: list[str]
    bullet_points: list[str]  # Amazon-style
    seo_score: int = Field(ge=0, le=100)
    readability_score: int = Field(ge=0, le=100)
    word_count: int


class GenerationOutput(BaseModel):
    """Final combined output from the pipeline"""
    product_id: str
    platform: Platform
    tone: Tone
    product_brief: ProductBrief
    seo_strategy: SEOStrategy
    variants: list[ContentVariant] = Field(min_length=3, max_length=3)
    competitor_analysis: Optional["CompetitorAnalysis"] = None
    total_tokens_used: int
    processing_time_ms: int


# ── Agent 4: Competitor ──

class CompetitorListing(BaseModel):
    title: str
    url: str | None = None
    platform: str
    strengths: list[str]
    weaknesses: list[str]


class CompetitorAnalysis(BaseModel):
    """Structured output from Competitor Agent"""
    top_competitors: list[CompetitorListing]
    common_keywords: list[str]
    content_gaps: list[str]  # what competitors miss
    differentiation_suggestions: list[str]
    average_title_length: int
    average_description_length: int


# ── API Request/Response ──

class SingleGenerateRequest(BaseModel):
    product: ProductInput
    platform: Platform = Platform.GENERIC
    tone: Tone = Tone.PROFESSIONAL
    custom_tone_instructions: str | None = None
    include_competitor_analysis: bool = False


class BulkGenerateRequest(BaseModel):
    products: list[ProductInput]
    platform: Platform = Platform.GENERIC
    tone: Tone = Tone.PROFESSIONAL
    custom_tone_instructions: str | None = None
    include_competitor_analysis: bool = False


class HealthResponse(BaseModel):
    status: str = "healthy"
    agents: list[str] = ["product_analysis", "seo", "copywriting", "competitor"]
    version: str
```

---

## 7. API ENDPOINTS (Complete)

### Express API Routes (Main Application)

```
Authentication:
  POST   /api/auth/register              Register with email/password
  POST   /api/auth/login                 Login with email/password (returns JWT)
  POST   /api/auth/refresh               Refresh access token
  POST   /api/auth/forgot-password       Send password reset email
  POST   /api/auth/reset-password        Reset password with token
  GET    /api/auth/google                 Initiate Google OAuth
  GET    /api/auth/google/callback        Google OAuth callback
  GET    /api/auth/shopify                Initiate Shopify OAuth
  GET    /api/auth/shopify/callback       Shopify OAuth callback

Products:
  GET    /api/products                    List products (paginated, ?search=&source=&page=&limit=)
  POST   /api/products                    Create single product
  GET    /api/products/:id                Get product by ID
  PUT    /api/products/:id                Update product
  DELETE /api/products/:id                Delete product
  POST   /api/products/import/csv         Upload and parse CSV file (multipart/form-data)
  POST   /api/products/import/shopify     Sync products from connected Shopify store
  POST   /api/products/export             Export products to CSV

Generation:
  POST   /api/generate/single/:productId  Generate content for single product
  POST   /api/generate/bulk               Create bulk generation job
  GET    /api/generate/jobs/:jobId         Get bulk job status and progress

Results:
  GET    /api/generations/:productId       Get all generations for a product
  GET    /api/generations/detail/:id       Get single generation detail
  PUT    /api/generations/:id/variants/:variantId  Edit/approve/reject a variant
  POST   /api/generations/export           Export generations to CSV/platform format

Competitors:
  POST   /api/competitors/analyze          Run competitor analysis for a product/keyword

Billing:
  GET    /api/billing/plans                Get available plans and pricing
  POST   /api/billing/subscribe            Create Stripe checkout session
  POST   /api/billing/webhook              Handle Stripe webhooks (raw body)
  GET    /api/billing/usage                Get current month's usage and limits
  POST   /api/billing/portal               Create Stripe customer portal session

User:
  GET    /api/user/profile                 Get authenticated user profile
  PUT    /api/user/profile                 Update profile (name, email)
  PUT    /api/user/brand-voice             Update brand voice settings (tone, custom instructions)
```

### Python Agent Service (FastAPI)

```
Health:
  GET    /health                           Service health check

Generation:
  POST   /generate/single                  Generate content for one product
  POST   /generate/batch                   Generate content for multiple products (internal)

Competitors:
  POST   /competitors/analyze              Analyze competitor listings

Admin (internal):
  GET    /metrics                           Prometheus-style metrics
```

---

## 8. ENVIRONMENT VARIABLES

```env
# .env

# ── MongoDB ──
MONGODB_URI="mongodb://localhost:27017/productwriter"
# Or MongoDB Atlas for production:
# MONGODB_URI="mongodb+srv://user:password@cluster.mongodb.net/productwriter"

# ── Redis ──
REDIS_URL="redis://localhost:6379"
# Or Upstash for production:
# UPSTASH_REDIS_REST_URL=""
# UPSTASH_REDIS_REST_TOKEN=""

# ── JWT ──
JWT_SECRET="generate-a-random-64-char-secret-here"
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"

# ── Google OAuth ──
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GOOGLE_CALLBACK_URL="http://localhost:3001/api/auth/google/callback"

# ── Shopify ──
SHOPIFY_API_KEY=""
SHOPIFY_API_SECRET=""
SHOPIFY_SCOPES="read_products,write_products"
SHOPIFY_CALLBACK_URL="http://localhost:3001/api/auth/shopify/callback"

# ── Stripe ──
STRIPE_SECRET_KEY=""
STRIPE_PUBLISHABLE_KEY=""
STRIPE_WEBHOOK_SECRET=""
STRIPE_STARTER_PRICE_ID=""
STRIPE_PRO_PRICE_ID=""
STRIPE_ENTERPRISE_PRICE_ID=""

# ── AI Agent Service ──
AGENT_SERVICE_URL="http://localhost:8000"
AGENT_SERVICE_API_KEY="internal-api-key-change-in-production"

# ── OpenAI ──
OPENAI_API_KEY=""

# ── Anthropic (fallback) ──
ANTHROPIC_API_KEY=""

# ── SerpAPI ──
SERPAPI_API_KEY=""

# ── Email (Resend) ──
RESEND_API_KEY=""
FROM_EMAIL="noreply@productwriter.ai"

# ── Monitoring ──
SENTRY_DSN=""

# ── Server ──
PORT=3001
NODE_ENV="development"
CLIENT_URL="http://localhost:5173"
```

---

## 9. CODING STANDARDS & CONVENTIONS

### General Rules
- **TypeScript strict mode** on both client and server — no `any` types unless absolutely necessary
- **Functional components only** — no class components in React
- **Async/await everywhere** — no raw promises with `.then()` chains
- **Error boundaries** — wrap all page-level components in React
- **Loading states** — every async operation must have a loading state
- **Optimistic updates** — use TanStack Query's optimistic update pattern for mutations

### Naming Conventions
```
React Files:      PascalCase         (ProductTable.tsx, CsvUpload.tsx)
Other TS Files:   camelCase          (agentClient.ts, csvParser.ts)
Components:       PascalCase         (ProductTable, CsvUpload)
Functions:        camelCase          (parseProductCsv, generateDescription)
Constants:        SCREAMING_SNAKE    (MAX_PRODUCTS_PER_JOB, API_BASE_URL)
Types/Interfaces: PascalCase + I     (IProduct, IUser, IGeneration)
Express routes:   kebab-case files   (auth.routes.ts, product.routes.ts)
Controllers:      camelCase          (getProducts, createProduct)
Mongoose models:  PascalCase         (User, Product, Generation)
Python:           snake_case         (product_analysis.py, generate_content())
```

### React Component Structure
```tsx
// Standard component structure
import dependencies          // 1. External imports (react, libraries)
import localModules          // 2. Internal imports (components, hooks, lib)
import types                 // 3. Type imports

interface ProductTableProps { // 4. Props interface
  products: IProduct[];
  isLoading: boolean;
}

export function ProductTable({ products, isLoading }: ProductTableProps) {
  // hooks                   // 5. All hooks at top (useQuery, useState, etc.)
  // derived state           // 6. Computed values (useMemo)
  // handlers                // 7. Event handlers (useCallback)
  // effects                 // 8. useEffect (minimize these — prefer React Query)

  // early returns           // 9. Loading/error/empty states
  if (isLoading) return <LoadingSpinner />;
  if (!products.length) return <EmptyState />;

  // render                  // 10. Main JSX return
  return ( ... );
}
```

### Express Controller Structure
```typescript
// Standard controller structure
import { Request, Response, NextFunction } from "express";
import Product from "../models/Product";
import { AppError } from "../utils/errors";

export const getProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // 1. Extract query params (page, limit, search, filters)
    const { page = 1, limit = 20, search, source } = req.query;

    // 2. Build query
    const query: any = { userId: req.user!.id };
    if (search) query.name = { $regex: search, $options: "i" };
    if (source) query.source = source;

    // 3. Execute with pagination
    const products = await Product.find(query)
      .skip((+page - 1) * +limit)
      .limit(+limit)
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments(query);

    // 4. Return response
    res.json({
      data: products,
      pagination: { page: +page, limit: +limit, total, pages: Math.ceil(total / +limit) },
    });
  } catch (error) {
    next(error);
  }
};
```

### Express Middleware Chain Pattern
```typescript
// Every route follows this pattern:
router.post(
  "/api/products",
  authMiddleware,          // 1. Verify JWT
  validate(createSchema),  // 2. Validate request body with Zod
  planLimiter("products"), // 3. Check plan limits (if applicable)
  productController.create // 4. Controller handler
);
```

### Axios Instance (Client)
```typescript
// client/src/lib/api.ts
import axios from "axios";
import { useAuthStore } from "../stores/authStore";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3001/api",
  headers: { "Content-Type": "application/json" },
});

// Request interceptor: attach JWT
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor: handle 401, refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Attempt token refresh, then retry
      // If refresh fails, logout
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Python Agent Standards
```python
# All agents MUST:
# 1. Accept typed Pydantic input
# 2. Return typed Pydantic output
# 3. Handle errors gracefully with fallbacks
# 4. Log processing time and token usage
# 5. Use async/await for all I/O operations

async def product_analysis_agent(input: ProductInput) -> ProductBrief:
    """
    Analyzes raw product data and produces a structured product brief.

    This is Agent 1 in the pipeline. Its output feeds into the SEO Agent.
    """
    ...
```

---

## 10. BUILD ROADMAP (6 Weeks)

### Phase 1: Foundation (Week 1) — March 10–16
**Goal: Monorepo scaffold, auth system, database, Docker running**
- [ ] Initialize client: `npm create vite@latest client -- --template react-ts`
- [ ] Initialize server: Express + TypeScript boilerplate
- [ ] Initialize agents: FastAPI project structure
- [ ] Set up Docker Compose (mongo, redis, server, client, agents)
- [ ] Set up TailwindCSS + ShadCN/UI in client
- [ ] Configure Mongoose connection + models (User, Product, Generation, BulkJob)
- [ ] Implement auth: register, login, JWT access/refresh tokens
- [ ] Implement Passport.js local strategy + Google OAuth
- [ ] Build auth pages in React: Login, Register, Forgot Password
- [ ] Build dashboard layout: Sidebar, Header, routing with React Router
- [ ] Set up Axios instance with auth interceptors
- [ ] Set up GitHub Actions CI (lint, type-check, build for client + server)
- [ ] Seed script: insert 50 sample products into MongoDB

### Phase 2: Product Data Pipeline (Week 2) — March 17–23
**Goal: Full product CRUD, CSV import, Shopify sync**
- [ ] Build product CRUD API routes + controllers (list, create, read, update, delete)
- [ ] Implement pagination, search (text index), and filtering on product list endpoint
- [ ] Build product list page with DataTable component (ShadCN)
- [ ] Build manual product creation form with React Hook Form + Zod
- [ ] Implement CSV upload route with multer + Papa Parse parsing
- [ ] Build CSV validation service (required fields, type checking, error reporting per row)
- [ ] Build CSV upload UI: drag-and-drop, preview parsed data, column mapping, confirm import
- [ ] Implement Shopify OAuth flow (Passport strategy + callback)
- [ ] Build Shopify product sync service (fetch products via Admin REST API)
- [ ] Build Shopify sync UI with progress indicator
- [ ] Product detail page: view product data + link to generations

### Phase 3: AI Agent Core (Week 3) — March 24–30
**Goal: All 4 agents functional, single product generation end-to-end**
- [ ] Set up FastAPI project: main.py, routers, config, CORS
- [ ] Implement LLM service wrapper: OpenAI primary, Anthropic fallback, token counting
- [ ] Build Product Analysis Agent: prompt template, structured output with `with_structured_output()`
- [ ] Build SEO Agent: SerpAPI integration for keyword data, keyword scoring, structured output
- [ ] Build Copywriting Agent: generate 3 variants, tone control, platform-aware character limits
- [ ] Build Competitor Agent: SerpAPI search, listing analysis, gap identification
- [ ] Build LangGraph orchestrator: wire all 4 agents with conditional edges
- [ ] Expose `/generate/single` endpoint in FastAPI
- [ ] Build `agentClient.ts` in Express: HTTP client to call FastAPI service
- [ ] Wire Express route `POST /api/generate/single/:productId` → calls FastAPI → saves Generation to MongoDB
- [ ] Build generation results page in React: variant cards, side-by-side comparison
- [ ] Implement SEO score badge + readability score display

### Phase 4: Bulk Generation & Platform Formatting (Week 4) — March 31–April 6
**Goal: Bulk processing queue, multi-platform output, export**
- [ ] Set up Redis connection in Express (ioredis)
- [ ] Set up BullMQ: queue definition, job options, connection config
- [ ] Implement bulk generation worker: dequeue jobs, call FastAPI per product, update BulkJob progress
- [ ] Wire Express route `POST /api/generate/bulk` → creates BulkJob → adds to queue
- [ ] Wire Express route `GET /api/generate/jobs/:jobId` → returns job status/progress
- [ ] Build bulk generation launch UI: select products → configure settings → start job
- [ ] Build real-time job progress UI: poll job status every 2s, show progress bar + completed/failed count
- [ ] Implement platform formatters in the Copywriting Agent:
  - Shopify: HTML description, SEO title/meta
  - Amazon: bullet points (5), backend keywords, title (200 char max)
  - Etsy: tags (13 max), title (140 char max), description
  - WooCommerce: short description + long description, categories
- [ ] Build export functionality: CSV download, JSON download, copy-to-clipboard per variant
- [ ] Implement generation caching: hash product data + settings → skip if cached result exists
- [ ] Add rate limiting on generation routes (express-rate-limit)

### Phase 5: Billing, Analytics & Polish (Week 5) — April 7–13
**Goal: Stripe subscriptions working, analytics, polished UX**
- [ ] Set up Stripe: create products + prices for 3 tiers in Stripe dashboard
- [ ] Implement `POST /api/billing/subscribe` → create Stripe Checkout session
- [ ] Implement `POST /api/billing/webhook` → handle subscription lifecycle events (created, updated, deleted, payment failed)
- [ ] Implement `POST /api/billing/portal` → create Stripe Customer Portal session
- [ ] Implement `planLimiter` middleware: check `user.monthlyGenerations` vs `user.generationLimit`
- [ ] Implement monthly usage reset (cron job or check on each request)
- [ ] Build pricing page with plan comparison cards
- [ ] Build billing settings page: current plan, usage bar, upgrade/manage subscription
- [ ] Build usage analytics dashboard: total generations, SEO score distribution, cost tracking (Recharts)
- [ ] Build brand voice settings page: tone preset selector, custom instructions textarea
- [ ] Build landing/marketing page (public, no auth)
- [ ] Add toast notifications for all async operations (success/error)
- [ ] Add loading skeletons to all data-fetching pages
- [ ] Add error boundaries to all page components
- [ ] Build onboarding flow: first-time user → import products → generate first description

### Phase 6: Testing, Deployment & Launch (Week 6) — April 14–20
**Goal: Production-deployed, tested, first beta users**
- [ ] Write unit tests for Express controllers (Jest + Supertest)
- [ ] Write unit tests for Mongoose model validations
- [ ] Write integration tests for auth flow, product CRUD, generation flow
- [ ] Write E2E tests for core flows (Playwright): register → import CSV → generate → view results → export
- [ ] Write pytest tests for each Python agent (mock LLM responses)
- [ ] Write pytest test for orchestrator pipeline
- [ ] Load test bulk generation: 100 products, measure throughput and failure rate
- [ ] Deploy React SPA to Vercel or Netlify
- [ ] Deploy Express API to Railway or Render
- [ ] Deploy Python agent service to Railway or Render (separate service)
- [ ] Set up MongoDB Atlas (free M0 tier or M10 for production)
- [ ] Set up Upstash Redis
- [ ] Configure environment variables in all deployment platforms
- [ ] Set up custom domain + SSL (Cloudflare)
- [ ] Set up Sentry for error monitoring (both Express and React)
- [ ] Write API documentation (Swagger/OpenAPI via express-jsdoc-swagger or manual)
- [ ] Write user-facing help documentation
- [ ] Record 2-minute demo video (Loom)
- [ ] Beta launch: post on r/shopify, r/ecommerce, r/entrepreneur, r/SideProject
- [ ] Gather feedback, triage bugs, fix critical issues

---

## 11. KEY IMPLEMENTATION NOTES FOR COPILOT

When generating code for this project, follow these rules:

1. **The project has 3 separate services** — React client (port 5173), Express API (port 3001), Python agents (port 8000). They communicate via HTTP. Never import across service boundaries.

2. **All MongoDB operations go through Mongoose models** — never use raw `db.collection()` calls. Always define and use typed Mongoose schemas with interfaces.

3. **All Express route handlers must be wrapped in try/catch** with errors forwarded to `next(error)` for the global error handler.

4. **All Express routes must validate input with Zod** via the `validate` middleware — never trust user input.

5. **All protected Express routes must use the `authMiddleware`** that verifies the JWT and attaches `req.user`.

6. **All generation-related routes must use the `planLimiter` middleware** to check usage limits before proceeding.

7. **The Express server calls the Python agent service via HTTP** using the `agentClient.ts` wrapper. Never call OpenAI/LLM APIs directly from Express.

8. **All Python agent outputs must conform to Pydantic models** — use LangChain's `with_structured_output()` to enforce structure.

9. **Bulk generation uses BullMQ jobs** — never process more than 1 product synchronously in an Express route handler. Always queue.

10. **Use TanStack Query for ALL server data fetching in React** — never use `useEffect` + `fetch` or `useEffect` + `axios` directly. Define query hooks in `hooks/` directory.

11. **JWT tokens:** Access token (15min) stored in Zustand memory. Refresh token (7d) stored in httpOnly cookie. Axios interceptor handles automatic refresh.

12. **Handle errors at every level** — agent errors should fall back gracefully (e.g., if SerpAPI fails, skip competitor analysis but still return generation with the other 3 agents' output).

13. **Cost tracking is critical** — every generation must log `totalTokensUsed` and `costEstimate` in the Generation document.

14. **Cache aggressively with Redis** — if a product's data hasn't changed and the same platform/tone settings are used, serve the cached generation instead of calling the agent service again.

15. **File uploads (CSV)** use `multer` with memory storage. Max file size: 10MB. Parse with Papa Parse on the server, validate each row, return errors per row.

16. **Mongoose population** — use `.populate()` sparingly. For list endpoints, return IDs only. For detail endpoints, populate related documents.

---

## 12. DOCKER COMPOSE (Local Development)

```yaml
# docker-compose.yml
version: "3.8"

services:
  client:
    build:
      context: ./client
      dockerfile: Dockerfile
    ports:
      - "5173:5173"
    volumes:
      - ./client/src:/app/src
    environment:
      - VITE_API_URL=http://localhost:3001/api
    depends_on:
      - server

  server:
    build:
      context: ./server
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    volumes:
      - ./server/src:/app/src
    environment:
      - NODE_ENV=development
      - PORT=3001
      - MONGODB_URI=mongodb://mongo:27017/productwriter
      - REDIS_URL=redis://redis:6379
      - AGENT_SERVICE_URL=http://agents:8000
      - JWT_SECRET=local-dev-secret-change-in-production
      - CLIENT_URL=http://localhost:5173
    depends_on:
      - mongo
      - redis
      - agents

  agents:
    build:
      context: ./agents
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    volumes:
      - ./agents/app:/app/app
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - SERPAPI_API_KEY=${SERPAPI_API_KEY}
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

  mongo:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  mongo_data:
  redis_data:
```

---

## 13. SERVICE COMMUNICATION DIAGRAM

```
┌─────────────────────────────────────────────────────────────┐
│                     BROWSER (User)                          │
│                                                             │
│   React SPA (Vite)                                          │
│   http://localhost:5173                                      │
│   ├── TanStack Query → Axios → Express API                  │
│   ├── Zustand (auth tokens, UI state)                       │
│   └── React Router (client-side routing)                    │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP (Axios)
                         │ Authorization: Bearer <JWT>
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   EXPRESS API (Node.js)                      │
│                   http://localhost:3001                      │
│                                                             │
│   ├── Middleware: auth → validate → planLimiter → controller │
│   ├── Controllers: auth, product, generation, billing, user │
│   ├── Services: agentClient, shopify, stripe, csv, cache    │
│   ├── Workers: BullMQ generation worker                     │
│   └── Models: Mongoose (User, Product, Generation, BulkJob) │
└─────��─┬──────────────┬──────────────┬───────────────────────┘
        │              │              │
        ▼              ▼              ▼
   ┌─────────┐   ┌─────────┐   ┌──────────────────────────┐
   │ MongoDB  │   │  Redis  │   │  Python Agent Service    │
   │  :27017  │   │  :6379  │   │  http://localhost:8000   │
   │          │   │         │   │                          │
   │ Users    │   │ Cache   │   │  FastAPI                 │
   │ Products │   │ Sessions│   │  ├── /generate/single    │
   │ Genera-  │   │ Rate    │   │  ├── /generate/batch     │
   │  tions   │   │  limits │   │  ├── /competitors/analyze│
   │ BulkJobs │   │ BullMQ  │   │  └── /health             │
   │          │   │  queues │   │                          │
   └─────────┘   └─────────┘   │  LangGraph Orchestrator  │
                                │  ├── Product Analysis    │
                                │  ├── SEO Agent           │
                                │  ├── Copywriting Agent   │
                                │  └── Competitor Agent    │
                                │                          │
                                │  External APIs:          │
                                │  ├── OpenAI (GPT-4o)     │
                                │  ├── Anthropic (fallback)│
                                │  └── SerpAPI (keywords)  │
                                └──────────────────────────┘
```

### Communication Flow for Single Generation:
```
1. User clicks "Generate" in React
2. React → POST /api/generate/single/:productId (Axios with JWT)
3. Express authMiddleware verifies JWT
4. Express planLimiter checks usage < limit
5. Express controller fetches Product from MongoDB
6. Express agentClient → POST http://agents:8000/generate/single (internal HTTP)
7. FastAPI receives request → runs LangGraph orchestrator
8. LangGraph: ProductAnalysis → SEO → Copywriting (+ optional Competitor in parallel)
9. FastAPI returns GenerationOutput (Pydantic validated)
10. Express saves Generation document to MongoDB
11. Express increments user.monthlyGenerations
12. Express returns generation data to React
13. React TanStack Query caches result, displays variant comparison UI
```

### Communication Flow for Bulk Generation:
```
1. User selects 50 products, clicks "Generate All" in React
2. React → POST /api/generate/bulk (Axios with JWT)
3. Express creates BulkJob document (status: "queued")
4. Express adds job to BullMQ queue
5. Express returns jobId immediately (202 Accepted)
6. React starts polling GET /api/generate/jobs/:jobId every 2 seconds
7. BullMQ worker picks up job
8. Worker iterates: for each productId in job.productIds:
   a. Fetch product from MongoDB
   b. Call FastAPI /generate/single
   c. Save Generation document
   d. Increment job.completedProducts
   e. If error: increment job.failedProducts, continue
9. Worker sets job.status = "completed", job.completedAt = now
10. React poll sees status = "completed", stops polling, shows results
```

---

**This document contains everything needed to build ProductWriter AI from scratch using the MERN + Python agent stack. Start with Phase 1 and iterate.**