# ai-groceries

## Overview

Static grocery list UI (`index.html`) with Russian copy. Items are classified into supermarket departments via OpenAI.

## Architecture

- **Frontend:** Single-page `index.html` (localStorage `gr7`), no bundler.
- **AI:** `POST /api/classify` on a small Node server (`server.js`, port 5173). The browser cannot call `https://api.openai.com` directly (CORS); the server proxies with `OPENAI_API_KEY`.
- **Run locally:** `OPENAI_API_KEY=sk-... npm run dev` then open `http://localhost:5173` (not `file://`).

## User Defined Namespaces

- (none)

## Components

- **server.js** — HTTP server: serves `/`, proxies classification to OpenAI, parses category id with word-boundary / token matching.

## Patterns

- Category ids are English (`dairy`, `bakery`, …); model output is matched with `\b` + token split, not by stripping all non-letters to one string.
