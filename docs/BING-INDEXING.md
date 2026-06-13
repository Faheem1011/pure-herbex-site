# Bing Indexing — Pure Herbex

**Site:** https://pureherbex.com  
**Sitemap:** https://pureherbex.com/sitemap.xml  
**IndexNow key:** https://pureherbex.com/phxindexnow2026pureherbex.txt  

---

## Step 1 — Bing Webmaster Tools (one time)

1. Go to [Bing Webmaster Tools](https://www.bing.com/webmasters)
2. Sign in with Microsoft or Google account
3. **Add site:** `https://pureherbex.com`
4. **Fastest:** click **Import from Google Search Console** (you already verified Google)
5. If manual: choose **HTML meta tag** verification
6. Copy the `content` value from Bing (e.g. `ABCD1234...`)
7. In **Hostinger hPanel → Environment variables** add:

```env
NEXT_PUBLIC_BING_SITE_VERIFICATION=YOUR_BING_CODE_HERE
```

8. Redeploy `hostinger` branch (or wait for auto-deploy)
9. Click **Verify** in Bing Webmaster

---

## Step 2 — Submit sitemap in Bing

1. Bing Webmaster → **Sitemaps**
2. Submit: `https://pureherbex.com/sitemap.xml`
3. Bing will crawl ~259 URLs over 1–7 days

---

## Step 3 — IndexNow instant ping (after each deploy)

IndexNow tells Bing (and Yandex) to crawl URLs immediately.

**From project folder (hostinger branch):**

```bash
npm run indexnow
```

This pings all public URLs in batches to:
- `https://api.indexnow.org/indexnow`
- `https://www.bing.com/indexnow`

Run after every SEO deploy to speed up Bing indexing.

---

## Step 4 — Monitor in Bing

| Report | What to watch |
|--------|----------------|
| **Pages** | Indexed count climbing toward 250+ |
| **Search Performance** | Impressions for city + ingredient keywords |
| **URL Inspection** | Paste `/delivery/lahore/` — check index status |

Bing often indexes **local Pakistan queries** faster than Google for new sites.

---

## Optional — Bing UET (ads only)

If you run Microsoft Ads, add to Hostinger env:

```env
NEXT_PUBLIC_BING_UET_TAG_ID=YOUR_TAG_ID
```

Redeploy — tracking loads automatically from `app/layout.tsx`.

---

## Checklist

- [ ] Bing Webmaster site added + verified
- [ ] Sitemap submitted in Bing
- [ ] `npm run indexnow` run after deploy
- [ ] GSC already linked (done)
- [ ] `/faq/` page live (FAQ schema for rich results)

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Bing won't verify | Set `NEXT_PUBLIC_BING_SITE_VERIFICATION`, redeploy, wait 2 min |
| robots.txt 404 | Use **`https://pureherbex.com/robots.txt`** (with **s**, no trailing slash) |
| Bing `Host:` line error | Removed — file uses only standard directives now |
| IndexNow 403 | Confirm key file loads: `/phxindexnow2026pureherbex.txt` |
| Low Bing index count | Wait 7 days; re-run `npm run indexnow`; check robots.txt allows `/` |
