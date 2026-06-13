import { INDEXNOW_KEY, INDEXNOW_KEY_URL, SITE_URL } from "@/lib/search-config";
import { getAllPublicUrls } from "@/lib/sitemap-urls";

const ENDPOINTS = [
  "https://api.indexnow.org/indexnow",
  "https://www.bing.com/indexnow",
];

export async function pingIndexNow(urls: string[]): Promise<{ ok: number; failed: number }> {
  if (!urls.length) return { ok: 0, failed: 0 };

  const body = {
    host: new URL(SITE_URL).host,
    key: INDEXNOW_KEY,
    keyLocation: INDEXNOW_KEY_URL,
    urlList: urls,
  };

  const results = await Promise.all(
    ENDPOINTS.map(async (endpoint) => {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(body),
      });
      return { endpoint, status: res.status };
    })
  );

  const ok = results.filter((r) => r.status >= 200 && r.status < 300).length;
  return { ok, failed: results.length - ok };
}

export async function pingAllSiteUrls(batchSize = 100): Promise<void> {
  const urls = getAllPublicUrls();
  console.log(`Pinging IndexNow for ${urls.length} URLs (${ENDPOINTS.length} endpoints)...`);

  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    const { ok, failed } = await pingIndexNow(batch);
    console.log(`Batch ${Math.floor(i / batchSize) + 1}: ${batch.length} URLs → ${ok}/${ENDPOINTS.length} endpoints OK`);
    if (failed) console.warn(`  ${failed} endpoint(s) returned non-2xx`);
  }

  console.log("Done. Check Bing Webmaster Tools → URL Inspection in 24–48h.");
}
