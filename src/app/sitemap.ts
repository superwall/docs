import { source } from '@/lib/source';
import { MetadataRoute } from 'next';

const baseUrl = 'https://superwall.com/docs';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Get all documentation pages from the source
  const pages = source.getPages();
  
  // Create sitemap entries for all documentation pages
  const docPages: MetadataRoute.Sitemap = pages.map((page) => ({
    url: `${baseUrl}${page.url}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // Add high-priority static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/home`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
  ];

  // Add section landing pages with higher priority
  const sectionPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/dashboard`, priority: 0.9 },
    { url: `${baseUrl}/web-checkout`, priority: 0.9 },
    { url: `${baseUrl}/integrations`, priority: 0.9 },
    { url: `${baseUrl}/ios`, priority: 0.9 },
    { url: `${baseUrl}/android`, priority: 0.9 },
    { url: `${baseUrl}/flutter`, priority: 0.9 },
    { url: `${baseUrl}/expo`, priority: 0.9 },
  ].map(page => ({
    ...page,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
  }));

  // Combine all pages and sort by priority
  const allPages = [...staticPages, ...sectionPages, ...docPages];
  
  // Remove duplicates based on URL
  const uniquePages = Array.from(
    new Map(allPages.map(page => [page.url, page])).values()
  );

  // Sort by priority (highest first), then by URL
  return uniquePages.sort((a, b) => {
    if (a.priority !== b.priority) {
      return (b.priority || 0.5) - (a.priority || 0.5);
    }
    return a.url.localeCompare(b.url);
  });
}