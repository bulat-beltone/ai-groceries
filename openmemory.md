# ai-groceries

## Overview

Static grocery list UI (`index.html`) with Russian copy. Items are classified into supermarket departments via OpenAI.

## Architecture

- **Frontend:** Single-page `index.html` (localStorage `gr7`), no bundler.
- **AI (local):** `POST /api/classify` on Node (`server.js`, port 5173). Env: `OPENAI_API_KEY`. Uses **`lib/handle-classify-request.js`**.
- **AI (GitHub Pages):** Deploy **`worker/index.js`** via **`wrangler.toml`** at repo root (`npm run deploy:worker`). Store **`OPENAI_API_KEY`** with `npx wrangler secret put OPENAI_API_KEY`. In `index.html`, set **`CLASSIFY_API_BASE`** to the Worker URL (no trailing slash). GitHub Secrets do not reach the browser; the key stays only on Cloudflare.

### GitHub Pages + Worker (steps)

1. `npm install` and `npx wrangler login`.
2. Optionally rename the worker in **`wrangler.toml`**.
3. `npx wrangler secret put OPENAI_API_KEY`.
4. `npm run deploy:worker` — copy the Worker URL.
5. Set `var CLASSIFY_API_BASE = 'https://…workers.dev';` in **`index.html`**, commit, push (Pages rebuilds).
6. Local Worker: copy **`.dev.vars.example`** to **`.dev.vars`**, run `npx wrangler dev`.

## User Defined Namespaces

- (none)

## Components

- **server.js** — Serves `/`, delegates classify to **`lib/handle-classify-request.js`**.
- **worker/index.js** — Cloudflare Worker, same API + CORS; shared **`lib/`**; secret via Wrangler.

## Patterns

- Category ids are English; model output matched with `\b` + token split (`lib/parse-cat-id.js`).
