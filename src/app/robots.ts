import type { MetadataRoute } from 'next';
import { buildSiteUrl } from '@/utils/site-url';

export const dynamic = 'force-static';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: buildSiteUrl(BASE_URL, BASE_PATH, '/sitemap.xml'),
  };
}
