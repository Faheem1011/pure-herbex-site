# Google & Bing Search Setup — Pure Herbex

**Site:** https://pureherbex.com  
**Sitemap:** https://pureherbex.com/sitemap.xml  
**RSS:** https://pureherbex.com/blog/feed.xml  
**IndexNow key:** https://pureherbex.com/phxindexnow2026pureherbex.txt  

---

## What is already live in code

| System | ID / URL | Status |
|--------|----------|--------|
| Google Search Console verification | `r6EENSmrJ6_2NeYVkKtE2i-1pIu5qn6KxNegT-ws5OU` | ✅ In `app/layout.tsx` |
| Google Analytics 4 | `G-SRYQF0G350` | ✅ gtag + GTM |
| Google Tag Manager | `GTM-MV6QT5V3` | ✅ Container |
| Microsoft Clarity | `wsyc5zjml5` | ✅ Heatmaps |
| Dynamic sitemap | `/sitemap.xml` | ✅ ~250+ URLs |
| robots.txt | `/robots.txt` | ✅ Blocks `/api/`, `/inbox/` |
| IndexNow key file | `/phxindexnow2026pureherbex.txt` | ✅ For Bing fast indexing |
| WhatsApp click events | `whatsapp_click` in GA4 | ✅ Auto on all wa.me links |
| hreflang | en-PK ↔ ur-PK on delivery cities | ✅ |

---

## Step 1 — Google Search Console

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Property should already be verified via HTML meta tag
3. **Submit sitemap:** `https://pureherbex.com/sitemap.xml`
4. **Request indexing** for priority URLs:
   - `/`
   - `/product/`
   - `/ingredients/`
   - `/delivery/`
   - `/delivery/lahore/`
   - `/delivery/karachi/`
   - `/ur/delivery/lahore/`
5. Monitor **Performance** → Queries weekly for new city/ingredient keywords

---

## Step 2 — Bing Webmaster Tools

1. Go to [Bing Webmaster Tools](https://www.bing.com/webmasters)
2. **Add site:** `https://pureherbex.com`
3. Choose **HTML meta tag** verification
4. Copy the `content` value from Bing (looks like `ABCD1234...`)
5. Add to Hostinger environment variables:

```env
NEXT_PUBLIC_BING_SITE_VERIFICATION=YOUR_BING_CODE_HERE
```

6. Redeploy the site
7. Click **Verify** in Bing Webmaster
8. **Submit sitemap:** `https://pureherbex.com/sitemap.xml`
9. **Import from Google Search Console** (Bing offers one-click import — use it)

### IndexNow (instant Bing indexing)

Already configured. After each deploy, optionally ping:

```bash
curl -X POST https://pureherbex.com/api/indexnow/ \
  -H "Content-Type: application/json" \
  -d '{"urls":["https://pureherbex.com/sitemap.xml"]}'
```

Or set `INDEXNOW_PING_SECRET` in env and use `Authorization: Bearer YOUR_SECRET`.

---

## Step 3 — Bing UET (optional ads tracking)

If you run Microsoft/Bing Ads:

1. Create UET tag in Microsoft Advertising
2. Add to env:

```env
NEXT_PUBLIC_BING_UET_TAG_ID=YOUR_UET_TAG_ID
```

3. Redeploy — UET loads automatically with SPA tracking

---

## Step 4 — GA4 conversion setup

In [GA4 Admin](https://analytics.google.com/):

1. **Admin → Events** — mark `whatsapp_click` as a **conversion**
2. **Admin → Data streams → pureherbex.com** — enable enhanced measurement
3. Link GA4 to Google Search Console (Admin → Product links)

### GTM (optional extra tags)

Container `GTM-MV6QT5V3` is already on every page. You can add:
- Facebook Pixel via GTM
- Custom scroll depth tags for blog

---

## Step 5 — Sitemap contents (auto-generated)

| Section | Count |
|---------|-------|
| Core pages | 10 |
| Blog posts | 7 |
| Ingredients | 32 |
| Delivery cities (EN) | 82 |
| Delivery cities (UR) | 82 |
| Province hubs | 7 |
| Area/neighbourhood pages | 33 |
| **Total** | **~253 URLs** |

---

## Step 6 — Post-deploy checklist

- [ ] Deploy latest build to Hostinger
- [ ] Confirm `https://pureherbex.com/sitemap.xml` loads
- [ ] Confirm `https://pureherbex.com/robots.txt` loads
- [ ] Submit sitemap in Google Search Console
- [ ] Submit sitemap in Bing Webmaster
- [ ] Add `NEXT_PUBLIC_BING_SITE_VERIFICATION` and verify Bing
- [ ] Mark `whatsapp_click` as GA4 conversion
- [ ] POST to `/api/indexnow/` after deploy
- [ ] Test GA4 Realtime — click a WhatsApp button, see `whatsapp_click` event

---

## Environment variables (.env on Hostinger)

```env
# Bing Webmaster HTML tag verification (required for Bing)
NEXT_PUBLIC_BING_SITE_VERIFICATION=

# Optional: Bing Ads UET
NEXT_PUBLIC_BING_UET_TAG_ID=

# Optional: protect IndexNow ping endpoint
INDEXNOW_PING_SECRET=

# Optional: custom IndexNow key (default: phxindexnow2026pureherbex)
INDEXNOW_KEY=phxindexnow2026pureherbex
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Bing not verifying | Ensure env var is set, redeploy, wait 2 min, retry |
| Sitemap 404 | Rebuild Next.js — `app/sitemap.ts` must be deployed |
| GA4 no data | Check ad blockers; verify `G-SRYQF0G350` in page source |
| Duplicate indexing | Canonical + hreflang already set on delivery pages |
| inbox indexed | `robots.txt` disallows `/inbox/` — request removal in GSC if needed |
