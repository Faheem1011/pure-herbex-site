# Hostinger deploy (landing site only)

This **`hostinger` branch** always builds a static site into **`out/`** — no env vars needed.

| Branch | Platform | Build output |
|---|---|---|
| `main` | Vercel (Node server) | `.next/` + `npm start` |
| `hostinger` | Hostinger (static files) | **`out/`** |

## Hostinger hPanel — exact settings

**Websites → pureherbex.com → Deployments → Edit:**

| Setting | Value |
|---|---|
| Repository | `Faheem1011/pure-herbex-site` |
| Branch | **`hostinger`** |
| Framework | **Other** (NOT Vite, NOT Next.js Node) |
| Node version | 20.x |
| Install command | `npm install` |
| Build command | `npm run build` |
| Output directory | **`out`** |
| Start command | *(leave empty)* |

> **Ignore Hostinger’s “use `.next`” suggestion.** `.next` only works with a Node server (`npm start`). Hostinger static hosting needs plain HTML in **`out/`**.

No environment variables required on this branch.

## Local test

```bash
git checkout hostinger
npm install
npm run build
# Must create out/index.html
```

## Pages on pureherbex.com

**Core:** `/`, `/product/`, `/blog/`, `/about/`, `/contact/`, `/reviews/`, `/privacy/`

**SEO hubs (269+ URLs):**
- `/ingredients/` + 32 ingredient pages
- `/delivery/` + 82 city pages + 7 province hubs + 31 area pages
- `/ur/delivery/` + 82 Urdu city pages
- `/sitemap.xml`, `/robots.txt`, `/blog/feed.xml`
- IndexNow key: `/phxindexnow2026pureherbex.txt`

**Optional env (Bing verification only):**
```env
NEXT_PUBLIC_BING_SITE_VERIFICATION=your_bing_code
```
Rebuild after setting in Hostinger hPanel → Environment variables.

## Vercel only (not on Hostinger)

`/inbox/`, `/status/`, `/api/*` → `https://pure-herbex-site.vercel.app/inbox/`
