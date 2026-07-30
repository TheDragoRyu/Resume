import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export interface RepoOverrides {
  title?: string;
  slug?: string;
  description?: string;
  tags?: string[];
  links?: { demo?: string; writeup?: string };
}

export interface FeaturedRepoConfig {
  repo: string;
  order: number;
  lock?: boolean;
  context?: string;
  categoryId?: string;
  featured?: boolean;
  overrides?: RepoOverrides;
}

export interface FeaturedReposDefaults {
  categoryId: string;
  featured: boolean;
}

export interface FeaturedReposFile {
  defaults: FeaturedReposDefaults;
  repos: FeaturedRepoConfig[];
}

export const LOCAL_CONFIG_PATH = path.join(
  process.cwd(),
  '.featured-repos.local.json'
);

export const EXAMPLE_CONFIG_PATH = path.join(
  process.cwd(),
  'scripts',
  'featured-repos.example.json'
);

export function validateFeaturedReposConfig(
  config: FeaturedReposFile
): FeaturedReposFile {
  if (!config.defaults?.categoryId) {
    throw new Error(
      '.featured-repos.local.json: defaults.categoryId is required'
    );
  }

  if (!Array.isArray(config.repos)) {
    throw new Error('.featured-repos.local.json: repos must be an array');
  }

  const names = new Set<string>();
  const orders = new Set<number>();

  for (const repo of config.repos) {
    if (!/^[^/\s]+\/[^/\s]+$/.test(repo.repo)) {
      throw new Error(
        `.featured-repos.local.json: invalid repo "${repo.repo}" — expected "owner/name"`
      );
    }

    const normalizedName = repo.repo.toLowerCase();
    if (names.has(normalizedName)) {
      throw new Error(
        `.featured-repos.local.json: duplicate repo "${repo.repo}"`
      );
    }
    names.add(normalizedName);

    if (!Number.isInteger(repo.order) || repo.order < 1) {
      throw new Error(
        `.featured-repos.local.json: repo "${repo.repo}" needs a positive integer order`
      );
    }
    if (orders.has(repo.order)) {
      throw new Error(
        `.featured-repos.local.json: duplicate order ${repo.order}`
      );
    }
    orders.add(repo.order);
  }

  return config;
}

export function loadFeaturedReposConfig(): FeaturedReposFile {
  if (!fs.existsSync(LOCAL_CONFIG_PATH)) {
    throw new Error(
      'No local project selection found. Save GitHub project configuration in the private authoring server first.'
    );
  }

  const config = JSON.parse(
    fs.readFileSync(LOCAL_CONFIG_PATH, 'utf8')
  ) as FeaturedReposFile;

  return validateFeaturedReposConfig(config);
}

export function loadExampleDefaults(): FeaturedReposDefaults {
  const example = JSON.parse(
    fs.readFileSync(EXAMPLE_CONFIG_PATH, 'utf8')
  ) as FeaturedReposFile;

  return validateFeaturedReposConfig(example).defaults;
}

export function writePrivateJsonFile(
  destination: string,
  value: unknown
): void {
  const temporaryPath = `${destination}.${randomUUID()}.tmp`;
  const contents = `${JSON.stringify(value, null, 2)}\n`;

  fs.writeFileSync(temporaryPath, contents, {
    encoding: 'utf8',
    flag: 'wx',
    mode: 0o600,
  });

  try {
    fs.renameSync(temporaryPath, destination);
    fs.chmodSync(destination, 0o600);
  } catch (error) {
    fs.rmSync(temporaryPath, { force: true });
    throw error;
  }
}

export function writeFeaturedReposConfig(config: FeaturedReposFile): void {
  validateFeaturedReposConfig(config);
  writePrivateJsonFile(LOCAL_CONFIG_PATH, config);
}

export function resolveGitHubToken(): string | undefined {
  const environmentToken = process.env.GITHUB_TOKEN?.trim();
  if (environmentToken) {
    return environmentToken;
  }

  try {
    const cliToken = execFileSync('gh', ['auth', 'token'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();

    return cliToken || undefined;
  } catch {
    return undefined;
  }
}

export function requireGitHubToken(): string {
  const token = resolveGitHubToken();
  if (!token) {
    throw new Error(
      'GitHub authentication is required. Run `gh auth login` (recommended), ' +
        'or export GITHUB_TOKEN in your shell, then retry.'
    );
  }

  return token;
}

export function getGitHubHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'portfolio-project-selector',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}
