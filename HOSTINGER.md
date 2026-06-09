# Hostinger deploy (landing site only)

This branch builds a **static site** into the `out/` folder.

| Branch | Platform | Output |
|---|---|---|
| `main` | Vercel (Node) | `.next/` + server |
| `hostinger` | Hostinger (static) | `out/` |

## Hostinger hPanel settings

**Websites → pureherbex.com → Git → Deploy:**

| Setting | Value |
|---|---|
| Repository | `https://github.com/Faheem1011/pure-herbex-site` |
| Branch | **`hostinger`** |
| Framework | **Other / Static** (NOT Vite) |
| Node version | 20.x |
| Build command | `npm install && npm run build:hostinger` |
| Output directory | **`out`** |
| Start command | *(leave empty — static site)* |

No environment variables required.

## Local test

```bash
npm run build:hostinger
# Static files appear in ./out/
```

## Pages

- `/`, `/product/`, `/blog/`, `/about/`, `/contact/`, `/reviews/`, `/privacy/`

## Not on Hostinger (Vercel only)

- `/inbox/`, `/status/`, `/api/*`

## Sync from main

```bash
git checkout hostinger
git merge main
# Keep deletions — do not restore inbox/api files
git push origin hostinger
```

Inbox CRM: `https://pure-herbex-site.vercel.app/inbox/`
