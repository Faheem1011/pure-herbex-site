# 🚀 Pure Herbex Multi-Platform Article Syndication Hub

This directory contains pre-formatted, SEO-optimized articles tailored for each major publishing platform to generate high-authority backlinks, increase Google search rankings, and drive organic traffic to **https://pureherbex.com**.

---

## 📊 Syndication Platforms Overview

| Platform | Domain Authority | Recommended Link Strategy | Submission Portal |
| :--- | :--- | :--- | :--- |
| **Medium.com** | **DA 95+** | Set `rel="canonical"` to on-site URL. High ranking potential in Google Discover. | [Medium.com](https://medium.com/) |
| **GuestPost.com.pk** | **High Local DA** | Direct homepage & product backlinks targeting Pakistani searches. | [www.guestpost.com.pk](https://www.guestpost.com.pk) |
| **SubmitMyBlog.com** | **High Niche DA** | Product reviews & botanical ingredient spotlights. | [submitmyblog.com](https://submitmyblog.com) |
| **Express Tribune Blogs** | **DA 85+ (Tier 1)** | Editorial brand citations & expert contributor authority. | [tribune.com.pk/submit_blog](https://tribune.com.pk/submit_blog) |
| **HubPages** | **DA 88+** | Evergreen "How-To" DIY beauty guides with deep link anchors. | [discover.hubpages.com](https://discover.hubpages.com) |

---

## 🛠️ Direct Publishing from Antigravity IDE

### 1. Direct Medium Publishing Tool
Run the included command to publish directly to your Medium profile via the Medium REST API:
```bash
node scripts/publish_medium.js [article-slug] [--public]
```
*(Add your `MEDIUM_INTEGRATION_TOKEN` to `.env` from your Medium Account Settings).*

### 2. Re-generating Syndication Packs
To re-compile all platform articles after updating blog content:
```bash
node scripts/syndicate_articles.js
```

---

## 📁 Directory Structure
- `medium/`: Markdown files with canonical links and image headers.
- `guestpost_pk/`: Localized Pakistani guest posts with anchor keywords.
- `submitmyblog/`: Product review & blog directory formatted posts.
- `tribune_pk/`: Editorial opinion pieces formatted for Express Tribune submission.
- `hubpages/`: Modular "How-To" beauty guides formatted for HubPages.
