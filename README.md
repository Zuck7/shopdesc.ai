# Shopdesc AI

AI-powered product description generator for e-commerce sellers.

## The Problem

E-commerce sellers with hundreds or thousands of products need unique, SEO-optimized descriptions for each one. Manual copywriting costs $50–200 per product. Generic AI writing tools aren't built for product listings.

## The Solution

Upload product data (CSV, Shopify sync, or manual entry) → 4 specialized AI agents collaborate to generate SEO-optimized, conversion-focused product content → Output is formatted for your specific platform (Shopify, Amazon, Etsy, WooCommerce).

## Live Demo

- **App:** _add your deployed client URL here_
- **API docs:** _add your deployed server URL_ + `/api/docs`
- **Demo login:** `demo@shopdesc.ai` / `demo1234` (seeded by `npm run seed`)

## Screenshots

| Product catalog | Generate description |
|---|---|
| ![Products list](docs/screenshots/products.png) | ![Generate form](docs/screenshots/generate.png) |

| Generation results | Analytics |
|---|---|
| ![Generation results with SEO score and variants](docs/screenshots/results.png) | ![Analytics dashboard](docs/screenshots/analytics.png) |

| Brand voice settings |
|---|
| ![Brand voice settings](docs/screenshots/brand-voice.png) |

## Running Locally

```bash
cp .env.example .env          # fill in OPENAI_API_KEY at minimum
docker compose up             # postgres, redis, server, client, agents
cd server && npm run seed     # demo account + 50 sample products
```

The server applies database migrations automatically on startup.
Client runs on :5173, server on :5001, agents on :8000.

## Tech Stack

| Layer | Stack |
|-------|-------|
| Frontend | React, Vite, TypeScript, TailwindCSS, ShadCN/UI |
| Backend | Express, TypeScript, PostgreSQL, Drizzle ORM, Redis, BullMQ |
| AI Agents | Python, FastAPI, LangGraph, LangChain, GPT-4o |
| Infra | Docker Compose, GitHub Actions |
