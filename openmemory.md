# ai-groceries

## Overview

Static grocery list UI (`index.html`) with Russian copy. Items are classified into supermarket departments via OpenAI.

## Architecture

- **Frontend:** Single-page `index.html` (localStorage `gr7`), no bundler.
- **AI (local):** `POST /api/classify` on Node (`server.js`, port 5173). Env: `OPENAI_API_KEY`.
- **AI (GitHub Pages):** Static site cannot hold secrets. Deploy **`cloudflare/src/worker.js`** as a Cloudflare Worker; store **`OPENAI_API_KEY`** with `wrangler secret put OPENAI_API_KEY` (not in repo). In `index.html`, set **`CLASSIFY_API_BASE`** to the Worker origin (e.g. `https://ai-groceries-classify.your-subdomain.workers.dev`, no trailing slash). Pages and Worker are separate; GitHub Secrets are only for CI if you automate Worker deploy—they do not reach the live HTML.

### GitHub Pages + Worker (manual)

1. Install [Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/) (`npm i -g wrangler` or `npx wrangler`).
2. `cd cloudflare && npx wrangler login` (Cloudflare account).
3. Optionally rename the worker in `wrangler.toml` (`name = "…"`).
4. `npx wrangler secret put OPENAI_API_KEY` — paste API key once; it stays on Cloudflare.
5. `npx wrangler deploy` — note the Worker URL.
6. In `index.html`, set `var CLASSIFY_API_BASE = 'https://…workers.dev';`, commit, push so Pages rebuilds.
7. Local Worker test: copy `cloudflare/.dev.vars.example` to `cloudflare/.dev.vars`, add key, run `npx wrangler dev` from `cloudflare/`.

## User Defined Namespaces

- (none)

## Components

- **server.js** — HTTP server: serves `/`, proxies classification to OpenAI, parses category id with word-boundary / token matching.
- **cloudflare/src/worker.js** — Same `/api/classify` contract + CORS for Pages; `OPENAI_API_KEY` binding via Wrangler secret.

## Patterns

- Category ids are English (`dairy`, `bakery`, …); model output is matched with `\b` + token split, not by stripping all non-letters to one string.
