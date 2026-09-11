# AI News Intelligence Dashboard

## Setup

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Run dev servers (backend + frontend)
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Run linting
npm run lint

# Run type checking
npm run typecheck
```

## Architecture

- `packages/shared/` — Shared TypeScript types used by both frontend and backend
- `packages/backend/` — Express + TypeScript API server with SQLite persistence
- `packages/frontend/` — Vite + React + TypeScript dashboard frontend

## Environment Variables

Copy `.env.example` to `.env` and configure:

- `PORT` — Backend port (default: 3001)
- `DATABASE_PATH` — SQLite database path
- `GROQ_BASE_URL` — Groq API base URL
- `GROQ_API_KEY` — Groq API key for AI services
- `GROQ_MODEL` — Groq model name (default: llama-3.3-70b-versatile)
- `REFRESH_INTERVAL_MINUTES` — Auto-refresh interval (default: 30)
- `GDELT_API_URL` — GDELT DOC API URL
- `FRONTEND_URL` — Frontend URL for CORS

## Vercel Deployment

The Vercel project should deploy only `packages/frontend`:

- Build command: `npm run build:frontend`
- Output directory: `packages/frontend/dist`
- Install command: `npm ci --include-workspace-root --workspace=@ai-news/frontend --workspace=@ai-news/shared`
- Set `VITE_API_BASE_URL` to the deployed backend origin, for example `https://your-backend.example.com/api`.

The Express + SQLite backend is not a Vercel serverless service in this repository. Deploy it to a long-running host such as Render, Railway, Fly.io, or a VM, then point `VITE_API_BASE_URL` at that origin.

## API Endpoints

- `GET /api/health` — Health check
- `GET /api/news?search=&category=&dateRange=today|yesterday|7d|30d|custom&from=&to=` — List news
- `GET /api/news/trending` — Trending news
- `GET /api/tools/trending` — Trending AI tools
- `GET /api/trends` — AI trends
- `GET /api/stats` — Dashboard statistics
- `POST /api/refresh` — Manual news refresh
- `GET /api/saved` — Saved news items
- `PUT /api/saved/:id` — Save/unsave news
- `DELETE /api/saved/:id` — Delete saved news
