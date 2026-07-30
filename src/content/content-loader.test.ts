import { describe, expect, it } from 'vitest';
import { renderMarkdown } from './content-loader';

describe('Markdown rendering', () => {
  it('rewrites internal links and images for a repository base path', async () => {
    const html = await renderMarkdown(
      [
        '[Project](/projects/portfolio-site?view=full#results)',
        '![Preview](/images/pasted-image-20260728020630.png)',
        '[External](https://example.com)',
        '[Email](mailto:hello@example.com)',
      ].join('\n\n'),
      '/Resume'
    );

    expect(html).toContain(
      'href="/Resume/projects/portfolio-site?view=full#results"'
    );
    expect(html).toContain(
      'src="/Resume/images/pasted-image-20260728020630.png"'
    );
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('href="mailto:hello@example.com"');
  });

  it('keeps local development paths unchanged', async () => {
    const html = await renderMarkdown('[Resume](/resume#experience)', '');
    expect(html).toContain('href="/resume#experience"');
  });
});
