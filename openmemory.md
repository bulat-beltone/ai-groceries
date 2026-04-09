# ai-groceries

## Overview

Static grocery list UI (`index.html`) with Russian copy. Items are classified into supermarket departments via OpenAI.

## Architecture

- **Frontend:** Single-page `index.html` (localStorage `gr7`), no bundler.
- **Local dev:** `server.js` serves the app and `POST /api/classify` with `OPENAI_API_KEY` in the environment (`npm run dev`, http://localhost:5173).
- **GitHub Pages:** Browsers cannot call OpenAI directly (CORS). Use the **Cloudflare Worker** in `worker/` — same `/api/classify` contract, `OPENAI_API_KEY` via `wrangler secret put OPENAI_API_KEY`.
- **Deploy URL in the page:** Set `<meta name="classify-api" content="https://<worker>.workers.dev/api/classify">` in `index.html` (or `window.CLASSIFY_URL`) to that Worker URL. Localhost ignores the meta and uses `location.origin + '/api/classify'`.

## User Defined Namespaces

- (none)

## Components

- **server.js** — Dev HTTP server; uses `lib/handle-classify-request.js`.
- **worker/index.js** — Production edge proxy; same handler + CORS `*`.
- **lib/** — Shared OpenAI prompt, response parsing, and JSON handler.

## Patterns

- Category ids are English (`dairy`, `bakery`, …); model output is matched with `\b` + token split.
