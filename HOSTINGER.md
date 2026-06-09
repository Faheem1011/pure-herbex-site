# Hostinger deploy (landing site only)

This branch is **landing pages only** — no inbox, no WhatsApp API, no Vercel KV.

| Branch | Use |
|---|---|
| `main` | Vercel — full site + inbox CRM (`pure-herbex-site.vercel.app/inbox/`) |
| `hostinger` | Hostinger — `pureherbex.com` marketing site only |

## Hostinger Git settings

In **hPanel → Websites → pureherbex.com → Git**:

1. Repository: `https://github.com/Faheem1011/pure-herbex-site`
2. Branch: **`hostinger`** (not `main`)
3. Build command: `npm install && npm run build`
4. Start / output: `npm run start` (Node.js app)
5. Node version: **20.x**

No environment variables are required for the landing site.

## Pages included

- `/` Home
- `/product/` Shop
- `/blog/` Blog
- `/about/`, `/contact/`, `/reviews/`, `/privacy/`

## Pages removed (Vercel only)

- `/inbox/` CRM
- `/status/` WhatsApp status
- `/api/*` WhatsApp webhooks and messaging

## Updating the landing site from main

When you change marketing pages on `main` and want Hostinger updated:

```bash
git checkout hostinger
git merge main
# Keep hostinger deletions if Git asks — inbox/api files must stay removed
git push origin hostinger
```

Or cherry-pick only landing-related commits onto `hostinger`.

## DNS note

Point `pureherbex.com` A/CNAME to Hostinger only.  
Keep inbox on Vercel: `https://pure-herbex-site.vercel.app/inbox/`
