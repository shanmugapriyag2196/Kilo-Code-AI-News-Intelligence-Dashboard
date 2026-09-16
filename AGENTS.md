# AI News Intelligence — Agent Guidelines

## Project Overview
Next.js 14 (App Router) + TypeScript + Tailwind dashboard for daily AI news.
Data sources: NewsAPI.org (ingestion) + Airtable (storage).
Deployed on Vercel with cron-based daily refreshes.

## Key Conventions
- **Source layout**: `src/app/` (pages + API routes), `src/components/` (UI), `src/lib/` (business logic), `src/types/` (shared types).
- **Path alias**: `@/*` maps to `src/*` (see `tsconfig.json`).
- **Client components**: start with `"use client"` when using hooks/state.
- **Server components**: default; do not use hooks. Fetch data directly.
- **API routes**: under `src/app/api/`. Return `{ success, data, error, meta }`.
- **Airtable**: all DB access goes through `src/lib/airtable.ts`. Never call Airtable SDK directly elsewhere.
- **News ingestion**: `src/lib/news.ts` handles fetching, deduplication, sentiment, tagging.
- **No dummy data**: never seed or fabricate articles. Only real NewsAPI results stored in Airtable.
- **Deduplication**: check by `hash` (title+url sha256), `title`, and `url` before inserting.
- **Styling**: Tailwind only. Dark theme (`bg-slate-950`, `text-white`). Use `brand-*` colors for accents.

## Common Commands
- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run lint` — lint
- `npm run typecheck` — type check (`tsc --noEmit`)

## Environment Variables
Required (see `.env.example`):
- `AIRTABLE_BASE_ID`, `AIRTABLE_API_KEY`, `NEWSAPI_KEY`
Optional: `AIRTABLE_TABLE_NAME`, `CRON_SECRET`, `NEXTAUTH_URL`

## Important Files
- `src/lib/airtable.ts` — Airtable queries (find/create/update/list/getStats/getDistinctCategories)
- `src/lib/news.ts` — `refreshNews()` main ingestion entry point
- `src/app/api/news/route.ts` — list articles (GET)
- `src/app/api/news/refresh/route.ts` — trigger refresh (GET/POST, protected by `CRON_SECRET`)
- `src/app/api/stats/route.ts` — dashboard stats (GET)
- `vercel.json` — cron schedule (3x daily)

## Rules
- Never commit real secrets. Use `.env` (gitignored).
- Keep API responses consistent: `{ success, data?, error?, meta? }`.
- Articles must always include: title, url, source, publishedAt, category, sentiment, tags, hash.
- When editing UI, match existing component patterns (NewsCard, Filters, StatsCards).
- Run `npm run typecheck` and `npm run lint` after significant changes.