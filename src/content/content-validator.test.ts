import { afterEach, describe, expect, it, vi } from 'vitest';
import type {
  CategoryFrontmatter,
  ContentItem,
  ProjectFrontmatter,
} from './content-types';
import { validateContent } from './content-validator';

function category(rawContent = ''): ContentItem<CategoryFrontmatter> {
  return {
    frontmatter: {
      id: 'cat-experience',
      slug: 'experience',
      title: 'Experience',
      type: 'category',
      order: 1,
    },
    body: '',
    rawContent,
  };
}

function project(rawContent = ''): ContentItem<ProjectFrontmatter> {
  return {
    frontmatter: {
      id: 'proj-example',
      slug: 'example',
      title: 'Example',
      type: 'project',
      order: 1,
      categoryId: 'cat-experience',
    },
    body: '',
    rawContent,
  };
}

afterEach(() => vi.unstubAllEnvs());

describe('Markdown reference validation', () => {
  it('accepts known routes, Resume anchors, external URLs, and existing media', () => {
    const content = project(
      [
        '[Resume](/resume#experience)',
        '[Project](/projects/example?from=resume)',
        '[External](https://example.com)',
        '![Preview](/images/pasted-image-20260728020630.png)',
      ].join('\n\n')
    );

    expect(validateContent([category(), content])).toEqual([]);
  });

  it.each([
    ['/projects/missing', 'unknown internal route'],
    ['/resume#missing', 'unknown Resume section'],
    ['../projects/example', 'root-relative'],
    ['javascript:alert(1)', 'unsupported URL scheme'],
  ])('rejects invalid Markdown link %s', (link, message) => {
    const errors = validateContent([
      category(),
      project(`[Broken](${link})`),
    ]);
    expect(errors.some((error) => error.message.includes(message))).toBe(true);
  });

  it('rejects missing inline local media', () => {
    const errors = validateContent([
      category(),
      project('![Missing](/images/not-here.png)'),
    ]);
    expect(
      errors.some((error) => error.message.includes('missing file'))
    ).toBe(true);
  });

  it('rejects source links that embed the configured deployment base path', () => {
    vi.stubEnv('NEXT_PUBLIC_BASE_PATH', '/Resume');
    const errors = validateContent([
      category(),
      project('[Project](/Resume/projects/example)'),
    ]);
    expect(
      errors.some((error) => error.message.includes('deployment base path'))
    ).toBe(true);
  });
});
