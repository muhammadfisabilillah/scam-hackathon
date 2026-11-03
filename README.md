# ScamPilot AI

> Paste the message. Let AI investigate. You stay in control.

ScamPilot AI is a **Remote Control Investigation Agent** built for the "Remote Control AI" hackathon. It triages suspicious messages, surfaces the evidence behind a verdict, and keeps a human in control of every decision.

Milestones 1-4 are complete: PII redaction, deterministic risk scoring, Groq explanations with Zod validation, transactional persistence, a read-only Playwright browser investigation for linked URLs, local investigation history, and submission assets.

## Hackathon Submission

Built for the **Remote Control AI** hackathon.

- [DevPost submission copy](docs/devpost-submission.md)
- [2-minute demo video script](docs/demo-video-script.md)
- Project name: **ScamPilot AI**

## Stack

- Next.js 15 (App Router) + TypeScript (strict)
- Tailwind CSS
- Prisma + SQLite
- Groq SDK (with deterministic fallback)
- Playwright Chromium (headless browser investigation)
- Zod + Lucide React

## Prerequisites

- Node.js 18.18+ (20 LTS recommended)
- npm 9+
- Chromium for Playwright (installed with `npm run browser:install`)

## Getting started

```bash
# 1. Install dependencies (also runs `prisma generate`)
npm install

# 2. Create the SQLite database from the schema
npx prisma db push

# 3. Install the Chromium binary used by the browser agent
npm run browser:install

# 4. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> If `prisma generate` was skipped (for example with `--ignore-scripts`), run `npx prisma generate` manually.

## How to Run the Demo

1. Start the app with `npm run dev` and open [http://localhost:3000](http://localhost:3000).
2. On the home page, click the **Browser demo: fake bank** sample card.
3. Click **Analyze Message** and wait for the investigation result.
4. Point out the deterministic score, **Why this score**, and the **Remote browser investigation** screenshot with the password-field warning.
5. Use the **Copy** buttons on the suggested reply and report draft.
6. Click **History** in the header to review the newest 20 investigations.
7. Optional: run the **Browser demo: safe page** sample to show a low-risk result.

For a production-style demo, run `npm run build` and then `npm run start`.

## Environment variables

Copy `.env.example` to `.env` if you are setting the project up somewhere new. The checked-in `.env` already contains safe demo defaults.

| Variable | Default | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | `file:./dev.db` | SQLite database location (relative to `prisma/`) |
| `GROQ_API_KEY` | `gsk_YOUR_API_KEY_HERE` | Groq API key for LLM analysis |
| `LLM_MODEL` | `llama-3.3-70b-versatile` | Groq model used for triage (auto-retries `openai/gpt-oss-120b` if unavailable) |
| `DEMO_MODE` | `true` | Allows private/localhost targets to be scanned for local demos |
| `BROWSER_TIMEOUT` | `10000` | Max time (ms) for URL investigation scans (clamped to 3-30s) |
| `MAX_URL_SCANS` | `2` | Number of extracted URLs to investigate per message (0-5; only the first is scanned today) |

Replace `GROQ_API_KEY` with a real key from [console.groq.com](https://console.groq.com). If the configured model is unavailable, ScamPilot automatically retries with a supported Groq model and then falls back to a deterministic explanation. The risk score never depends on the LLM.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Generate the Prisma client and build for production |
| `npm run start` | Serve the production build |
| `npm run lint` | Run Next.js ESLint checks |
| `npm run browser:install` | Download the Playwright Chromium binary |
| `npm run db:push` | Push the Prisma schema to SQLite |
| `npm run db:studio` | Open Prisma Studio |

## Project structure

```text
scam-hackathon/
├─ prisma/
│  └─ schema.prisma          # Analysis, Indicator, Evidence, UrlScan, Draft
├─ src/
│  ├─ app/
│  │  ├─ api/
│  │  │  ├─ analyze/route.ts # POST /api/analyze + browser scan pipeline
│  │  │  └─ history/route.ts # GET /api/history (newest 20)
│  │  ├─ demo/
│  │  │  ├─ phishing-bank/page.tsx
│  │  │  └─ legit-announcement/page.tsx
│  │  ├─ history/page.tsx    # Local investigation history
│  │  ├─ globals.css         # Tailwind layers + design utilities
│  │  ├─ layout.tsx          # Root layout + metadata
│  │  └─ page.tsx            # Landing page / investigation console
│  ├─ components/
│  │  └─ analysis/
│  │     ├─ AnalysisResultPanel.tsx
│  │     └─ UrlScanCard.tsx  # Browser findings + screenshot
│  └─ lib/
│     ├─ ai/
│     │  └─ groq.ts          # Groq explanation + deterministic fallback
│     ├─ analysis/
│     │  ├─ extractIndicators.ts
│     │  ├─ redactPII.ts
│     │  ├─ scoreRisk.ts
│     │  ├─ types.ts
│     │  └─ validation.ts    # Zod schemas
│     ├─ browser/
│     │  ├─ safeScan.ts      # Guarded, read-only Playwright scan
│     │  └─ types.ts
│     ├─ db/
│     │  └─ prisma.ts        # Hot-reload-safe Prisma singleton
│     └─ fixtures/
│        └─ samples.ts       # 8 typed samples, incl. browser demos
├─ public/screenshots/       # Generated scan screenshots (gitignored)
├─ docs/
│  ├─ devpost-submission.md
│  └─ demo-video-script.md
├─ .env
├─ .env.example
├─ tailwind.config.ts
└─ postcss.config.js
```

## Data model

- **Analysis** — one investigation: raw input, redacted text, risk score, verdict, summary
- **Indicator** — extracted signal (type, value, confidence)
- **Evidence** — human-readable finding with source and weight
- **UrlScan** — URL investigation result (domain, title, password field, forms, screenshot, status)
- **Draft** — generated response/report drafts attached to an analysis

All child models cascade-delete with their parent analysis and are indexed by `analysisId`.

## API

`POST /api/analyze`

```json
{ "text": "Suspicious message to investigate" }
```

The endpoint redacts PII, extracts indicators, calculates a deterministic score, investigates the first extracted URL when `MAX_URL_SCANS` is greater than zero, generates an explanation with Groq (or a deterministic fallback), and persists everything in a single transaction. It returns indicators, evidence, drafts, the explanation, and a `urlScans` array (with screenshot path, password-field flag, form count, and scan status/error).

`GET /api/history`

Returns the newest 20 analyses as a JSON array of `{ id, inputText, riskScore, verdict, createdAt }`. The message text is truncated to a short preview. The History page at `/history` uses the same data directly from Prisma.

## Browser investigation

- Runs headless Chromium through Playwright on the Node.js runtime; no serverless Edge execution.
- Only HTTP(S) URLs and local `/demo/...` paths are accepted.
- Private network targets are blocked unless `DEMO_MODE=true` or the path starts with `/demo/`.
- Read-only: forms are never filled or submitted, buttons are never clicked, dialogs are dismissed, and downloads are disabled.
- Captures a viewport screenshot at `public/screenshots/<analysisId>.png`.
- Scan failures degrade gracefully to text-only scoring instead of failing the request.
- Browser findings add deterministic score weight: `+25` for a password field, and `+10` for forms on a suspicious domain.

Local demo targets used by the sample buttons:

- `/demo/phishing-bank` — simulated bank verification page with a password field and form.
- `/demo/legit-announcement` — safe campus announcement page with no form.

## Milestone roadmap

1. **Milestone 1 (complete)** — UI foundation, typed fixtures, Prisma schema, DB singleton.
2. **Milestone 2 (complete)** — PII redaction, deterministic scoring, Groq explanations, Zod validation, transactional persistence, inline results.
3. **Milestone 3 (complete)** — read-only Playwright URL investigation, local demo targets, screenshots, browser-informed scoring, UrlScan persistence and UI.
4. **Milestone 4 (complete)** — history API and page, copy-to-clipboard draft actions, DevPost submission copy, demo video script, and README submission guide.
5. **Future** — human approve/edit flow for generated drafts, multi-URL investigations, browser extension, and SSRF-hardened DNS/redirect checks.

## Troubleshooting

- **`@prisma/client did not initialize yet`** — run `npx prisma generate`.
- **Database missing / table errors** — run `npx prisma db push`.
- **Port 3000 in use** — run `npm run dev -- -p 3001`.
- **`next lint` prompts to configure ESLint** — ensure dependencies are installed with `npm install`.
- **Browser scan fails with a missing executable** — run `npm run browser:install`.
- **Local demo URL is not scanned** — ensure the path starts with `/demo/` and `DEMO_MODE=true` for private hosts.
