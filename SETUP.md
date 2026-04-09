# Setup (step by step)

You need the OpenAI API key in **two different places** depending on what you run:

| What you run | Where the key lives |
|--------------|---------------------|
| **This computer** — `npm run dev` | File **`.dev.vars`** in the project folder (or `export OPENAI_API_KEY=...`) |
| **Cloudflare** — live Worker for GitHub Pages | `wrangler secret put` (stored on Cloudflare, not in the repo) |

`.dev.vars` is **not** uploaded to GitHub (it is in `.gitignore`). That is correct.

---

## Part 1 — Test on your computer (recommended first)

1. Open the project folder in Terminal.
2. Install dependencies once:
   ```bash
   npm install
   ```
3. Create or edit **`.dev.vars`** in the **root** of the project (same folder as `package.json`). It should look like this (no spaces around `=`):
   ```bash
   OPENAI_API_KEY=sk-your-actual-key-here
   ```
4. Start the app:
   ```bash
   npm run dev
   ```
5. In the browser, open **http://localhost:5173** (not a `file://` link).
6. Add something like “Молоко” — it should move out of “Определяю…” into a category.

If classification fails, check the Terminal: you should **not** see the warning about missing `OPENAI_API_KEY`. If you do, fix the line in `.dev.vars` and restart `npm run dev`.

---

## Part 2 — Put the site on GitHub Pages **with** AI

GitHub Pages only hosts **static files**. The API key cannot live in the website files. You use a **Cloudflare Worker** as a small backend.

1. In Terminal, still in the project folder:
   ```bash
   npx wrangler login
   ```
   Complete the login in the browser when it asks.

2. Send your key to Cloudflare (one time; it is stored as a **secret** there):
   ```bash
   npx wrangler secret put OPENAI_API_KEY
   ```
   Paste the same key you use locally, press Enter.

3. Deploy the Worker:
   ```bash
   npm run deploy:worker
   ```
   At the end, Wrangler prints a URL like `https://ai-groceries-classify.your-name.workers.dev` — **copy it**.

4. Open **`index.html`** in the editor. Find:
   ```javascript
   var CLASSIFY_API_BASE = '';
   ```
   Set it to your Worker URL **without** a trailing slash, for example:
   ```javascript
   var CLASSIFY_API_BASE = 'https://ai-groceries-classify.your-name.workers.dev';
   ```

5. Commit and push to GitHub. Wait for GitHub Pages to rebuild, then open your Pages URL and try adding a product again.

---

## Optional: test only the Worker on your computer

```bash
npx wrangler dev
```

Wrangler reads **`.dev.vars`** automatically for this command.

---

## Checklist

- [ ] `.dev.vars` exists with `OPENAI_API_KEY=sk-...`
- [ ] `npm run dev` → http://localhost:5173 works
- [ ] (For Pages) `wrangler secret put OPENAI_API_KEY` done
- [ ] (For Pages) `npm run deploy:worker` done
- [ ] (For Pages) `CLASSIFY_API_BASE` in `index.html` matches your Worker URL
