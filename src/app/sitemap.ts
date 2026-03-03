import type { MetadataRoute } from 'next';
import { getProjects } from '@/content/content-loader';

export const dynamic = 'force-static';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projects = await getProjects();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}${BASE_PATH}/`, changeFrequency: 'monthly', priority: 1 },
    { url: `${BASE_URL}${BASE_PATH}/resume/`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}${BASE_PATH}/projects/`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}${BASE_PATH}/contact/`, changeFrequency: 'yearly', priority: 0.5 },
  ];

  const projectRoutes: MetadataRoute.Sitemap = projects.map((p) => ({
    url: `${BASE_URL}${BASE_PATH}/projects/${p.frontmatter.slug}/`,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [...staticRoutes, ...projectRoutes];
}
