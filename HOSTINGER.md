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

`/`, `/product/`, `/blog/`, `/about/`, `/contact/`, `/reviews/`, `/privacy/`

## Vercel only (not on Hostinger)

`/inbox/`, `/status/`, `/api/*` → `https://pure-herbex-site.vercel.app/inbox/`
