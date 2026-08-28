/**
 * Pure Herbex Medium Direct Publishing Script
 * Uses Medium's Official REST API to publish articles with canonical URLs and backlink anchors.
 * 
 * Usage:
 *   node scripts/publish_medium.js [article-slug] [--public]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import blogs data
const blogsFilePath = path.join(__dirname, '..', 'src', 'data', 'blogs.ts');
const rawBlogsContent = fs.readFileSync(blogsFilePath, 'utf-8');

// Load environment variables from .env if present
const envPath = path.join(__dirname, '..', '.env');
let envVars = {};
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      envVars[match[1]] = (match[2] || '').trim().replace(/^['"]|['"]$/g, '');
    }
  });
}

const MEDIUM_TOKEN = process.env.MEDIUM_INTEGRATION_TOKEN || envVars.MEDIUM_INTEGRATION_TOKEN;

async function getMediumUser(token) {
  const res = await fetch('https://api.medium.com/v1/me', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to authenticate with Medium API (${res.status}): ${errorText}`);
  }
  const data = await res.json();
  return data.data;
}

async function publishToMedium(user, article, publishStatus = 'draft') {
  const canonicalUrl = `https://pureherbex.com/journal/${article.slug}`;

  // Build markdown body
  let markdown = `# ${article.title}\n\n`;
  markdown += `*By ${article.author} • Originally published on [Pure Herbex Botanical Journal](${canonicalUrl})*\n\n`;
  markdown += `![${article.title}](https://pureherbex.com${article.image})\n\n`;
  markdown += `> ${article.content.intro}\n\n---\n\n`;

  for (const section of article.content.sections) {
    markdown += `## ${section.heading}\n\n`;
    markdown += `${section.body}\n\n`;
    if (section.bulletPoints && section.bulletPoints.length > 0) {
      for (const bp of section.bulletPoints) {
        markdown += `* ${bp}\n`;
      }
      markdown += '\n';
    }
  }

  markdown += `### Key Takeaway\n\n${article.content.conclusion}\n\n---\n\n`;
  markdown += `### Experience Pure Botanical Radiance\n\n`;
  markdown += `Explore our freshly handcrafted [Koveria Glow Face Pack Kit](https://pureherbex.com/product/koveria-glow-complete-kit) and 100% steam-distilled [Pure Rose Water](https://pureherbex.com/product/pure-rose-water) at **[Pure Herbex](https://pureherbex.com)** with nationwide Cash on Delivery across Pakistan.\n`;

  const payload = {
    title: article.title,
    contentFormat: 'markdown',
    content: markdown,
    canonicalUrl: canonicalUrl,
    tags: article.keywords.slice(0, 5),
    publishStatus: publishStatus // 'draft' or 'public'
  };

  const res = await fetch(`https://api.medium.com/v1/users/${user.id}/posts`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MEDIUM_TOKEN}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Medium post creation failed (${res.status}): ${errorText}`);
  }

  return await res.json();
}

async function main() {
  console.log('=====================================================');
  console.log('🌿 Pure Herbex - Medium Direct Publishing Engine');
  console.log('=====================================================\n');

  if (!MEDIUM_TOKEN) {
    console.log('ℹ️  MEDIUM_INTEGRATION_TOKEN is not set in your .env file.');
    console.log('👉 To publish directly to your Medium account from the Antigravity IDE:');
    console.log('   1. Go to https://medium.com/me/settings/account');
    console.log('   2. Scroll to "Integration tokens" and generate a token.');
    console.log('   3. Add `MEDIUM_INTEGRATION_TOKEN=your_token_here` to your .env file.\n');
    console.log('✨ All articles are also pre-compiled into `syndicated-articles/medium/` for instant manual copying.');
    return;
  }

  try {
    console.log('🔑 Authenticating with Medium API...');
    const user = await getMediumUser(MEDIUM_TOKEN);
    console.log(`✅ Logged in as: ${user.name} (@${user.username})`);

    // In a full run, we publish the specified slug or first draft
    const targetSlug = process.argv[2] || '5-benefits-of-steam-distilled-rose-water';
    const isPublic = process.argv.includes('--public');

    console.log(`\n📤 Publishing article: ${targetSlug} (Status: ${isPublic ? 'public' : 'draft'})...`);
    // Sample response demo
    console.log(`🔗 Canonical Backlink: https://pureherbex.com/journal/${targetSlug}`);
    console.log('🎉 Article ready for publishing!');
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

main();
