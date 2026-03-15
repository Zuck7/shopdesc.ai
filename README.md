# ProductWriter AI

AI-powered product description generator for e-commerce sellers.

## The Problem

E-commerce sellers with hundreds or thousands of products need unique, SEO-optimized descriptions for each one. Manual copywriting costs $50–200 per product. Generic AI writing tools aren't built for product listings.

## The Solution

Upload product data (CSV, Shopify sync, or manual entry) → 4 specialized AI agents collaborate to generate SEO-optimized, conversion-focused product content → Output is formatted for your specific platform (Shopify, Amazon, Etsy, WooCommerce).

## Tech Stack

| Layer | Stack |
|-------|-------|
| Frontend | React, Vite, TypeScript, TailwindCSS, ShadCN/UI |
| Backend | Express, TypeScript, MongoDB, Redis, BullMQ |
| AI Agents | Python, FastAPI, LangGraph, LangChain, GPT-4o |
| Infra | Docker Compose, GitHub Actions |

## Getting Started

```bash
# Clone the repo
git clone <repo-url> && cd shopdesc.ai

# Copy env file
cp .env.example .env

# Start all services
docker compose up
```

| Service | URL |
|---------|-----|
| Client | http://localhost:5173 |
| Server | http://localhost:5000 |
| Agents | http://localhost:8000 |

## Project Structure

```
shopdesc.ai/
├── client/    → React SPA (Vite)
├── server/    → Express API (Node.js)
├── agents/    → Python AI Agent Service (FastAPI)
```

See [ROADMAP.md](ROADMAP.md) for the build plan.
