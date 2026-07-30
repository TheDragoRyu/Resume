import fs from 'node:fs';
import type {
  FeaturedRepoConfig,
  FeaturedReposFile,
} from './project-sync-config';
import {
  getGitHubHeaders,
  localConfigPath,
  writeFeaturedReposConfig,
} from './project-sync-config';
import {
  assertProjectSlug,
  assertSafeProjectFile,
  readProjectFile,
  resolveProjectFilePath,
  writeProjectFile,
} from './project-paths';

const GITHUB_API = 'https://api.github.com';
const MAX_PAGES = 100;

export interface GitHubRepositorySummary {
  full_name: string;
  private: boolean;
  visibility: 'public' | 'private' | 'internal';
  archived: boolean;
  fork: boolean;
  description: string | null;
  html_url: string;
  updated_at: string;
}

function nextPageFromLinkHeader(linkHeader: string | null): string | undefined {
  if (!linkHeader) return undefined;

  for (const link of linkHeader.split(',')) {
    const match = link.match(/<([^>]+)>;\s*rel="([^"]+)"/);
    if (match?.[2] === 'next') {
      const nextUrl = new URL(match[1]);
      if (nextUrl.origin !== GITHUB_API) {
        throw new Error('GitHub returned an unexpected pagination URL.');
      }
      return nextUrl.toString();
    }
  }

  return undefined;
}

export async function fetchAvailableRepositories(
  token: string
): Promise<GitHubRepositorySummary[]> {
  const headers = getGitHubHeaders(token);
  let nextUrl: string | undefined =
    `${GITHUB_API}/user/repos?affiliation=owner,collaborator,organization_member` +
    '&sort=updated&direction=desc&per_page=100';
  const repositories: GitHubRepositorySummary[] = [];

  for (let page = 1; nextUrl && page <= MAX_PAGES; page += 1) {
    const response = await fetch(nextUrl, { headers });
    if (response.status === 401) {
      throw new Error('GitHub rejected the configured credential.');
    }
    if (!response.ok) {
      throw new Error(
        `GitHub repository lookup failed with status ${response.status}.`
      );
    }

    const pageRepositories =
      (await response.json()) as GitHubRepositorySummary[];
    if (!Array.isArray(pageRepositories)) {
      throw new Error('GitHub returned an unexpected repository response.');
    }

    repositories.push(...pageRepositories);
    nextUrl = nextPageFromLinkHeader(response.headers.get('link'));
  }

  if (nextUrl) {
    throw new Error('Repository lookup exceeded the safe pagination limit.');
  }

  return repositories;
}

export function assertPublicRepositorySelection(
  config: FeaturedReposFile,
  repositories: GitHubRepositorySummary[]
): void {
  const available = new Map(
    repositories.map((repository) => [
      repository.full_name.toLowerCase(),
      repository,
    ])
  );

  for (const selected of config.repos) {
    const repository = available.get(selected.repo.toLowerCase());
    if (!repository) {
      throw new Error(`Repository "${selected.repo}" is not available.`);
    }
    if (repository.private || repository.visibility !== 'public') {
      throw new Error('Private repositories cannot be published or featured.');
    }
  }
}

export function updateFeaturedFrontmatter(
  markdown: string,
  featured: boolean
): string {
  if (!markdown.startsWith('---\n')) {
    throw new Error('Project Markdown is missing opening frontmatter.');
  }

  const closingIndex = markdown.indexOf('\n---', 4);
  if (closingIndex === -1) {
    throw new Error('Project Markdown is missing closing frontmatter.');
  }

  const frontmatter = markdown.slice(4, closingIndex);
  const featuredLine = /^featured:\s*(?:true|false)\s*$/m;
  const updatedFrontmatter = featuredLine.test(frontmatter)
    ? frontmatter.replace(featuredLine, `featured: ${featured}`)
    : `${frontmatter}\nfeatured: ${featured}`;

  return `---\n${updatedFrontmatter}${markdown.slice(closingIndex)}`;
}

function toKebabCase(value: string): string {
  return value
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .replace(/^-+|-+$/g, '');
}

export function projectSlug(repo: FeaturedRepoConfig): string {
  const label = `Project slug for "${repo.repo}"`;
  if (repo.overrides?.slug !== undefined) {
    return assertProjectSlug(repo.overrides.slug, label);
  }
  return assertProjectSlug(
    toKebabCase(repo.repo.split('/').at(-1) ?? ''),
    label
  );
}

export interface FeaturedFlagUpdate {
  filePath: string;
  previousContents: string;
  nextContents: string;
}

/**
 * Resolves and validates every target path, and computes every new file body,
 * without writing anything. Callers must plan before they persist configuration
 * so an invalid slug or an unsafe destination cannot leave partial state.
 */
export function planFeaturedFlagUpdates(
  previous: FeaturedReposFile,
  next: FeaturedReposFile
): FeaturedFlagUpdate[] {
  const previousByName = new Map(
    previous.repos.map((repo) => [repo.repo.toLowerCase(), repo])
  );
  const nextByName = new Map(
    next.repos.map((repo) => [repo.repo.toLowerCase(), repo])
  );
  const repositoryNames = new Set([
    ...previousByName.keys(),
    ...nextByName.keys(),
  ]);
  const updates: FeaturedFlagUpdate[] = [];

  for (const repositoryName of repositoryNames) {
    const previousRepo = previousByName.get(repositoryName);
    const nextRepo = nextByName.get(repositoryName);
    const repo = nextRepo ?? previousRepo;
    if (!repo) continue;

    const projectPath = resolveProjectFilePath(
      projectSlug(repo),
      `Project slug for "${repo.repo}"`
    );
    if (assertSafeProjectFile(projectPath) === 'missing') continue;

    const current = readProjectFile(projectPath);
    const updated = updateFeaturedFrontmatter(
      current,
      nextRepo?.featured === true
    );
    if (updated !== current) {
      updates.push({
        filePath: projectPath,
        previousContents: current,
        nextContents: updated,
      });
    }
  }

  return updates;
}

/** Applies a plan, restoring every already-written file if one write fails. */
export function commitFeaturedFlagUpdates(
  updates: FeaturedFlagUpdate[]
): number {
  const applied: FeaturedFlagUpdate[] = [];

  try {
    for (const update of updates) {
      writeProjectFile(update.filePath, update.nextContents);
      applied.push(update);
    }
  } catch (error) {
    const rollbackFailures: string[] = [];
    for (const update of [...applied].reverse()) {
      try {
        writeProjectFile(update.filePath, update.previousContents);
      } catch (rollbackError) {
        rollbackFailures.push(
          `${update.filePath}: ${
            rollbackError instanceof Error
              ? rollbackError.message
              : String(rollbackError)
          }`
        );
      }
    }

    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(
      rollbackFailures.length > 0
        ? `Featured update failed (${reason}) and rollback failed for ${rollbackFailures.join('; ')}`
        : `Featured update failed and was rolled back: ${reason}`
    );
  }

  return applied.length;
}

export function applyFeaturedFlags(
  previous: FeaturedReposFile,
  next: FeaturedReposFile
): number {
  return commitFeaturedFlagUpdates(planFeaturedFlagUpdates(previous, next));
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Puts `.featured-repos.local.json` back the way it was found. A first save has
 * no previous file, so the rollback removes the one this save created rather
 * than leaving a selection nothing on disk agrees with.
 */
function restoreProjectConfiguration(
  previous: FeaturedReposFile,
  hadPreviousConfig: boolean
): void {
  if (hadPreviousConfig) {
    writeFeaturedReposConfig(previous);
    return;
  }
  fs.rmSync(localConfigPath(), { force: true });
}

/**
 * Persists a project selection. The complete plan is computed first so a bad
 * slug, an unsafe destination, or an unreadable project file rejects the whole
 * save before `.featured-repos.local.json` is rewritten. If a Markdown write
 * still fails, the rolled-back content is matched by a rolled-back
 * configuration, so the save is all-or-nothing.
 */
export function saveProjectConfiguration(
  previous: FeaturedReposFile,
  next: FeaturedReposFile
): number {
  const updates = planFeaturedFlagUpdates(previous, next);
  const hadPreviousConfig = fs.existsSync(localConfigPath());

  writeFeaturedReposConfig(next);

  try {
    return commitFeaturedFlagUpdates(updates);
  } catch (error) {
    try {
      restoreProjectConfiguration(previous, hadPreviousConfig);
    } catch (restoreError) {
      throw new Error(
        `${describeError(error)} — restoring the previous project selection also failed: ${describeError(restoreError)}`
      );
    }
    throw error;
  }
}
