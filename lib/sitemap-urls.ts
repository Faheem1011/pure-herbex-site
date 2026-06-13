import { blogPosts } from "@/app/blog/data";
import { deliveryAreas } from "@/lib/delivery-areas";
import { deliveryCities, PROVINCES } from "@/lib/delivery-locations";
import { ingredients } from "@/lib/ingredients-data";
import { urduBlogPosts } from "@/lib/urdu-blog-data";
import { SITE_URL } from "@/lib/search-config";

/** All public URLs for sitemap + IndexNow pings. */
export function getAllPublicUrls(): string[] {
  const staticPaths = [
    "/",
    "/product/",
    "/ingredients/",
    "/blog/",
    "/delivery/",
    "/ur/delivery/",
    "/ur/blog/",
    "/faq/",
    "/reviews/",
    "/about/",
    "/contact/",
    "/privacy/",
  ];

  const urls = new Set<string>(staticPaths.map((p) => `${SITE_URL}${p}`));

  for (const post of blogPosts) {
    urls.add(`${SITE_URL}/blog/${post.slug}/`);
  }
  for (const ing of ingredients) {
    urls.add(`${SITE_URL}/ingredients/${ing.slug}/`);
  }
  for (const city of deliveryCities) {
    urls.add(`${SITE_URL}/delivery/${city.slug}/`);
    urls.add(`${SITE_URL}/ur/delivery/${city.slug}/`);
  }
  for (const p of PROVINCES) {
    urls.add(`${SITE_URL}/delivery/province/${p.slug}/`);
  }
  for (const area of deliveryAreas) {
    urls.add(`${SITE_URL}/delivery/area/${area.slug}/`);
  }
  for (const post of urduBlogPosts) {
    urls.add(`${SITE_URL}/ur/blog/${post.slug}/`);
  }

  return [...urls];
}
