# ai-groceries

## Overview

Grocery list SPA (`index.html`) + local Node server (`server.js`) + optional Cloudflare Worker (`worker/`) for GitHub Pages.

## Setup (human)

See **[SETUP.md](./SETUP.md)** for step-by-step: `.dev.vars`, `npm run dev`, `wrangler secret`, `CLASSIFY_API_BASE`.

## Architecture

- **Local app:** `npm run dev` → loads `OPENAI_API_KEY` from the environment, then **`.dev.vars`**, then **`.env`** (same `KEY=value` line for `OPENAI_API_KEY`).
- **Pages:** static site + Worker URL in `CLASSIFY_API_BASE`; key only in Cloudflare via `wrangler secret put`.

## User Defined Namespaces

- (none)
