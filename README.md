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
- `packages/backend/` — Express + TypeScript API server with Airtable persistence
- `packages/frontend/` — Vite + React + TypeScript dashboard frontend
- `packages/shared/` — Shared TypeScript types used by both frontend and backend

Create these Airtable tables in one base. Column names are case-sensitive and must match exactly:

| Table | Required columns |
|---|---|
| `Articles` | `id` (single line text, primary field), `title` (single line text), `url` (URL), `sourceName` (single line text), `sourceDomain` (single line text), `publishedAt` (date with time), `fetchedAt` (date with time), `content` (long text), `summary` (long text), `category` (single select), `subcategory` (single line text), `trendingScore` (number), `duplicateGroupId` (single line text), `isLead` (checkbox), `language` (single line text), `thumbnailUrl` (URL), `relatedArticleIds` (long text containing a JSON array), `isSaved` (checkbox) |
| `Tools` | `id` (single line text, primary field), `name` (single line text), `description` (long text), `url` (URL), `category` (single select), `trendingScore` (number), `mentions` (number), `lastMentioned` (date with time), `sourceArticles` (long text containing a JSON array), `logoUrl` (URL) |
| `Trends` | `id` (single line text, primary field), `topic` (single line text), `category` (single select), `mentionCount` (number), `sentiment` (single select), `relatedArticleIds` (long text containing a JSON array), `trendDirection` (single select), `period` (single select) |
| `RefreshLog` | `id` (single line text, primary field), `success` (checkbox), `articlesFetched` (number), `articlesNew` (number), `articlesDuplicated` (number), `error` (long text), `timestamp` (date with time) |

Use these `category` options: `AI Coding`, `AI Agents`, `AI Productivity`, `AI Writing`, `AI Image`, `AI Video`, `AI Audio`, `AI Automation`, `AI Developer Tools`, `AI Research`, `AI Models`, `Other AI Tools`, and `General`. Use `positive`, `negative`, and `neutral` for trend sentiment; use `up`, `down`, and `stable` for trend direction.

## Environment Variables

Copy `.env.example` to `.env` and configure:

- `PORT` — Backend port (default: 3001)
- `AIRTABLE_API_KEY` — Airtable personal access token with data.records read/write access
- `AIRTABLE_BASE_ID` — Airtable base ID (starts with `app`)
- `AIRTABLE_ARTICLES_TABLE` — Articles table name (default: `Articles`)
- `AIRTABLE_TOOLS_TABLE` — Tools table name (default: `Tools`)
- `AIRTABLE_TRENDS_TABLE` — Trends table name (default: `Trends`)
- `AIRTABLE_REFRESH_LOG_TABLE` — Refresh log table name (default: `RefreshLog`)
- `GROQ_BASE_URL` — Groq API base URL
- `GROQ_API_KEY` — Groq API key for AI services
- `GROQ_MODEL` — Groq model name (default: llama-3.3-70b-versatile)
- `REFRESH_INTERVAL_MINUTES` — Auto-refresh interval (default: 30)
- `GDELT_API_URL` — GDELT DOC API URL
- `FRONTEND_URL` — Frontend URL for CORS

## Vercel Deployment

The Vercel project should deploy only `packages/frontend`:

- Root Directory: leave blank (repository root)
- Build command: `npm run build --workspace=@ai-news/frontend`
- Output directory: `packages/frontend/dist`
- Install command: `npm ci --include-workspace-root --workspace=@ai-news/frontend --workspace=@ai-news/shared`
- Set `VITE_API_BASE_URL` to the deployed backend origin, for example `https://your-backend.example.com/api`.

The explicit workspace build command prevents Vercel from resolving `build:frontend` in the backend workspace. The Express + Airtable backend is not a Vercel serverless service in this repository because its scheduler requires a long-running process. Deploy it to Render, Railway, Fly.io, or a VM, then point `VITE_API_BASE_URL` at that origin.

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
