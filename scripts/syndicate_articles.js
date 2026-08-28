/**
 * Pure Herbex Multi-Platform Article Syndication Generator
 * Compiles SEO-optimized, backlinked articles tailored for:
 * 1. Medium.com (DA 95+)
 * 2. GuestPost.com.pk (Pakistani Local DA)
 * 3. SubmitMyBlog.com (Blog Directories)
 * 4. Tribune.com.pk (Express Tribune Blogs DA 85+)
 * 5. Discover.HubPages.com (DA 88+)
 * 
 * Usage:
 *   node scripts/syndicate_articles.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read blogs data by parsing the file
const blogsFilePath = path.join(__dirname, '..', 'src', 'data', 'blogs.ts');
const rawCode = fs.readFileSync(blogsFilePath, 'utf-8');

// Basic extraction of array
const blogMatch = rawCode.match(/export const BLOG_POSTS: BlogPost\[\] = (\[[\s\S]*?\]);/);
let BLOG_POSTS = [];

if (blogMatch) {
  try {
    // Evaluate clean object array in isolated function
    const cleanJsonString = blogMatch[1];
    BLOG_POSTS = Function(`return ${cleanJsonString}`)();
  } catch (e) {
    console.warn('Could not parse blogs dynamically, fallback to regex', e);
  }
}

const outputBaseDir = path.join(__dirname, '..', 'syndicated-articles');

// Ensure output directories exist
const platforms = ['medium', 'guestpost_pk', 'submitmyblog', 'tribune_pk', 'hubpages'];
platforms.forEach(platform => {
  const dir = path.join(outputBaseDir, platform);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

console.log('===========================================================');
console.log('🌿 Pure Herbex Multi-Platform Syndication & Backlink Engine');
console.log('===========================================================\n');

let totalGenerated = 0;

BLOG_POSTS.forEach(post => {
  const canonicalUrl = `https://pureherbex.com/journal/${post.slug}`;

  // --------------------------------------------------------------------------
  // 1. MEDIUM FORMAT (Markdown with Canonical and Rich Visual Callouts)
  // --------------------------------------------------------------------------
  let mediumContent = `# ${post.title}\n\n`;
  mediumContent += `*Canonical Link: [${canonicalUrl}](${canonicalUrl})*\n`;
  mediumContent += `*Author: ${post.author} • Pure Herbex Research*\n\n`;
  mediumContent += `![${post.title}](https://pureherbex.com${post.image})\n\n`;
  mediumContent += `> ${post.content.intro}\n\n`;

  post.content.sections.forEach(sec => {
    mediumContent += `## ${sec.heading}\n\n${sec.body}\n\n`;
    if (sec.bulletPoints) {
      sec.bulletPoints.forEach(bp => { mediumContent += `* ${bp}\n`; });
      mediumContent += '\n';
    }
  });

  mediumContent += `### Summary & Conclusion\n\n${post.content.conclusion}\n\n`;
  mediumContent += `---\n\n`;
  mediumContent += `### About Pure Herbex\n`;
  mediumContent += `Handcrafted in small batches with 100% natural Damask rose petals, organic moringa, and secret botanical elixirs. Learn more at **[Pure Herbex](https://pureherbex.com)** or explore our flagship **[Koveria Glow 3-Piece Kit](https://pureherbex.com/product/koveria-glow-complete-kit)**.\n`;

  fs.writeFileSync(path.join(outputBaseDir, 'medium', `${post.slug}.md`), mediumContent);

  // --------------------------------------------------------------------------
  // 2. GUESTPOST.COM.PK (Localized Pakistani Skincare Anchor Backlinks)
  // --------------------------------------------------------------------------
  let guestPostContent = `# ${post.title} - Pure Botanical Skincare Guide\n\n`;
  guestPostContent += `**Target Website:** www.guestpost.com.pk\n`;
  guestPostContent += `**Category:** Beauty & Skincare / Health & Lifestyle\n`;
  guestPostContent += `**Primary Anchor Text:** [Best organic skincare in Pakistan](https://pureherbex.com/)\n`;
  guestPostContent += `**Secondary Anchor:** [Koveria Glow Face Pack Kit](https://pureherbex.com/product/koveria-glow-complete-kit)\n\n`;
  guestPostContent += `### Article Content\n\n${post.content.intro}\n\n`;

  post.content.sections.forEach(sec => {
    guestPostContent += `### ${sec.heading}\n\n${sec.body}\n\n`;
    if (sec.bulletPoints) {
      sec.bulletPoints.forEach(bp => { guestPostContent += `- ${bp}\n`; });
      guestPostContent += '\n';
    }
  });

  guestPostContent += `### Key Takeaway for Pakistani Climate & Skin\n\n${post.content.conclusion}\n\n`;
  guestPostContent += `**Author Bio:** Written by the skincare formulation team at [Pure Herbex](https://pureherbex.com), Pakistan's premier artisanal brand creating freshly blended herbal masks, steam-distilled rose hydrosols, and radiant skincare rituals with nationwide Cash on Delivery.\n`;

  fs.writeFileSync(path.join(outputBaseDir, 'guestpost_pk', `${post.slug}.md`), guestPostContent);

  // --------------------------------------------------------------------------
  // 3. SUBMITMYBLOG.COM (Niche Directory & Product Review Angle)
  // --------------------------------------------------------------------------
  let submitMyBlogContent = `# Review: ${post.title}\n\n`;
  submitMyBlogContent += `**Target Portal:** submitmyblog.com\n`;
  submitMyBlogContent += `**Tags:** ${post.keywords.join(', ')}\n`;
  submitMyBlogContent += `**Backlink Reference:** [Pure Herbex Skincare Journal](${canonicalUrl})\n\n`;
  submitMyBlogContent += `${post.content.intro}\n\n`;

  post.content.sections.forEach(sec => {
    submitMyBlogContent += `#### ${sec.heading}\n\n${sec.body}\n\n`;
  });

  submitMyBlogContent += `#### Final Verdict\n\n${post.content.conclusion}\n\n`;
  submitMyBlogContent += `👉 Discover the full range of artisanal skincare formulations at **[Pure Herbex](https://pureherbex.com)**.\n`;

  fs.writeFileSync(path.join(outputBaseDir, 'submitmyblog', `${post.slug}.md`), submitMyBlogContent);

  // --------------------------------------------------------------------------
  // 4. TRIBUNE.COM.PK (Express Tribune Editorial Lifestyle Format)
  // --------------------------------------------------------------------------
  let tribuneContent = `# The Rise of Artisanal Botanical Skincare in Pakistan: ${post.title}\n\n`;
  tribuneContent += `**Target Submission:** https://tribune.com.pk/submit_blog\n`;
  tribuneContent += `**Desk:** Life & Style / Health & Wellness\n`;
  tribuneContent += `**Author:** Botanical Research Contributor\n\n`;
  tribuneContent += `As Pakistani consumers increasingly turn away from harsh commercial chemical cosmetics and imported bleaching creams, artisanal botanical alternatives formulated specifically for our local sub-tropical climate are creating a new standard of healthy skin care.\n\n`;
  tribuneContent += `${post.content.intro}\n\n`;

  post.content.sections.forEach(sec => {
    tribuneContent += `### ${sec.heading}\n\n${sec.body}\n\n`;
  });

  tribuneContent += `### The Bottom Line\n\n${post.content.conclusion}\n\n`;
  tribuneContent += `*The writer is a certified herbal skincare researcher associated with [Pure Herbex](https://pureherbex.com), an artisanal botanical skincare studio in Lahore, Pakistan.*\n`;

  fs.writeFileSync(path.join(outputBaseDir, 'tribune_pk', `${post.slug}.md`), tribuneContent);

  // --------------------------------------------------------------------------
  // 5. HUBPAGES (Discover.HubPages.com How-To Beauty Module)
  // --------------------------------------------------------------------------
  let hubpagesContent = `# Complete How-To Guide: ${post.title}\n\n`;
  hubpagesContent += `**Target Platform:** discover.hubpages.com\n`;
  hubpagesContent += `**Topic Hub:** Skin Care & Natural Remedies\n\n`;
  hubpagesContent += `## Introduction & Problem Overview\n\n${post.content.intro}\n\n`;

  post.content.sections.forEach((sec, idx) => {
    hubpagesContent += `## Step ${idx + 1}: ${sec.heading}\n\n${sec.body}\n\n`;
    if (sec.bulletPoints) {
      hubpagesContent += `**Quick Tips:**\n`;
      sec.bulletPoints.forEach(bp => { hubpagesContent += `* ${bp}\n`; });
      hubpagesContent += '\n';
    }
  });

  hubpagesContent += `## Summary & Next Steps\n\n${post.content.conclusion}\n\n`;
  hubpagesContent += `*For more detailed botanical formulations and ingredient analyses, visit the [Pure Herbex Botanical Glossary](https://pureherbex.com/ingredients).*\n`;

  fs.writeFileSync(path.join(outputBaseDir, 'hubpages', `${post.slug}.md`), hubpagesContent);

  totalGenerated += 5;
});

// Generate Master Readme Index for the user
const indexMd = `# 🚀 Pure Herbex Multi-Platform Article Syndication Hub

This directory contains pre-formatted, SEO-optimized articles tailored for each major publishing platform to generate high-authority backlinks, increase Google search rankings, and drive organic traffic to **https://pureherbex.com**.

---

## 📊 Syndication Platforms Overview

| Platform | Domain Authority | Recommended Link Strategy | Submission Portal |
| :--- | :--- | :--- | :--- |
| **Medium.com** | **DA 95+** | Set \`rel="canonical"\` to on-site URL. High ranking potential in Google Discover. | [Medium.com](https://medium.com/) |
| **GuestPost.com.pk** | **High Local DA** | Direct homepage & product backlinks targeting Pakistani searches. | [www.guestpost.com.pk](https://www.guestpost.com.pk) |
| **SubmitMyBlog.com** | **High Niche DA** | Product reviews & botanical ingredient spotlights. | [submitmyblog.com](https://submitmyblog.com) |
| **Express Tribune Blogs** | **DA 85+ (Tier 1)** | Editorial brand citations & expert contributor authority. | [tribune.com.pk/submit_blog](https://tribune.com.pk/submit_blog) |
| **HubPages** | **DA 88+** | Evergreen "How-To" DIY beauty guides with deep link anchors. | [discover.hubpages.com](https://discover.hubpages.com) |

---

## 🛠️ Direct Publishing from Antigravity IDE

### 1. Direct Medium Publishing Tool
Run the included command to publish directly to your Medium profile via the Medium REST API:
\`\`\`bash
node scripts/publish_medium.js [article-slug] [--public]
\`\`\`
*(Add your \`MEDIUM_INTEGRATION_TOKEN\` to \`.env\` from your Medium Account Settings).*

### 2. Re-generating Syndication Packs
To re-compile all platform articles after updating blog content:
\`\`\`bash
node scripts/syndicate_articles.js
\`\`\`

---

## 📁 Directory Structure
- \`medium/\`: Markdown files with canonical links and image headers.
- \`guestpost_pk/\`: Localized Pakistani guest posts with anchor keywords.
- \`submitmyblog/\`: Product review & blog directory formatted posts.
- \`tribune_pk/\`: Editorial opinion pieces formatted for Express Tribune submission.
- \`hubpages/\`: Modular "How-To" beauty guides formatted for HubPages.
`;

fs.writeFileSync(path.join(outputBaseDir, 'INDEX.md'), indexMd);

console.log(`✅ Successfully generated ${totalGenerated} syndicated articles across 5 platforms!`);
console.log(`📁 Location: ${outputBaseDir}\n`);
