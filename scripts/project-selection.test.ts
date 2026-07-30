import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  applyFeaturedFlags,
  assertPublicRepositorySelection,
  commitFeaturedFlagUpdates,
  planFeaturedFlagUpdates,
  saveProjectConfiguration,
  updateFeaturedFrontmatter,
  type GitHubRepositorySummary,
} from './project-selection';
import { localConfigPath } from './project-sync-config';
import { projectsDirectory } from './project-paths';

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

// ---------------------------------------------------------------------------
// Containment regression tests for the featured-update sink.
//
// A crafted `overrides.slug` previously escaped src/data/projects here and
// overwrote an unintended Markdown file. Each test asserts on the destination,
// not only on the validator.
// ---------------------------------------------------------------------------

function projectMarkdown(slug: string, featured: boolean): string {
  return `---
id: proj-${slug}
slug: ${slug}
title: ${slug}
type: project
order: 1
featured: ${featured}
---

Body.
`;
}

// Deliberately valid project Markdown: without containment the featured update
// would parse it and rewrite it, so an unchanged file proves the write was
// prevented rather than merely erroring on an unparseable target.
const OUTSIDE_CONTENTS = projectMarkdown('outside-marker', false);

describe('featured update containment', () => {
  const originalCwd = process.cwd();
  let fixture: string;
  let outsideFile: string;

  beforeEach(() => {
    fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'project-selection-test-'));
    fs.mkdirSync(path.join(fixture, 'src', 'data', 'projects'), {
      recursive: true,
    });
    fs.writeFileSync(
      path.join(fixture, 'src', 'data', 'projects', 'example.md'),
      projectMarkdown('example', false)
    );
    outsideFile = path.join(fixture, 'AGENTS.md');
    fs.writeFileSync(outsideFile, OUTSIDE_CONTENTS);
    process.chdir(fixture);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    fs.rmSync(fixture, { recursive: true, force: true });
  });

  it('writes only inside the projects directory for a valid slug', () => {
    const previous = { defaults, repos: [{ repo: 'owner/example', order: 1 }] };
    const next = {
      defaults,
      repos: [{ repo: 'owner/example', order: 1, featured: true }],
    };

    const updates = planFeaturedFlagUpdates(previous, next);
    expect(updates).toHaveLength(1);
    expect(path.dirname(updates[0].filePath)).toBe(projectsDirectory());

    expect(applyFeaturedFlags(previous, next)).toBe(1);
    expect(
      fs.readFileSync(
        path.join(fixture, 'src', 'data', 'projects', 'example.md'),
        'utf8'
      )
    ).toContain('featured: true');
    expect(fs.readFileSync(outsideFile, 'utf8')).toBe(OUTSIDE_CONTENTS);
  });

  it.each([
    '../../../AGENTS',
    '../../AGENTS',
    'nested/AGENTS',
    '/tmp/AGENTS',
    '..%2f..%2fAGENTS',
  ])('refuses to leave the projects directory via slug %s', (slug) => {
    const next = {
      defaults,
      repos: [
        {
          repo: 'owner/example',
          order: 1,
          featured: true,
          overrides: { slug },
        },
      ],
    };

    expect(() => planFeaturedFlagUpdates({ defaults, repos: [] }, next)).toThrow();
    expect(() => applyFeaturedFlags({ defaults, repos: [] }, next)).toThrow();
    expect(fs.readFileSync(outsideFile, 'utf8')).toBe(OUTSIDE_CONTENTS);
  });

  it('refuses a symbolic link that points outside the projects directory', () => {
    const link = path.join(fixture, 'src', 'data', 'projects', 'linked.md');
    fs.symlinkSync(outsideFile, link);

    const next = {
      defaults,
      repos: [{ repo: 'owner/linked', order: 1, featured: true }],
    };

    expect(() => planFeaturedFlagUpdates({ defaults, repos: [] }, next)).toThrow(
      'symbolic link'
    );
    expect(fs.readFileSync(outsideFile, 'utf8')).toBe(OUTSIDE_CONTENTS);
  });

  it('restores every earlier file when a later write fails', () => {
    const projects = path.join(fixture, 'src', 'data', 'projects');
    fs.writeFileSync(path.join(projects, 'second.md'), projectMarkdown('second', false));

    const first = path.join(projects, 'example.md');
    const second = path.join(projects, 'second.md');
    const firstOriginal = fs.readFileSync(first, 'utf8');

    // The second update targets a directory, so its write fails after the
    // first one has already been committed.
    const updates = [
      {
        filePath: first,
        previousContents: firstOriginal,
        nextContents: firstOriginal.replace('featured: false', 'featured: true'),
      },
      {
        filePath: path.join(projects, 'blocked.md'),
        previousContents: 'previous',
        nextContents: 'next',
      },
    ];
    fs.mkdirSync(updates[1].filePath);

    expect(() => commitFeaturedFlagUpdates(updates)).toThrow('rolled back');
    expect(fs.readFileSync(first, 'utf8')).toBe(firstOriginal);
    expect(fs.readFileSync(second, 'utf8')).toContain('featured: false');
  });

  // The slug here is valid, so the configuration validator accepts it. Only
  // planning every destination before persisting configuration catches the
  // unsafe target, which is what keeps configuration and content in agreement.
  it('does not persist configuration when a target file is unsafe', () => {
    fs.symlinkSync(
      outsideFile,
      path.join(fixture, 'src', 'data', 'projects', 'linked.md')
    );
    const next = {
      defaults,
      repos: [{ repo: 'owner/linked', order: 1, featured: true }],
    };

    expect(() => saveProjectConfiguration({ defaults, repos: [] }, next)).toThrow(
      'symbolic link'
    );
    expect(fs.existsSync(localConfigPath())).toBe(false);
    expect(fs.readFileSync(outsideFile, 'utf8')).toBe(OUTSIDE_CONTENTS);
  });

  it('does not persist configuration when an override slug is unsafe', () => {
    const next = {
      defaults,
      repos: [
        {
          repo: 'owner/example',
          order: 1,
          featured: true,
          overrides: { slug: '../../../AGENTS' },
        },
      ],
    };

    expect(() => saveProjectConfiguration({ defaults, repos: [] }, next)).toThrow();
    expect(fs.existsSync(localConfigPath())).toBe(false);
    expect(fs.readFileSync(outsideFile, 'utf8')).toBe(OUTSIDE_CONTENTS);
  });
});
