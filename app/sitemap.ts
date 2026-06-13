import type { MetadataRoute } from "next";
import { blogPosts } from "@/app/blog/data";
import { deliveryCities } from "@/lib/delivery-locations";
import { deliveryAreas } from "@/lib/delivery-areas";
import { PROVINCES } from "@/lib/delivery-locations";
import { ingredients } from "@/lib/ingredients-data";
import { SITE_URL } from "@/lib/search-config";

export const dynamic = "force-static";

const SITE = SITE_URL;

function parsePostDate(dateStr: string): Date {
  const parsed = new Date(dateStr);
  return Number.isNaN(parsed.getTime()) ? new Date("2026-05-15") : parsed;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE}/product/`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE}/ingredients/`, changeFrequency: "weekly", priority: 0.88 },
    { url: `${SITE}/blog/`, changeFrequency: "weekly", priority: 0.85 },
    { url: `${SITE}/delivery/`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE}/ur/delivery/`, changeFrequency: "weekly", priority: 0.85 },
    { url: `${SITE}/reviews/`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE}/about/`, changeFrequency: "monthly", priority: 0.75 },
    { url: `${SITE}/contact/`, changeFrequency: "monthly", priority: 0.75 },
    { url: `${SITE}/privacy/`, changeFrequency: "yearly", priority: 0.3 },
  ];

  const blogPages: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${SITE}/blog/${post.slug}/`,
    lastModified: parsePostDate(post.date),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const ingredientPages: MetadataRoute.Sitemap = ingredients.map((ing) => ({
    url: `${SITE}/ingredients/${ing.slug}/`,
    changeFrequency: "monthly",
    priority: 0.72,
  }));

  const deliveryPages: MetadataRoute.Sitemap = deliveryCities.map((city) => ({
    url: `${SITE}/delivery/${city.slug}/`,
    changeFrequency: "monthly",
    priority: city.tier === 1 ? 0.75 : city.tier === 2 ? 0.7 : 0.65,
    alternates: {
      languages: {
        en: `${SITE}/delivery/${city.slug}/`,
        ur: `${SITE}/ur/delivery/${city.slug}/`,
      },
    },
  }));

  const urduDeliveryPages: MetadataRoute.Sitemap = deliveryCities.map((city) => ({
    url: `${SITE}/ur/delivery/${city.slug}/`,
    changeFrequency: "monthly",
    priority: city.tier === 1 ? 0.7 : 0.65,
    alternates: {
      languages: {
        en: `${SITE}/delivery/${city.slug}/`,
        ur: `${SITE}/ur/delivery/${city.slug}/`,
      },
    },
  }));

  const provincePages: MetadataRoute.Sitemap = PROVINCES.map((p) => ({
    url: `${SITE}/delivery/province/${p.slug}/`,
    changeFrequency: "monthly",
    priority: 0.78,
  }));

  const areaPages: MetadataRoute.Sitemap = deliveryAreas.map((a) => ({
    url: `${SITE}/delivery/area/${a.slug}/`,
    changeFrequency: "monthly",
    priority: 0.68,
  }));

  return [
    ...staticPages,
    ...blogPages,
    ...ingredientPages,
    ...deliveryPages,
    ...urduDeliveryPages,
    ...provincePages,
    ...areaPages,
  ];
}
