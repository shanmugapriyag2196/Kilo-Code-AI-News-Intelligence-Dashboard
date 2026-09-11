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
- `OPENAI_BASE_URL` — OpenAI-compatible API base URL
- `OPENAI_API_KEY` — API key for AI services
- `OPENAI_MODEL` — Model name (default: gpt-4o-mini)
- `REFRESH_INTERVAL_MINUTES` — Auto-refresh interval (default: 30)
- `GDELT_API_URL` — GDELT DOC API URL
- `FRONTEND_URL` — Frontend URL for CORS

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
