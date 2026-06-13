import { blogPosts, type BlogPost } from "@/app/blog/data";

export function getRelatedPosts(post: BlogPost, limit = 3): BlogPost[] {
  const explicit = (post.relatedSlugs || [])
    .map((slug) => blogPosts.find((p) => p.slug === slug))
    .filter((p): p is BlogPost => !!p);

  if (explicit.length >= limit) {
    return explicit.slice(0, limit);
  }

  const scored = blogPosts
    .filter((p) => p.slug !== post.slug)
    .map((candidate) => {
      let score = 0;
      if (candidate.category === post.category) score += 3;
      const keywordOverlap = post.seoKeywords.filter((k) =>
        candidate.seoKeywords.some(
          (ck) =>
            ck.toLowerCase().includes(k.toLowerCase()) ||
            k.toLowerCase().includes(ck.toLowerCase())
        )
      ).length;
      score += keywordOverlap;
      return { candidate, score };
    })
    .sort((a, b) => b.score - a.score);

  const merged = [...explicit];
  for (const { candidate } of scored) {
    if (merged.length >= limit) break;
    if (!merged.some((p) => p.slug === candidate.slug)) {
      merged.push(candidate);
    }
  }
  return merged.slice(0, limit);
}

export function getPostShareUrls(slug: string, title: string) {
  const url = `https://pureherbex.com/blog/${slug}/`;
  const text = encodeURIComponent(title);
  const encodedUrl = encodeURIComponent(url);
  return {
    url,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?text=${text}&url=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
  };
}
