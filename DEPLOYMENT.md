# Deployment Guide (Portfolio-Ready)

This guide gets Shopdesc AI live so recruiters can use the current version.

## 1. Target Architecture

- Client: Vercel (React/Vite static app)
- Server API: Render or Railway (Docker service from `server/`)
- Agents API: Render or Railway (Docker service from `agents/`)
- PostgreSQL: Neon, Supabase, or Railway Postgres
- Redis: Upstash Redis

## 2. Pre-Deploy Checklist

- Rotate all secrets if they were ever exposed.
- Ensure your default branch is green in GitHub Actions (workflows run on `main` and `master`).
- Confirm `.env` files are ignored and not committed.
- Keep `.env.example` as the template only.

## 3. Environment Variables

Use `.env.example` as the full source of variables. These are the minimum production values:

### Server

- `NODE_ENV=production`
- `PORT` (provided by platform, do not hardcode when host provides one)
- `DATABASE_URL` (managed Postgres URL)
- `REDIS_URL` (managed Redis URL)
- `JWT_SECRET` and `JWT_REFRESH_SECRET` (long random values)
- `CLIENT_URL` (your deployed frontend URL)
- `AGENTS_URL` (your deployed agents URL)
- `AGENT_API_KEY` (must match agents)

Optional server integrations:

- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`
- `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `SHOPIFY_CALLBACK_URL`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, price IDs
- `SENTRY_DSN`, `RESEND_API_KEY`

### Agents

- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY` (optional fallback)
- `SERPAPI_KEY`
- `AGENT_API_KEY` (must match server)
- `AGENT_CORS_ORIGINS` (comma-separated, include deployed frontend URL)

### Client

- `VITE_API_URL` — server origin only, no `/api` suffix (for example `https://api.yourdomain.com`). The client appends `/api` itself.
- `VITE_SENTRY_DSN` (optional)

## 4. Database Migrations

Schema migrations live in `server/drizzle/` and are committed to the repo.

- The server applies any pending migrations automatically on startup, before it
  begins serving traffic. A fresh managed Postgres needs no manual step.
- To run them by hand: `cd server && DATABASE_URL=... npm run db:migrate`
- After changing `server/src/models/schema.ts`, run `npm run db:generate` and
  commit the new SQL file.

## 5. Seeding the Demo Account

Recruiters need something to look at and a way to sign in. From `server/`:

```bash
DATABASE_URL=<prod-url> DEMO_EMAIL=demo@yourdomain.com DEMO_PASSWORD=<pick-one> npm run seed
```

This creates a `pro` demo user with a 25-generation cap and 50 sample products.
Put the credentials on the landing page or in your README so visitors can log in.

## 6. Deploy Order

1. Provision Postgres and Redis.
2. Deploy agents service and set its env vars.
3. Deploy server service and point `AGENTS_URL` to deployed agents.
   Migrations run automatically on first boot.
4. Deploy client with `VITE_API_URL` pointing to server.
5. Seed the demo account (section 5).
6. Validate end-to-end flow from login to generation.

## 7. Platform Notes

### Vercel (Client)

- Project root: `client/`
- Build command: `npm run build`
- Output directory: `dist`
- SPA routing fallback is configured in `client/vercel.json`.

### Render/Railway (Server)

- Root directory: `server/`
- Dockerfile: `server/Dockerfile`
- Health check path: `/api/health`

### Render/Railway (Agents)

- Root directory: `agents/`
- Dockerfile: `agents/Dockerfile`
- Health check path: `/health`

## 8. GitHub Automation

- `ci.yml` runs lint, type-check, build, tests, and image publishing to GHCR on `main`.
- `docker-image.yml` can manually publish images to GHCR.
- `deploy-hooks.yml` can trigger hosting deploy hooks after pushes to `main`.

Configure these repository secrets only if using deploy hooks:

- `DEPLOY_HOOK_SERVER`
- `DEPLOY_HOOK_AGENTS`
- `DEPLOY_HOOK_CLIENT`

## 9. Smoke Tests Before Sharing

- Visit client homepage and dashboard.
- Register/login/logout.
- Create or import a product.
- Run single generation.
- Run bulk generation (if Redis enabled).
- Confirm `/api/docs` loads and key endpoints respond.

## 10. Resume-Ready Output

Before adding to resume, make sure you have:

- Public app URL
- Public API docs URL
- One short demo video (60-120s)
- Updated README with architecture, screenshots, and links
