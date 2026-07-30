import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('static route generation', () => {
  it('generates every project route and project metadata', async () => {
    const projectRoute = await import('./projects/[slug]/page');
    const params = await projectRoute.generateStaticParams();

    expect(params).not.toHaveLength(0);

    const metadata = await projectRoute.generateMetadata({
      params: Promise.resolve(params[0]),
    });
    expect(metadata.title).toBeTruthy();
    expect(metadata.openGraph).toBeTruthy();
  });

  it('generates production sitemap and robots URLs under the base path', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://example.com');
    vi.stubEnv('NEXT_PUBLIC_BASE_PATH', '/Resume');

    const [{ default: sitemap }, { default: robots }] = await Promise.all([
      import('./sitemap'),
      import('./robots'),
    ]);

    const entries = await sitemap();
    expect(entries[0].url).toBe('https://example.com/Resume/');
    expect(
      entries.some((entry) =>
        entry.url.startsWith('https://example.com/Resume/projects/')
      )
    ).toBe(true);
    expect(robots().sitemap).toBe(
      'https://example.com/Resume/sitemap.xml'
    );
  });
});
