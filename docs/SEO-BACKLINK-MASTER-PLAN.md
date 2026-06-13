# Pure Herbex — SEO & Backlink Master Plan

**Site:** https://pureherbex.com (Hostinger — primary public domain)  
**Support stack:** Vercel inbox/status (`pure-herbex-site.vercel.app`) — link only where it adds customer value  
**Last updated:** June 6, 2026  
**Goal:** Dominate organic search for herbal male vitality, stamina, and sexual wellness in Pakistan — while building a defensible backlink profile and conversion funnel into WhatsApp COD orders.

---

## Executive summary

Pure Herbex already has a **strong SEO foundation**: canonical URLs, Google Search Console verification, GTM/GA4, Clarity, Organization + Product + FAQ + BlogPosting schema, 7 indexed blog pillars, and a static sitemap. Recent performance gains mean Google trusts the domain — the next phase is **topic authority expansion**, **internal link architecture**, and **systematic backlink acquisition** without risky black-hat tactics.

This plan is built for a **YMYL-adjacent health supplement** niche in Pakistan. Strategy prioritizes:

1. **Earned editorial backlinks** (blogs, health forums, guest posts)
2. **Owned content hubs** (blog clusters → product)
3. **Feed & syndication** (RSS, Google Discover, social)
4. **Local Pakistan SEO** (city pages, Urdu content, COD trust signals)
5. **Conversion-optimized UX** (fast mobile, WhatsApp CTAs, discreet ordering)

---

## Current SEO audit (baseline)

### What you already have ✅

| Asset | Status |
|-------|--------|
| `metadataBase` + canonical on all main pages | ✅ |
| Google Search Console verification | ✅ |
| GTM `GTM-MV6QT5V3` + GA4 `G-SRYQF0G350` | ✅ |
| Microsoft Clarity heatmaps | ✅ |
| `robots.txt` + sitemap reference | ✅ |
| Organization, WebSite, Product, FAQ, BlogPosting, Breadcrumb JSON-LD | ✅ |
| 7 long-form blog posts (1,500–3,000+ words) | ✅ |
| Open Graph + Twitter cards | ✅ |
| Mobile-first Next.js, trailing-slash URLs | ✅ |
| Social profiles in schema `sameAs` | ✅ Facebook, Instagram, TikTok |

### Critical gaps to close 🔴

| Gap | Impact | Priority |
|-----|--------|----------|
| Static `sitemap.xml` (manual, stale `lastmod`) | Crawl inefficiency | P0 |
| No RSS/Atom feed | Missed syndication + feed backlinks | P0 |
| Blog posts lack **internal cross-links** to each other + product | Weak topical authority | P0 |
| Social share buttons are non-functional (no real share URLs) | Lost social signals + referral traffic | P1 |
| No **related articles** block on blog posts | Poor session depth, weak PageRank flow | P1 |
| No city/landing pages (Lahore, Karachi, Islamabad…) | Missing local long-tail traffic | P1 |
| No Urdu (`ur-PK`) content or hreflang | ~40% of Pakistani searches are Urdu/mixed | P1 |
| Blog index missing canonical + full OG metadata | Weaker blog hub ranking | P2 |
| Product schema missing `offers` with `priceCurrency: PKR` | No rich results for price | P2 |
| Newsletter form is UI-only (no capture) | Lost remarketing list | P2 |
| Fake "1.2k Shares" counter | Trust risk if noticed | P3 |
| No linkable assets beyond blog (tools, PDFs, studies) | Fewer natural backlink targets | P1 |

---

## Strategic positioning

### Primary money keywords (Pakistan)

**Tier 1 — High intent (product + blog pillars already target these)**

- `herbal stamina Pakistan`
- `sex enhancement capsules Pakistan`
- `natural viagra alternative Pakistan`
- `shilajit salajeet Pakistan original`
- `ashwagandha benefits for men Pakistan`
- `men's health supplements Pakistan`

**Tier 2 — Informational (top of funnel → blog)**

- `sildenafil side effects Pakistan`
- `how to increase stamina naturally`
- `testosterone booster herbal Pakistan`
- `timing medicine herbal`
- `salajeet original kaise pehchanen`

**Tier 3 — Local (city landing pages)**

- `herbal stamina Lahore COD`
- `sex timing medicine Karachi delivery`
- `Pure Herbex Okara`
- `men's health supplements Islamabad`

### Topic cluster architecture (hub & spoke)

Build **4 content hubs**. Each hub has 1 pillar page + 4–6 spoke articles. All spokes link up to pillar; pillar links to `/product/` and WhatsApp.

```
HUB A: Stamina & Performance
├── Pillar: /blog/definitive-sexual-performance-guide/
├── Spoke: natural-viagra-sildenafil-alternatives-pakistan ✅
├── Spoke: natural-enhancement-science ✅
├── NEW: premature-stamina-herbal-solutions-pakistan
├── NEW: best-timing-medicine-herbal-vs-chemical
└── NEW: tribulus-terrestris-gokshura-guide

HUB B: Shilajit / Salajeet
├── Pillar: /blog/salajeet-pakistan-price-originality-guide/ ✅
├── Spoke: shilajit-vs-chemical-supplements ✅
├── NEW: salajeet-benefits-for-men-urdu
├── NEW: fake-shilajit-tests-at-home
└── NEW: shilajit-dosage-timing-guide

HUB C: Men's Health Pakistan
├── Pillar: /blog/mens-health-pakistan-vitality-guide/ ✅
├── Spoke: ashwagandha-stamina-guide ✅
├── NEW: low-testosterone-symptoms-pakistan
├── NEW: stress-cortisol-male-performance
└── NEW: diet-exercise-stamina-pakistan

HUB D: Product & Trust
├── Pillar: /product/ (money page)
├── /reviews/ (social proof hub)
├── NEW: /ingredients/ (dedicated ingredient encyclopedia)
├── NEW: /faq/ (standalone FAQ page — more schema, more keywords)
└── NEW: /delivery/ (COD, discreet packaging, city timelines)
```

---

## Phase 1 — On-site technical SEO (Week 1–2)

### 1.1 Dynamic sitemap

Replace static `public/sitemap.xml` with Next.js `app/sitemap.ts`:

- Auto-include all blog slugs from `blog/data.ts`
- Set `lastModified` from post dates
- Add `changeFrequency` and `priority` by page type
- Submit to Google Search Console after deploy

### 1.2 RSS feed (`/blog/feed.xml`)

RSS enables:

- **Feedly / Google News** discovery
- **Automated syndication** to Medium, LinkedIn articles (manual republish with canonical)
- **Podcast-style repurposing** pipelines
- Backlinks from feed directories (see Phase 3)

### 1.3 Internal linking system

Every blog post must include:

- **2–4 contextual internal links** to related posts (anchor text = target keyword)
- **1 CTA link** to `/product/` ("Pure Herbex Ultra Force — Rs. 3,000 COD")
- **1 WhatsApp deep link** with UTM: `?utm_source=blog&utm_medium=internal&utm_campaign={slug}`
- **Related articles** component (3 posts by category/keyword overlap)
- **Breadcrumbs** (already in schema — add visible UI)

**Internal link map (implement first on existing 7 posts):**

| From | Link to | Anchor text |
|------|---------|-------------|
| ashwagandha-stamina-guide | mens-health-pakistan-vitality-guide | men's health supplements Pakistan |
| shilajit-vs-chemical-supplements | salajeet-pakistan-price-originality-guide | original Shilajit Pakistan |
| natural-enhancement-science | definitive-sexual-performance-guide | sexual performance guide |
| natural-viagra-sildenafil-alternatives | product | herbal stamina capsules Pakistan |
| All posts | product | Pure Herbex Ultra Force |

### 1.4 Schema enhancements

| Page | Add |
|------|-----|
| `/product/` | `Offer` with `price: 3000`, `priceCurrency: PKR`, `availability: InStock`, `url` |
| `/product/` | `AggregateRating` (match real reviews page) |
| Blog posts | `Article` `wordCount`, `articleSection`, `inLanguage: en-PK` |
| `/reviews/` | `Review` items + `AggregateRating` |
| Site-wide | `LocalBusiness` with Okara address + `areaServed: PK` |

### 1.5 Core Web Vitals & mobile

- Hostinger: enable **Brotli/Gzip**, HTTP/2, CDN if available
- Lazy-load below-fold images; WebP for product photos
- Preload hero font (Sora) — already using `next/font`
- Target: LCP < 2.5s, CLS < 0.1 on 4G Pakistan mobile

### 1.6 Indexation hygiene

- `robots.txt`: allow `/blog/`, `/product/`, block `/inbox/`, `/api/`
- Add `noindex` on Vercel-only tools (inbox, status admin) — already separate domain
- Fix canonical trailing slashes (site uses `trailingSlash: true` — ensure all canonicals end with `/`)

---

## Phase 2 — Content engine (Week 2–8)

### 2.1 Publishing cadence

| Week | Deliverable |
|------|-------------|
| 1–2 | 2 new spoke articles (Hub A + Hub B) |
| 3–4 | 2 new spokes + 1 Urdu translation of top performer |
| 5–6 | City landing page template × 5 cities |
| 7–8 | Linkable asset #1: "Pakistan Men's Vitality Ingredient Guide" PDF |

**Target:** 2 articles/month minimum + 1 Urdu piece/month.

### 2.2 Article template (SEO-optimized)

Each new post must have:

```yaml
slug: keyword-rich-slug
seoTitle: Primary Keyword | Pure Herbex (≤60 chars)
seoDescription: 150–160 chars, includes Pakistan + benefit + CTA hint
seoKeywords: [5–8 long-tail terms]
category: Hub name
relatedSlugs: [2–3 internal links]
faqSection: [3–5 questions for FAQ schema]
ctaVariant: product | whatsapp | both
```

**Content structure:**

1. Hook (problem in Pakistan context)
2. H2 sections with question-style headings (featured snippet bait)
3. Comparison table (herbal vs chemical) — you already do this well
4. "What to expect" timeline (21/30/90 days)
5. FAQ block with FAQ schema
6. Discreet COD trust section
7. Related articles + product CTA

### 2.3 Urdu content strategy

- Publish **Urdu version** at `/ur/blog/{slug}/` or `/blog/{slug}-ur/`
- `hreflang`: `en-PK` ↔ `ur-PK` on paired articles
- Urdu titles rank for: `سالاجیت`, `ٹائمنگ`, `ہربل میڈیسن`, `مردانہ کمزوری`
- Roman Urdu in meta keywords for mixed searches

### 2.4 City landing pages — **IMPLEMENTED (82 cities)**

**Live hub:** `https://pureherbex.com/delivery/`  
**Template:** `/delivery/{city-slug}/` — auto-generated with unique province copy, FAQ schema, LocalBusiness `areaServed`, and WhatsApp COD CTA.

| Province | Cities live |
|----------|-------------|
| Punjab | 42 (Okara hub, Lahore, Faisalabad, Multan, Sialkot, DG Khan, …) |
| Sindh | 13 (Karachi, Hyderabad, Sukkur, Larkana, Tharparkar, …) |
| Khyber Pakhtunkhwa | 12 (Peshawar, Abbottabad, Swat, DI Khan, …) |
| Balochistan | 7 (Quetta, Gwadar, Turbat, Khuzdar, …) |
| Islamabad ICT | 1 |
| Gilgit-Baltistan | 3 (Gilgit, Skardu, Hunza) |
| Azad Kashmir | 5 (Mirpur, Muzaffarabad, Kotli, …) |

**Total indexed URLs:** 82 city pages + 1 hub = **83 delivery URLs** in sitemap.

Each page includes:
- Unique intro (province + tier + nearby areas + optional local note)
- 5 FAQ items with FAQPage schema
- LocalBusiness schema with `areaServed`
- BreadcrumbList schema
- Internal links to product, blog, reviews, 6 nearby cities
- City-specific WhatsApp order deep link with UTM-ready text

**Priority cities for backlink outreach:** Lahore, Karachi, Islamabad, Rawalpindi, Faisalabad, Multan, Peshawar, Quetta, Hyderabad, Okara

**Next expansion (Phase 2b):** Tehsil-level pages only where search volume justifies — e.g. `/delivery/lahore/dha/`, `/delivery/karachi/clifton/` (add when GSC shows demand).

### 2.5 Linkable assets (backlink magnets)

Create resources other sites *want* to link to:

| Asset | Format | Why it earns links |
|-------|--------|-------------------|
| Original vs Fake Salajeet — Home Test Guide | Interactive checklist + PDF | Health blogs cite "how to verify" |
| 32 Ingredients Glossary | `/ingredients/{herb}/` pages | Each herb = long-tail landing page |
| Pakistan Men's Wellness Statistics | Infographic + blog | Journalists, forums reference |
| COD & Discreet Delivery FAQ | Standalone page | Trust + local SEO |
| Before/After Timeline (anonymized) | Case study format | Social proof shares |

---

## Phase 3 — Backlink acquisition (ongoing)

### 3.1 Backlink philosophy

**Do:** editorial mentions, guest posts, resource page links, forum answers, PR, partnerships  
**Don't:** paid link farms, PBNs, comment spam, Fiverr "1000 backlinks" — these destroy YMYL trust

**Target metrics (6 months):**

| Metric | Now (est.) | 6-month goal |
|--------|------------|--------------|
| Referring domains | Track in GSC | +30 quality domains |
| Blog organic sessions | Track in GA4 | +80% |
| Branded searches "Pure Herbex" | GSC | +50% |
| Avg. position Tier-1 keywords | GSC | Top 10 for 5+ terms |

### 3.2 Tier 1 — Owned & controlled (immediate)

| Channel | Action | Link target |
|---------|--------|-------------|
| Facebook Page | Pin website + weekly blog link | `/blog/{latest}/` |
| Instagram Bio | `pureherbex.com` + story links | `/product/` |
| TikTok Bio | Link in bio + "link in bio" videos | `/blog/` or `/product/` |
| WhatsApp Status | Use Vercel status page + site link | `pureherbex.com/status/` |
| WhatsApp broadcast | Share new blog with UTM | Blog posts |
| Google Business Profile | Create listing — Okara, Punjab | `pureherbex.com` |
| YouTube (create channel) | "Herbal education" shorts → link | Blog pillars |

### 3.3 Tier 2 — Content syndication & feeds

| Platform | Method |
|----------|--------|
| **Medium** | Republish blog excerpts with `rel=canonical` to pureherbex.com |
| **LinkedIn Articles** | Republish research team posts — link to full article |
| **Substack** | "Pure Herbex Wellness Brief" — weekly digest linking to site |
| **Pinterest** | Infographic pins → blog posts (high share in health niche) |
| **Reddit** | r/pakistan, r/islamabad health threads — genuine answers, link when relevant |
| **Quora** | Answer "best herbal stamina Pakistan" — profile links to site |

**RSS directories to submit** `/blog/feed.xml`:

- Feedspot (Health & Wellness category)
- AllTop (Men's Health)
- Google Publisher Center (if eligible)

### 3.4 Tier 3 — Guest posting & editorial outreach

**Target site types (Pakistan + global health):**

- Pakistani health/lifestyle blogs
- Unani/Ayurveda education sites
- Men's fitness blogs (guest post: "Ashwagandha for athletes")
- Punjab/Okara local business directories
- Supplement review blogs (offer product sample for honest review)

**Outreach email template:**

```
Subject: Guest article idea for your readers — herbal stamina (Pakistan-focused)

Hi [Name],

I'm from the Pure Herbex research team. We published a clinical-style guide on
[topic] that your audience might find useful: [URL]

I'd love to contribute an original guest post (not published elsewhere) such as:
"[Proposed title]"

No payment required — just a byline link to our wellness journal if you find it valuable.

Best,
[Name]
```

**Monthly outreach quota:** 10 emails → expect 1–2 placements.

### 3.5 Tier 4 — Digital PR & partnerships

| Tactic | Execution |
|--------|-----------|
| **HARO / Connectively** | Respond to journalist queries on supplements, men's health |
| **Local PR** | "Okara-based herbal brand ships nationwide COD" — Dunya News lifestyle, local Punjab papers |
| **Influencer micro-deals** | 5–10k follower fitness/health TikTokers — review + link in bio |
| **Pharmacy partnerships** | Partner with ethical herbal shops — "As featured on pureherbex.com" reciprocal |
| **Podcast appearances** | Pakistani health podcasts — mention site |

### 3.6 Tier 5 — Community & forum backlinks (white-hat)

Participate genuinely in:

- PakWheels off-topic health threads (where allowed)
- Facebook groups: men's health Pakistan, herbal remedies
- Discord/Telegram wellness communities
- Answer questions with value first; link only when it helps

**Rule:** Max 2–3 forum links/month. Quality > quantity.

### 3.7 Broken link building

1. Find broken links on health blogs pointing to dead supplement articles (Ahrefs free / manual)
2. Email: "Your link to [dead URL] is broken — our guide covers the same topic: [your URL]"
3. High conversion rate for educational content

---

## Phase 4 — Social & feed automation

### 4.1 Content repurposing pipeline

```
Blog post published
    ├── RSS feed updated automatically
    ├── Facebook: auto-post title + excerpt + link (Meta API or Buffer)
    ├── Instagram: carousel from H2 headings → link in bio
    ├── TikTok: 60-sec "3 facts from our research" → bio link
    ├── WhatsApp Status: image card + link (manual or via status tool)
    └── Pinterest: pin each H2 section as separate pin
```

**Tools (free/low-cost):** Buffer, Later, or n8n self-hosted automation.

### 4.2 UTM discipline

All external links use consistent UTMs for GA4:

| Source | utm_source | utm_medium | utm_campaign |
|--------|------------|------------|--------------|
| Facebook | facebook | social | {post-slug} |
| Instagram | instagram | social | bio / story |
| TikTok | tiktok | social | video-{id} |
| Guest post | {sitename} | referral | guest-{slug} |
| WhatsApp | whatsapp | messaging | status / broadcast |

### 4.3 Google Discover optimization

- Hero images 1200px+ wide on blog posts (currently using product bottle — create per-post OG images)
- `max-image-preview:large` meta tag
- Fresh content signals: update `dateModified` when refreshing posts
- Avoid clickbait — Discover penalizes YMYL sensationalism

---

## Phase 5 — Local & Pakistan-specific SEO

### 5.1 Google Business Profile

- Business name: Pure Herbex
- Category: Health & Beauty Shop / Vitamin & Supplements Store
- Address: Okara, Punjab (service-area business if no storefront)
- Phone: +923160924151
- Website: https://pureherbex.com
- Posts: weekly blog link + offer ("Rs. 3,000 COD")

### 5.2 NAP consistency

Ensure **Name, Address, Phone** identical everywhere:

```
Pure Herbex | Okara, Punjab, Pakistan | +923160924151 | https://pureherbex.com
```

List on:

- PakBizDirectory, Hamariweb business listings
- Facebook / Instagram / TikTok (already done)
- Google Business Profile

### 5.3 Trust signals for Pakistani buyers

Emphasize on every money page:

- ✅ Cash on Delivery (no advance payment)
- ✅ Discreet plain packaging
- ✅ Ships from Okara — all Pakistan
- ✅ WhatsApp human support
- ✅ 100% herbal / no hidden chemicals

These reduce bounce rate → indirect SEO boost.

---

## Phase 6 — Measurement & iteration

### 6.1 KPI dashboard (weekly review)

| Tool | What to track |
|------|---------------|
| Google Search Console | Impressions, clicks, avg position, new queries |
| GA4 | Organic sessions, blog → WhatsApp clicks, conversion events |
| Clarity | Scroll depth on blog, rage clicks, mobile issues |
| Ahrefs / Ubersuggest (free tier) | Referring domains, top backlinks |

### 6.2 GA4 conversion events to add

- `whatsapp_click` (all wa.me links)
- `blog_read_75` (scroll depth)
- `product_view`
- `cod_intent` (WhatsApp with "order" in prefilled text)

### 6.3 Monthly SEO ritual (first Monday)

1. GSC: export top 20 queries — find new article ideas
2. Update 1 old post (refresh date, add internal links)
3. Pitch 10 guest posts
4. Publish 2 new articles or 1 Urdu piece
5. Check Core Web Vitals in PageSpeed Insights
6. Review backlink profile — disavow only obvious spam

---

## Phase 7 — 90-day execution calendar

### Month 1 — Foundation

| Week | Tasks |
|------|-------|
| W1 | Deploy dynamic sitemap, RSS feed, internal links on 7 posts, related articles |
| W1 | Fix social share buttons; add product `Offer` schema |
| W2 | Google Business Profile live; submit RSS to Feedspot |
| W2 | Publish: `premature-stamina-herbal-solutions-pakistan` |
| W3 | Publish: `fake-shilajit-home-tests-guide` (expand existing post) |
| W3 | ~~Create `/delivery/lahore/` + `/delivery/karachi/`~~ **Done — 80 cities live** |
| W4 | Medium + LinkedIn republish top 2 posts (canonical set) |
| W4 | First outreach batch: 10 guest post emails |

### Month 2 — Expansion

| Week | Tasks |
|------|-------|
| W5 | 3 more city pages (Islamabad, Faisalabad, Multan) |
| W5 | Urdu version of `salajeet-pakistan-price-originality-guide` |
| W6 | Ingredients glossary: 5 herb pages (`/ingredients/ashwagandha/`) |
| W6 | TikTok channel launch — 4 educational shorts |
| W7 | Guest post placement #1 (target secured in Month 1 outreach) |
| W7 | PDF linkable asset: Salajeet verification guide |
| W8 | Standalone `/faq/` page with 15+ FAQ schema items |

### Month 3 — Authority

| Week | Tasks |
|------|-------|
| W9 | Publish hub pillar refresh (add 500 words + new internal links) |
| W9 | Micro-influencer campaign: 3 TikTok reviews |
| W10 | Broken link building: 20 prospects |
| W10 | Peshawar + Rawalpindi city pages |
| W11 | Substack newsletter launch (repurpose blog) |
| W11 | Second guest post + local Punjab PR pitch |
| W12 | Full audit: rankings, backlinks, CWV — adjust Q3 plan |

---

## Phase 8 — Advanced strategies (Month 4+)

### 8.1 Programmatic SEO (careful)

Generate **ingredient × benefit** pages only when each has 300+ unique words:

- `/ingredients/ashwagandha/stamina/`
- `/ingredients/shilajit/testosterone/`

Do **not** mass-generate thin city × keyword pages — Google penalizes doorway pages.

### 8.2 AI-assisted content (with human review)

- Use AI for **outlines and research summaries** only
- Medical/health claims reviewed by "Pure Herbex Research Team" voice
- Never publish unverified clinical claims — YMYL compliance

### 8.3 Video SEO

- YouTube: "How to identify original Salajeet" → embed on blog → VideoObject schema
- YouTube description links to pureherbex.com with UTM

### 8.4 E-E-A-T signals

- Add **author bios** with credentials on blog (`author` schema `jobTitle`, `knowsAbout`)
- "Medically reviewed by" disclaimer where appropriate
- Link to `/about/` with team story, Okara facility, quality process
- Privacy policy already exists — add **medical disclaimer** page

### 8.5 Competitor gap analysis

Quarterly, search these competitors in GSC related queries and Ahrefs:

- Local herbal brands (Hamdard-style positioning, local SEO)
- Generic "timing tablets" keywords
- Shilajit resellers on Daraz (capture "original not Daraz" intent)

---

## Backlink target list (starter — 30 prospects)

### Pakistani / South Asian

1. Health & wellness sections of Pakistani news blogs
2. Urdu health Facebook pages (collaboration, not spam)
3. Punjab business directories
4. Herbal medicine education blogs
5. Fitness bloggers in Lahore/Karachi

### Global (guest post angle: "Pakistan herbal market insights")

6. Men's health blogs accepting guest posts
7. Ayurveda/Unani education sites
8. Supplement ingredient databases (link to ingredient glossary)
9. Reddit r/Supplements — genuine participation
10. Quora spaces on men's health

### Directories & feeds

11. Feedspot — submit RSS
12. Google Business Profile
13. Bing Places
14. Apple Business Connect (if available in PK)

---

## Risk & compliance

| Risk | Mitigation |
|------|------------|
| YMYL health claims penalty | Factual tone, avoid "cure" language, add disclaimer |
| Duplicate content (Medium republish) | Always set canonical to pureherbex.com |
| Toxic backlinks | Monitor GSC; disavow only clear spam |
| Urdu/English duplicate | Use hreflang, not duplicate without translation |
| Sexual content ad restrictions | SEO focus on "stamina", "vitality", "men's health" — less explicit terms in meta |

---

## Implementation checklist (code — Phase 1)

- [x] `docs/SEO-BACKLINK-MASTER-PLAN.md` (this document)
- [x] `app/sitemap.ts` — dynamic sitemap
- [x] `app/blog/feed.xml/route.ts` — RSS feed
- [x] `lib/blog-seo.ts` — related posts helper
- [x] Blog post page — related articles + working share links
- [x] `blog/data.ts` — `relatedSlugs` per post
- [x] Product `Offer` schema with PKR price (already present; URL fixed)
- [ ] `robots.txt` — disallow `/api/`, `/inbox/` if ever on same domain
- [x] Blog index canonical + OG metadata
- [x] City landing pages — 82 cities + hub (`/delivery/`)
- [ ] GA4 `whatsapp_click` event via GTM

---

## Quick wins you can do today (no code)

1. **Google Search Console** → URL Inspection → request indexing for all 7 blog posts
2. **Google Business Profile** → create and verify
3. **Facebook** → post your best blog with link; pin to top of page
4. **WhatsApp Status** → share blog link with "Read free guide"
5. **Submit sitemap** in GSC if not already: `https://pureherbex.com/sitemap.xml`
6. **Answer 3 Quora questions** this week with genuine advice + link

---

## Success definition

In 90 days, Pure Herbex should be:

- **The most cited Pakistani herbal stamina brand** in organic search for Tier-1 keywords
- **A content hub** that other sites link to for Salajeet, Ashwagandha, and natural Viagra alternative topics
- **A conversion machine** where blog → WhatsApp → COD order is tracked and optimized
- **Trusted** — E-E-A-T signals, reviews, discreet delivery messaging on every page

---

*Next step: Implement Phase 1 technical items in codebase, deploy to Hostinger, then execute Month 1 calendar.*
