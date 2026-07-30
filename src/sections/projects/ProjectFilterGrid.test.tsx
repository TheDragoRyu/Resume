import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { ContentItem, ProjectFrontmatter } from '@/content/content-types';
import ProjectFilterGrid from './ProjectFilterGrid';

function makeProject(
  slug: string,
  tags: string[],
  featured = false
): ContentItem<ProjectFrontmatter> {
  return {
    frontmatter: {
      id: `proj-${slug}`,
      slug,
      title: slug === 'alpha' ? 'Alpha' : 'Beta',
      description: `${slug} project`,
      type: 'project',
      order: featured ? 2 : 1,
      categoryId: 'cat-experience',
      tags,
      featured,
    },
    body: '',
    rawContent: '',
  };
}

describe('ProjectFilterGrid', () => {
  it('sorts featured projects first and filters by any selected tag', async () => {
    const user = userEvent.setup();
    render(
      <ProjectFilterGrid
        projects={[
          makeProject('alpha', ['React']),
          makeProject('beta', ['Go'], true),
        ]}
        allTags={['Go', 'React']}
      />
    );

    const headings = screen.getAllByRole('heading', { level: 2 });
    expect(headings.map((heading) => heading.textContent)).toEqual([
      'Beta',
      'Alpha',
    ]);

    await user.click(screen.getByRole('button', { name: 'React' }));
    expect(screen.getByRole('heading', { name: 'Alpha' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Beta' })).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Go' }));
    expect(screen.getByRole('heading', { name: 'Beta' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear all' }));
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(2);
  });
});
