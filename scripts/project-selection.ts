import fs from 'node:fs';
import path from 'node:path';
import type {
  FeaturedRepoConfig,
  FeaturedReposFile,
} from './project-sync-config';
import { getGitHubHeaders } from './project-sync-config';

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

function projectSlug(repo: FeaturedRepoConfig): string {
  return repo.overrides?.slug ?? toKebabCase(repo.repo.split('/').at(-1) ?? '');
}

export function applyFeaturedFlags(
  previous: FeaturedReposFile,
  next: FeaturedReposFile
): number {
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
  let updatedFiles = 0;

  for (const repositoryName of repositoryNames) {
    const previousRepo = previousByName.get(repositoryName);
    const nextRepo = nextByName.get(repositoryName);
    const repo = nextRepo ?? previousRepo;
    if (!repo) continue;

    const projectPath = path.join(
      process.cwd(),
      'src',
      'data',
      'projects',
      `${projectSlug(repo)}.md`
    );
    if (!fs.existsSync(projectPath)) continue;
    if (fs.lstatSync(projectPath).isSymbolicLink()) {
      throw new Error(`Refusing to edit symbolic link: ${projectPath}`);
    }

    const current = fs.readFileSync(projectPath, 'utf8');
    const updated = updateFeaturedFrontmatter(
      current,
      nextRepo?.featured === true
    );
    if (updated !== current) {
      fs.writeFileSync(projectPath, updated);
      updatedFiles += 1;
    }
  }

  return updatedFiles;
}
