import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Google Search Console Indexing API Batch Submission Script
 * 
 * Instructions:
 * 1. Place your Google Cloud Service Account Key file as 'google_service_account.json' in this directory.
 * 2. Ensure your Service Account email (e.g., xxx@project-id.iam.gserviceaccount.com) is added as an OWNER in Google Search Console for https://pureherbex.com
 * 3. Run: node scripts/submit_google_indexing.js
 */

const KEY_PATH = path.join(__dirname, 'google_service_account.json');
const SITEMAP_PATH = path.join(__dirname, '..', 'public', 'sitemap.xml');
const SITE_URL = 'https://pureherbex.com';

function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

async function getAccessToken(keyData) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: keyData.client_email,
    scope: 'https://www.googleapis.com/auth/indexing',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signInput = `${encodedHeader}.${encodedPayload}`;

  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signInput);
  const signature = signer.sign(keyData.private_key, 'base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const jwt = `${signInput}.${signature}`;

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  });

  const tokenData = await response.json();
  if (!tokenData.access_token) {
    throw new Error(`Token generation failed: ${JSON.stringify(tokenData)}`);
  }
  return tokenData.access_token;
}

function parseSitemapUrls() {
  if (!fs.existsSync(SITEMAP_PATH)) {
    console.error('❌ Sitemap file not found at:', SITEMAP_PATH);
    process.exit(1);
  }
  const content = fs.readFileSync(SITEMAP_PATH, 'utf-8');
  const matches = content.match(/<loc>(.*?)<\/loc>/g) || [];
  return matches.map(m => m.replace(/<\/?loc>/g, '').trim());
}

async function requestIndexing(url, accessToken) {
  const endpoint = 'https://indexing.googleapis.com/v3/urlNotifications:publish';
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      url: url,
      type: 'URL_UPDATED'
    })
  });

  const resData = await response.json();
  if (response.ok) {
    console.log(`✅ Indexed Successfully: ${url}`);
  } else {
    console.error(`❌ Indexing Failed for ${url}:`, resData.error ? resData.error.message : resData);
  }
}

async function main() {
  console.log('🚀 Starting Google Search Console Indexing API Submission...\n');

  if (!fs.existsSync(KEY_PATH)) {
    console.log('⚠️ Service account key not found at:', KEY_PATH);
    console.log('\nPlease follow these steps to generate your key:');
    console.log('1. Go to Google Cloud Console (https://console.cloud.google.com/)');
    console.log('2. Create a Service Account and enable the "Indexing API"');
    console.log('3. Keys -> Add Key -> Create new key (JSON)');
    console.log(`4. Save the downloaded JSON file as: ${KEY_PATH}`);
    console.log('5. Add the Service Account email as OWNER in Google Search Console\n');
    return;
  }

  const keyData = JSON.parse(fs.readFileSync(KEY_PATH, 'utf-8'));
  console.log(`🔑 Service Account loaded: ${keyData.client_email}`);

  try {
    const accessToken = await getAccessToken(keyData);
    console.log('🔓 OAuth2 Access Token generated successfully.');

    const urls = parseSitemapUrls();
    console.log(`\n📄 Found ${urls.length} URLs in sitemap to submit:\n`);

    for (const url of urls) {
      await requestIndexing(url, accessToken);
      // Brief pause to respect rate limits
      await new Promise(r => setTimeout(r, 200));
    }

    console.log('\n🎉 All Sitemap URLs submitted to Google Indexing API successfully!');
  } catch (err) {
    console.error('❌ Error during execution:', err.message);
  }
}

main();
