import { MetadataRoute } from 'next';
import { blogPosts } from './blog/data';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://pureherbex.com';

  const blogEntries = blogPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}/`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  const routes = [
    '',
    '/product/',
    '/blog/',
    '/reviews/',
    '/about/',
    '/contact/',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  return [...routes, ...blogEntries];
}
