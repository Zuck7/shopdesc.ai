import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "ShopDesc.ai API",
      version: "1.0.0",
      description:
        "AI-powered product description generation platform — REST API documentation",
      contact: { name: "ShopDesc.ai Support" },
    },
    servers: [
      { url: "/api", description: "API base path" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "refreshToken",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            _id: { type: "string" },
            email: { type: "string", format: "email" },
            name: { type: "string" },
            plan: { type: "string", enum: ["free", "starter", "pro", "enterprise"] },
            monthlyGenerations: { type: "integer" },
            generationLimit: { type: "integer" },
            defaultTone: { type: "string", enum: ["professional", "casual", "luxurious", "playful", "technical", "friendly", "minimalist", "bold"] },
            customToneInstructions: { type: "string" },
            brandName: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Product: {
          type: "object",
          properties: {
            _id: { type: "string" },
            userId: { type: "string" },
            name: { type: "string" },
            category: { type: "string" },
            brand: { type: "string" },
            price: { type: "number" },
            currency: { type: "string" },
            features: { type: "array", items: { type: "string" } },
            images: { type: "array", items: { type: "string" } },
            source: { type: "string", enum: ["manual", "csv", "shopify"] },
            rawData: { type: "object" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Generation: {
          type: "object",
          properties: {
            _id: { type: "string" },
            userId: { type: "string" },
            productId: { type: "string" },
            platform: { type: "string", enum: ["shopify", "amazon", "etsy", "woocommerce", "generic"] },
            tone: { type: "string" },
            productBrief: { type: "object" },
            seoStrategy: { type: "object" },
            variants: { type: "array", items: { $ref: "#/components/schemas/ContentVariant" } },
            competitorAnalysis: { type: "object", nullable: true },
            totalTokensUsed: { type: "integer" },
            processingTimeMs: { type: "integer" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        ContentVariant: {
          type: "object",
          properties: {
            variantLabel: { type: "string" },
            title: { type: "string" },
            description: { type: "string" },
            metaTitle: { type: "string" },
            metaDescription: { type: "string" },
            keywords: { type: "array", items: { type: "string" } },
            bulletPoints: { type: "array", items: { type: "string" } },
            seoScore: { type: "integer", minimum: 0, maximum: 100 },
            readabilityScore: { type: "integer", minimum: 0, maximum: 100 },
            wordCount: { type: "integer" },
          },
        },
        BulkJob: {
          type: "object",
          properties: {
            _id: { type: "string" },
            userId: { type: "string" },
            status: { type: "string", enum: ["pending", "processing", "completed", "failed"] },
            productIds: { type: "array", items: { type: "string" } },
            platform: { type: "string" },
            tone: { type: "string" },
            progress: { type: "integer" },
            total: { type: "integer" },
            succeeded: { type: "integer" },
            failed: { type: "integer" },
            errors: { type: "array", items: { type: "string" } },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Plan: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            price: { type: "number" },
            generationLimit: { type: "integer" },
            features: { type: "array", items: { type: "string" } },
          },
        },
        Pagination: {
          type: "object",
          properties: {
            page: { type: "integer" },
            limit: { type: "integer" },
            total: { type: "integer" },
            pages: { type: "integer" },
          },
        },
        Error: {
          type: "object",
          properties: {
            message: { type: "string" },
            stack: { type: "string", description: "Only in development" },
          },
        },
      },
    },
    tags: [
      { name: "Auth", description: "Authentication & OAuth" },
      { name: "Products", description: "Product CRUD & import" },
      { name: "Generation", description: "AI content generation" },
      { name: "Billing", description: "Subscription plans & Stripe" },
      { name: "User", description: "Profile & brand settings" },
    ],
  },
  apis: ["./src/routes/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
