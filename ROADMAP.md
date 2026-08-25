# Build Roadmap (6 Weeks)

> **Status:** Phases 1–5 are implemented in the codebase (the per-item checkboxes
> below were not kept up to date during the build). Phase 6 is in progress:
> tests, Dockerfiles, CI, API docs, and migrations are done; the hosted deploy,
> custom domain, and demo video are the remaining work.

## Phase 1: Foundation (Week 1) — March 10–16
**Goal: Monorepo scaffold, auth system, database, Docker running**
- [x] Initialize client: `npm create vite@latest client -- --template react-ts`
- [x] Initialize server: Express + TypeScript boilerplate
- [x] Initialize agents: FastAPI project structure
- [x] Set up Docker Compose (postgres, redis, server, client, agents)
- [x] Set up TailwindCSS + ShadCN/UI in client
- [x] Configure Drizzle ORM connection + schema (User, Product, Generation, BulkJob)
- [x] Implement auth: register, login, JWT access/refresh tokens
- [x] Implement Passport.js local strategy + Google OAuth
- [x] Build auth pages in React: Login, Register, Forgot Password
- [x] Build dashboard layout: Sidebar, Header, routing with React Router
- [x] Set up Axios instance with auth interceptors
- [x] Set up GitHub Actions CI (lint, type-check, build for client + server)
- [x] Seed script: insert 50 sample products into PostgreSQL

## Phase 2: Product Data Pipeline (Week 2) — March 17–23
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

## Phase 3: AI Agent Core (Week 3) — March 24–30
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
- [ ] Wire Express route `POST /api/generate/single/:productId` → calls FastAPI → saves Generation to PostgreSQL
- [ ] Build generation results page in React: variant cards, side-by-side comparison
- [ ] Implement SEO score badge + readability score display

## Phase 4: Bulk Generation & Platform Formatting (Week 4) — March 31–April 6
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

## Phase 5: Billing, Analytics & Polish (Week 5) — April 7–13
**Goal: Stripe subscriptions working, analytics, polished UX**
- [ ] Set up Stripe: create products + prices for 3 tiers in Stripe dashboard
- [ ] Implement `POST /api/billing/subscribe` → create Stripe Checkout session
- [ ] Implement `POST /api/billing/webhook` → handle subscription lifecycle events
- [ ] Implement `POST /api/billing/portal` → create Stripe Customer Portal session
- [ ] Implement `planLimiter` middleware: check usage vs plan limits
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

## Phase 6: Testing, Deployment & Launch (Week 6) — April 14–20
**Goal: Production-deployed, tested, first beta users**
- [ ] Write unit tests for Express controllers (Jest + Supertest)
- [ ] Write unit tests for Drizzle schema validations
- [ ] Write integration tests for auth flow, product CRUD, generation flow
- [ ] Write E2E tests for core flows (Playwright): register → import CSV → generate → view results → export
- [ ] Write pytest tests for each Python agent (mock LLM responses)
- [ ] Write pytest test for orchestrator pipeline
- [ ] Load test bulk generation: 100 products, measure throughput and failure rate
- [ ] Deploy React SPA to Vercel or Netlify
- [ ] Deploy Express API to Railway or Render
- [ ] Deploy Python agent service to Railway or Render (separate service)
- [ ] Set up managed PostgreSQL (Neon, Supabase, or Railway Postgres)
- [ ] Set up Upstash Redis
- [ ] Configure environment variables in all deployment platforms
- [ ] Set up custom domain + SSL (Cloudflare)
- [ ] Set up Sentry for error monitoring (both Express and React)
- [ ] Write API documentation (Swagger/OpenAPI)
- [ ] Write user-facing help documentation
- [ ] Record 2-minute demo video
- [ ] Beta launch: post on r/shopify, r/ecommerce, r/entrepreneur, r/SideProject
- [ ] Gather feedback, triage bugs, fix critical issues
