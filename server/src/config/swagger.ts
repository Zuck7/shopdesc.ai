import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Shopdesc AI API",
      version: "1.0.0",
      description:
        "AI-powered product description generator with SEO optimization, competitor analysis, and multi-platform support.",
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
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            message: { type: "string" },
          },
        },
        User: {
          type: "object",
          properties: {
            _id: { type: "string" },
            email: { type: "string", format: "email" },
            name: { type: "string" },
            image: { type: "string" },
            brandName: { type: "string" },
            defaultTone: {
              type: "string",
              enum: ["professional", "casual", "luxury", "playful", "custom"],
            },
            customToneInstructions: { type: "string" },
            plan: {
              type: "string",
              enum: ["free", "starter", "pro", "enterprise"],
            },
            monthlyGenerations: { type: "integer" },
            generationLimit: { type: "integer" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Product: {
          type: "object",
          properties: {
            _id: { type: "string" },
            userId: { type: "string" },
            source: { type: "string", enum: ["manual", "csv", "shopify"] },
            name: { type: "string" },
            category: { type: "string" },
            subcategory: { type: "string" },
            features: { type: "array", items: { type: "string" } },
            benefits: { type: "array", items: { type: "string" } },
            price: { type: "number" },
            currency: { type: "string" },
            images: { type: "array", items: { type: "string", format: "uri" } },
            brand: { type: "string" },
            targetAudience: { type: "string" },
            tags: { type: "array", items: { type: "string" } },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Variant: {
          type: "object",
          properties: {
            _id: { type: "string" },
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
            status: {
              type: "string",
              enum: ["generated", "approved", "rejected", "edited"],
            },
          },
        },
        Generation: {
          type: "object",
          properties: {
            _id: { type: "string" },
            userId: { type: "string" },
            productId: { type: "string" },
            platform: {
              type: "string",
              enum: ["shopify", "amazon", "etsy", "woocommerce", "generic"],
            },
            tone: {
              type: "string",
              enum: ["professional", "casual", "luxury", "playful", "custom"],
            },
            productBrief: { type: "object" },
            seoStrategy: { type: "object" },
            competitorAnalysis: { type: "object" },
            variants: { type: "array", items: { $ref: "#/components/schemas/Variant" } },
            totalTokensUsed: { type: "integer" },
            costEstimate: { type: "number" },
            processingTimeMs: { type: "integer" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        BulkJob: {
          type: "object",
          properties: {
            _id: { type: "string" },
            userId: { type: "string" },
            status: {
              type: "string",
              enum: ["queued", "processing", "completed", "failed", "cancelled"],
            },
            platform: {
              type: "string",
              enum: ["shopify", "amazon", "etsy", "woocommerce", "generic"],
            },
            tone: {
              type: "string",
              enum: ["professional", "casual", "luxury", "playful", "custom"],
            },
            includeCompetitor: { type: "boolean" },
            productIds: { type: "array", items: { type: "string" } },
            totalProducts: { type: "integer" },
            completedProducts: { type: "integer" },
            failedProducts: { type: "integer" },
            startedAt: { type: "string", format: "date-time" },
            completedAt: { type: "string", format: "date-time" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Plan: {
          type: "object",
          properties: {
            name: { type: "string" },
            price: { type: "number" },
            generationLimit: { type: "integer" },
            features: { type: "array", items: { type: "string" } },
          },
        },
      },
    },
    paths: {
      // ── Health ──
      "/health": {
        get: {
          tags: ["Health"],
          summary: "Health check",
          responses: {
            200: {
              description: "Server is healthy",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      status: { type: "string", example: "ok" },
                      timestamp: { type: "string", format: "date-time" },
                    },
                  },
                },
              },
            },
          },
        },
      },

      // ── Auth ──
      "/auth/register": {
        post: {
          tags: ["Auth"],
          summary: "Register a new user",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name", "email", "password"],
                  properties: {
                    name: { type: "string", minLength: 2, maxLength: 100 },
                    email: { type: "string", format: "email" },
                    password: { type: "string", minLength: 8, maxLength: 128 },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: "User created, returns token + user",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      token: { type: "string" },
                      user: { $ref: "#/components/schemas/User" },
                    },
                  },
                },
              },
            },
            400: { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            409: { description: "Email already registered" },
          },
        },
      },
      "/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "Login with email and password",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password"],
                  properties: {
                    email: { type: "string", format: "email" },
                    password: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Login successful, returns token + user. Sets refresh-token cookie.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      token: { type: "string" },
                      user: { $ref: "#/components/schemas/User" },
                    },
                  },
                },
              },
            },
            401: { description: "Invalid credentials" },
          },
        },
      },
      "/auth/me": {
        get: {
          tags: ["Auth"],
          summary: "Get current user from JWT",
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "Current authenticated user",
              content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } },
            },
            401: { description: "Not authenticated" },
          },
        },
      },
      "/auth/refresh": {
        post: {
          tags: ["Auth"],
          summary: "Refresh access token using refresh-token cookie",
          responses: {
            200: {
              description: "New access token",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: { token: { type: "string" } },
                  },
                },
              },
            },
            401: { description: "Invalid or missing refresh token" },
          },
        },
      },
      "/auth/logout": {
        post: {
          tags: ["Auth"],
          summary: "Logout and clear refresh-token cookie",
          responses: {
            200: { description: "Logged out" },
          },
        },
      },
      "/auth/google": {
        get: {
          tags: ["Auth"],
          summary: "Initiate Google OAuth flow",
          responses: { 302: { description: "Redirect to Google" } },
        },
      },
      "/auth/google/callback": {
        get: {
          tags: ["Auth"],
          summary: "Google OAuth callback",
          responses: { 302: { description: "Redirect to client with token" } },
        },
      },

      // ── Products ──
      "/products": {
        get: {
          tags: ["Products"],
          summary: "List products with pagination and filters",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "page", in: "query", schema: { type: "integer", default: 1 } },
            { name: "limit", in: "query", schema: { type: "integer", default: 20, maximum: 100 } },
            { name: "search", in: "query", schema: { type: "string" } },
            { name: "source", in: "query", schema: { type: "string", enum: ["manual", "csv", "shopify"] } },
            { name: "category", in: "query", schema: { type: "string" } },
          ],
          responses: {
            200: {
              description: "Paginated product list",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      products: { type: "array", items: { $ref: "#/components/schemas/Product" } },
                      pagination: {
                        type: "object",
                        properties: {
                          total: { type: "integer" },
                          page: { type: "integer" },
                          limit: { type: "integer" },
                          pages: { type: "integer" },
                        },
                      },
                    },
                  },
                },
              },
            },
            401: { description: "Not authenticated" },
          },
        },
        post: {
          tags: ["Products"],
          summary: "Create a new product",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name"],
                  properties: {
                    name: { type: "string", minLength: 1, maxLength: 500 },
                    category: { type: "string" },
                    subcategory: { type: "string" },
                    features: { type: "array", items: { type: "string" } },
                    benefits: { type: "array", items: { type: "string" } },
                    price: { type: "number" },
                    currency: { type: "string", default: "USD" },
                    images: { type: "array", items: { type: "string", format: "uri" } },
                    brand: { type: "string" },
                    targetAudience: { type: "string" },
                    tags: { type: "array", items: { type: "string" } },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: "Product created", content: { "application/json": { schema: { $ref: "#/components/schemas/Product" } } } },
            400: { description: "Validation error" },
            401: { description: "Not authenticated" },
          },
        },
      },
      "/products/{id}": {
        get: {
          tags: ["Products"],
          summary: "Get a single product",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            200: { description: "Product details", content: { "application/json": { schema: { $ref: "#/components/schemas/Product" } } } },
            404: { description: "Not found" },
          },
        },
        put: {
          tags: ["Products"],
          summary: "Update a product",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    category: { type: "string" },
                    subcategory: { type: "string" },
                    features: { type: "array", items: { type: "string" } },
                    benefits: { type: "array", items: { type: "string" } },
                    price: { type: "number" },
                    currency: { type: "string" },
                    images: { type: "array", items: { type: "string", format: "uri" } },
                    brand: { type: "string" },
                    targetAudience: { type: "string" },
                    tags: { type: "array", items: { type: "string" } },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Product updated", content: { "application/json": { schema: { $ref: "#/components/schemas/Product" } } } },
            404: { description: "Not found" },
          },
        },
        delete: {
          tags: ["Products"],
          summary: "Delete a product",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            200: { description: "Product deleted" },
            404: { description: "Not found" },
          },
        },
      },
      "/products/import/csv": {
        post: {
          tags: ["Products"],
          summary: "Import products from CSV file",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  properties: {
                    file: { type: "string", format: "binary" },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Import result",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      imported: { type: "integer" },
                      products: { type: "array", items: { $ref: "#/components/schemas/Product" } },
                    },
                  },
                },
              },
            },
            400: { description: "Invalid CSV file" },
          },
        },
      },
      "/products/import/shopify": {
        post: {
          tags: ["Products"],
          summary: "Import products from Shopify store",
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "Shopify import result",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      imported: { type: "integer" },
                      products: { type: "array", items: { $ref: "#/components/schemas/Product" } },
                    },
                  },
                },
              },
            },
            400: { description: "Shopify not connected" },
          },
        },
      },

      // ── Generation ──
      "/generate/single/{productId}": {
        post: {
          tags: ["Generation"],
          summary: "Generate descriptions for a single product",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "productId", in: "path", required: true, schema: { type: "string" } }],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    platform: { type: "string", enum: ["shopify", "amazon", "etsy", "woocommerce", "generic"], default: "generic" },
                    tone: { type: "string", enum: ["professional", "casual", "luxury", "playful", "custom"], default: "professional" },
                    includeCompetitorAnalysis: { type: "boolean", default: false },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Generation result", content: { "application/json": { schema: { $ref: "#/components/schemas/Generation" } } } },
            402: { description: "Generation limit reached" },
            404: { description: "Product not found" },
          },
        },
      },
      "/generate/bulk": {
        post: {
          tags: ["Generation"],
          summary: "Start bulk generation for multiple products",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["productIds"],
                  properties: {
                    productIds: { type: "array", items: { type: "string" } },
                    platform: { type: "string", enum: ["shopify", "amazon", "etsy", "woocommerce", "generic"], default: "generic" },
                    tone: { type: "string", enum: ["professional", "casual", "luxury", "playful", "custom"], default: "professional" },
                    includeCompetitor: { type: "boolean", default: false },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: "Bulk job created", content: { "application/json": { schema: { $ref: "#/components/schemas/BulkJob" } } } },
            402: { description: "Generation limit reached" },
          },
        },
      },
      "/generate/jobs": {
        get: {
          tags: ["Generation"],
          summary: "List bulk generation jobs",
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "List of bulk jobs",
              content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/BulkJob" } } } },
            },
          },
        },
      },
      "/generate/jobs/{jobId}": {
        get: {
          tags: ["Generation"],
          summary: "Get bulk job status",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "jobId", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            200: { description: "Job status", content: { "application/json": { schema: { $ref: "#/components/schemas/BulkJob" } } } },
            404: { description: "Job not found" },
          },
        },
      },

      // ── Generations (read) ──
      "/generations/{productId}": {
        get: {
          tags: ["Generations"],
          summary: "List generations for a product",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "productId", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            200: {
              description: "List of generations",
              content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Generation" } } } },
            },
          },
        },
      },
      "/generations/detail/{id}": {
        get: {
          tags: ["Generations"],
          summary: "Get a single generation with full detail",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            200: { description: "Generation detail", content: { "application/json": { schema: { $ref: "#/components/schemas/Generation" } } } },
            404: { description: "Not found" },
          },
        },
      },
      "/generations/export": {
        post: {
          tags: ["Generations"],
          summary: "Export generations as CSV or JSON",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["generationIds"],
                  properties: {
                    generationIds: { type: "array", items: { type: "string" } },
                    format: { type: "string", enum: ["csv", "json"], default: "json" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Exported data" },
          },
        },
      },

      // ── Billing ──
      "/billing/plans": {
        get: {
          tags: ["Billing"],
          summary: "Get available subscription plans",
          responses: {
            200: {
              description: "List of plans",
              content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Plan" } } } },
            },
          },
        },
      },
      "/billing/subscribe": {
        post: {
          tags: ["Billing"],
          summary: "Create a Stripe checkout session",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["priceId"],
                  properties: {
                    priceId: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Checkout session URL",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: { url: { type: "string", format: "uri" } },
                  },
                },
              },
            },
          },
        },
      },
      "/billing/portal": {
        post: {
          tags: ["Billing"],
          summary: "Create a Stripe customer portal session",
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "Portal session URL",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: { url: { type: "string", format: "uri" } },
                  },
                },
              },
            },
          },
        },
      },
      "/billing/usage": {
        get: {
          tags: ["Billing"],
          summary: "Get current billing usage for authenticated user",
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "Usage data",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      plan: { type: "string" },
                      monthlyGenerations: { type: "integer" },
                      generationLimit: { type: "integer" },
                      usageResetDate: { type: "string", format: "date-time" },
                    },
                  },
                },
              },
            },
            401: { description: "Not authenticated" },
          },
        },
      },
      "/billing/webhook": {
        post: {
          tags: ["Billing"],
          summary: "Stripe webhook endpoint",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { type: "object" } } },
          },
          responses: {
            200: { description: "Webhook received" },
          },
        },
      },

      // ── Users ──
      "/users/profile": {
        get: {
          tags: ["Users"],
          summary: "Get current user profile",
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: "User profile", content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } } },
          },
        },
        put: {
          tags: ["Users"],
          summary: "Update user profile",
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    brandName: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Updated profile", content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } } },
          },
        },
      },
      "/users/brand-voice": {
        put: {
          tags: ["Users"],
          summary: "Update brand voice settings",
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    defaultTone: {
                      type: "string",
                      enum: ["professional", "casual", "luxury", "playful", "custom"],
                    },
                    customToneInstructions: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Updated brand voice", content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } } },
          },
        },
      },
      "/users/analytics": {
        get: {
          tags: ["Users"],
          summary: "Get user analytics and stats",
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "Analytics data",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      totalProducts: { type: "integer" },
                      totalGenerations: { type: "integer" },
                      avgSeoScore: { type: "number" },
                      totalCost: { type: "number" },
                      generationsByDay: { type: "array", items: { type: "object" } },
                      seoScoreDistribution: { type: "array", items: { type: "object" } },
                      platformBreakdown: { type: "array", items: { type: "object" } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: [], // We define paths inline above, no JSDoc annotations needed
};

export const swaggerSpec = swaggerJsdoc(options);
