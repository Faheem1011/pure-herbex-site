import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { blogPosts } from "../app/blog/data";

const SITE = "https://pureherbex.com";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function parsePostDate(dateStr: string): string {
  const parsed = new Date(dateStr);
  return Number.isNaN(parsed.getTime()) ? "2026-05-15T00:00:00.000Z" : parsed.toISOString();
}

const items = blogPosts
  .map((post) => {
    const url = `${SITE}/blog/${post.slug}/`;
    return `
    <item>
      <title>${escapeXml(post.seoTitle || post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${escapeXml(post.seoDescription || post.excerpt)}</description>
      <pubDate>${new Date(parsePostDate(post.date)).toUTCString()}</pubDate>
      <category>${escapeXml(post.category)}</category>
    </item>`;
  })
  .join("");

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Pure Herbex Wellness Journal</title>
    <link>${SITE}/blog/</link>
    <description>Expert insights on male vitality, herbal science, and natural performance in Pakistan.</description>
    <language>en-pk</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE}/blog/feed.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;

const outDir = join(process.cwd(), "public", "blog");
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "feed.xml"), xml.trim(), "utf-8");
console.log(`RSS written: public/blog/feed.xml (${blogPosts.length} posts)`);
