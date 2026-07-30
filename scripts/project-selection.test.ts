import { describe, expect, it } from 'vitest';
import {
  assertPublicRepositorySelection,
  updateFeaturedFrontmatter,
  type GitHubRepositorySummary,
} from './project-selection';

const repositories: GitHubRepositorySummary[] = [
  {
    full_name: 'owner/public-project',
    private: false,
    visibility: 'public',
    archived: false,
    fork: false,
    description: null,
    html_url: 'https://github.com/owner/public-project',
    updated_at: '2026-07-01T00:00:00Z',
  },
  {
    full_name: 'owner/private-project',
    private: true,
    visibility: 'private',
    archived: false,
    fork: false,
    description: null,
    html_url: 'https://github.com/owner/private-project',
    updated_at: '2026-07-02T00:00:00Z',
  },
];

const defaults = {
  categoryId: 'cat-experience',
  featured: false,
};

describe('repository publication guard', () => {
  it('allows an available public repository', () => {
    expect(() =>
      assertPublicRepositorySelection(
        {
          defaults,
          repos: [{ repo: 'owner/public-project', order: 1 }],
        },
        repositories
      )
    ).not.toThrow();
  });

  it('refuses a private repository even for an authenticated user', () => {
    expect(() =>
      assertPublicRepositorySelection(
        {
          defaults,
          repos: [{ repo: 'owner/private-project', order: 1 }],
        },
        repositories
      )
    ).toThrow('Private repositories cannot be published');
  });

  it('refuses a repository outside the authenticated inventory', () => {
    expect(() =>
      assertPublicRepositorySelection(
        {
          defaults,
          repos: [{ repo: 'owner/missing', order: 1 }],
        },
        repositories
      )
    ).toThrow('is not available');
  });
});

describe('featured frontmatter updates', () => {
  it('updates only the featured field', () => {
    const markdown = `---
id: proj-example
slug: example
title: Example
type: project
order: 1
featured: false
---

Body.
`;
    expect(updateFeaturedFrontmatter(markdown, true)).toBe(
      markdown.replace('featured: false', 'featured: true')
    );
  });
});
