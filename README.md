# AI News Intelligence Dashboard

A production-ready AI news intelligence dashboard built with **Next.js**, **TypeScript**, and **Tailwind CSS**. Fetches daily AI news from NewsAPI.org, deduplicates articles, performs sentiment analysis, and stores everything in **Airtable**. Deploys on **Vercel** with scheduled cron refreshes.

## Features

- **Daily news ingestion** via NewsAPI.org with smart deduplication (hash, title, URL)
- **Sentiment analysis** (positive/neutral/negative) and auto-categorization
- **Smart tagging** (ML, NLP, Robotics, etc.) via keyword detection
- **Airtable storage** with full CRUD, filtering, search, and sorting
- **Dashboard** with stats, category charts, and sentiment breakdown
- **Search & filters** (category, sentiment, read status, favorites)
- **Vercel cron jobs** for automatic daily refresh (6am, 12pm, 6pm UTC)
- **Article detail pages** with AI summaries and full content
- **Responsive dark UI** with smooth animations

## Tech Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + custom components
- Airtable SDK (storage)
- NewsAPI.org (news source)
- Chart.js (dashboard charts)
- Vercel (hosting + cron)

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and fill in your keys:

```bash
cp .env.example .env
```

Required:

| Variable | Description |
|---|---|
| `AIRTABLE_BASE_ID` | Your Airtable base ID |
| `AIRTABLE_API_KEY` | Your Airtable API key |
| `AIRTABLE_TABLE_NAME` | Table name (default: `AI_News`) |
| `NEWSAPI_KEY` | Your NewsAPI.org API key (free at newsapi.org) |
| `CRON_SECRET` | Optional secret to protect cron endpoint |

### 3. Set up Airtable

Create a table in your Airtable base with these fields (single line text / formula as appropriate):

| Field Name | Type |
|---|---|
| title | Single line text |
| description | Long text |
| content | Long text |
| url | URL |
| imageUrl | Single line text |
| source | Single line text |
| author | Single line text |
| publishedAt | Date/time |
| category | Single select |
| sentiment | Single select (positive/neutral/negative) |
| summary | Long text |
| tags | Multiple select |
| isRead | Checkbox |
| isFavorite | Checkbox |
| hash | Single line text |
| createdAt | Date/time |
| updatedAt | Date/time |

### 4. Run locally

```bash
npm run dev
# open http://localhost:3000
```

### 5. Manual refresh

Click **Refresh News** in the header, or run:

```bash
curl -X POST http://localhost:3000/api/news/refresh
```

## Deploy on Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → **Import Project**
3. Select your GitHub repo
4. In **Settings → Environment Variables**, add:
   - `AIRTABLE_BASE_ID`
   - `AIRTABLE_API_KEY`
   - `AIRTABLE_TABLE_NAME` (optional)
   - `NEWSAPI_KEY`
   - `CRON_SECRET` (optional)
5. Deploy

The `vercel.json` file configures three daily cron refreshes (6am, 12pm, 6pm UTC) that call `/api/news/refresh`.

## Project Structure

```
ai-news-intelligence/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── news/          # GET /api/news, POST /api/news/refresh
│   │   │   └── stats/         # GET /api/stats
│   │   ├── dashboard/        # Dashboard page
│   │   ├── news/[id]/        # Article detail page
│   │   ├── page.tsx          # Main news feed
│   │   ├── layout.tsx        # Root layout
│   │   └── globals.css
│   ├── components/           # Reusable UI components
│   └── lib/                  # Business logic
│       ├── airtable.ts       # Airtable client + queries
│       └── news.ts           # News ingestion + dedup
├── vercel.json               # Cron schedule
├── package.json
├── tsconfig.json
└── .env.example
```

## Environment Variables

See `.env.example` for all available variables.

## License

MIT