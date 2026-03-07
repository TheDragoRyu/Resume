import fs from 'fs';
import path from 'path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RepoOverrides {
  title?: string;
  slug?: string;
  description?: string;
  tags?: string[];
  links?: { demo?: string; writeup?: string };
}

interface FeaturedRepoConfig {
  repo: string;
  order: number;
  categoryId?: string;
  featured?: boolean;
  overrides?: RepoOverrides;
}

interface FeaturedReposFile {
  defaults: {
    categoryId: string;
    featured: boolean;
  };
  repos: FeaturedRepoConfig[];
}

interface GitHubRepoData {
  name: string;
  full_name: string;
  description: string | null;
  homepage: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  topics: string[];
  language: string | null;
  created_at: string;
  pushed_at: string;
}

interface CachedRepo {
  config: FeaturedRepoConfig;
  github: GitHubRepoData;
  languages: Record<string, number>;
  readme: string;
  fetchedAt: string;
}

interface CacheFile {
  generatedAt: string;
  repos: CachedRepo[];
}

// ---------------------------------------------------------------------------
// .env.local parser (no dotenv dependency)
// ---------------------------------------------------------------------------

function loadEnvLocal(): void {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;

  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    // Strip surrounding quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

// ---------------------------------------------------------------------------
// GitHub API helpers
// ---------------------------------------------------------------------------

const GITHUB_API = 'https://api.github.com';

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'portfolio-sync-script',
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

async function fetchWithRetry(
  url: string,
  headers: Record<string, string>
): Promise<Response> {
  try {
    const res = await fetch(url, { headers });
    return res;
  } catch {
    // Retry once after 2s
    console.warn(`  Network error for ${url}, retrying in 2s...`);
    await new Promise((r) => setTimeout(r, 2000));
    return fetch(url, { headers });
  }
}

function handleRateLimit(res: Response): never {
  const resetHeader = res.headers.get('x-ratelimit-reset');
  const resetTime = resetHeader
    ? new Date(parseInt(resetHeader) * 1000).toLocaleTimeString()
    : 'unknown';
  console.error(
    `\nGitHub API rate limit exceeded. Resets at ${resetTime}.\n` +
      'Set GITHUB_TOKEN in .env.local or environment to increase the limit (5000 req/hr).'
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Config validation
// ---------------------------------------------------------------------------

function validateConfig(config: FeaturedReposFile): void {
  if (!config.defaults?.categoryId) {
    throw new Error('featured-repos.json: defaults.categoryId is required');
  }

  const orders = new Set<number>();
  for (const repo of config.repos) {
    if (!repo.repo || !repo.repo.includes('/')) {
      throw new Error(
        `featured-repos.json: invalid repo format "${repo.repo}" — must be "owner/name"`
      );
    }
    if (typeof repo.order !== 'number') {
      throw new Error(
        `featured-repos.json: "order" is required for repo "${repo.repo}"`
      );
    }
    if (orders.has(repo.order)) {
      throw new Error(
        `featured-repos.json: duplicate order ${repo.order} for repo "${repo.repo}"`
      );
    }
    orders.add(repo.order);
  }
}

// ---------------------------------------------------------------------------
// Repo fetching
// ---------------------------------------------------------------------------

async function fetchRepo(
  config: FeaturedRepoConfig,
  headers: Record<string, string>
): Promise<CachedRepo | null> {
  const { repo } = config;
  console.log(`Fetching ${repo}...`);

  // 1. Repo metadata
  const repoRes = await fetchWithRetry(`${GITHUB_API}/repos/${repo}`, headers);
  if (repoRes.status === 403) handleRateLimit(repoRes);
  if (repoRes.status === 404) {
    console.error(`  Repo not found: ${repo} — skipping`);
    return null;
  }
  if (!repoRes.ok) {
    console.error(`  Unexpected status ${repoRes.status} for ${repo} — skipping`);
    return null;
  }
  const repoData = (await repoRes.json()) as GitHubRepoData;

  // 2. Languages
  const langRes = await fetchWithRetry(
    `${GITHUB_API}/repos/${repo}/languages`,
    headers
  );
  if (langRes.status === 403) handleRateLimit(langRes);
  const languages: Record<string, number> = langRes.ok
    ? ((await langRes.json()) as Record<string, number>)
    : {};

  // 3. README
  const readmeRes = await fetchWithRetry(
    `${GITHUB_API}/repos/${repo}/readme`,
    headers
  );
  if (readmeRes.status === 403) handleRateLimit(readmeRes);
  let readme = '';
  if (readmeRes.ok) {
    const readmeData = (await readmeRes.json()) as { content: string; encoding: string };
    if (readmeData.encoding === 'base64') {
      readme = Buffer.from(readmeData.content, 'base64').toString('utf-8');
    }
  }

  return {
    config,
    github: {
      name: repoData.name,
      full_name: repoData.full_name,
      description: repoData.description,
      homepage: repoData.homepage,
      html_url: repoData.html_url,
      stargazers_count: repoData.stargazers_count,
      forks_count: repoData.forks_count,
      topics: repoData.topics ?? [],
      language: repoData.language,
      created_at: repoData.created_at,
      pushed_at: repoData.pushed_at,
    },
    languages,
    readme,
    fetchedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  loadEnvLocal();

  const configPath = path.join(process.cwd(), 'scripts', 'featured-repos.json');
  if (!fs.existsSync(configPath)) {
    console.error('Missing scripts/featured-repos.json');
    process.exit(1);
  }

  const config: FeaturedReposFile = JSON.parse(
    fs.readFileSync(configPath, 'utf-8')
  );
  validateConfig(config);

  if (config.repos.length === 0) {
    console.log('No repos configured in featured-repos.json. Nothing to fetch.');
    return;
  }

  const headers = getHeaders();
  console.log(
    process.env.GITHUB_TOKEN
      ? 'Using authenticated GitHub API requests.'
      : 'Using unauthenticated GitHub API requests (60 req/hr limit).'
  );

  const cached: CachedRepo[] = [];
  for (const repoConfig of config.repos) {
    try {
      const result = await fetchRepo(repoConfig, headers);
      if (result) cached.push(result);
    } catch (err) {
      console.error(`  Failed to fetch ${repoConfig.repo}: ${err} — skipping`);
    }
  }

  const cachePath = path.join(process.cwd(), '.project-cache.json');
  const cacheFile: CacheFile = {
    generatedAt: new Date().toISOString(),
    repos: cached,
  };
  fs.writeFileSync(cachePath, JSON.stringify(cacheFile, null, 2));

  console.log(
    `\nDone. Cached ${cached.length}/${config.repos.length} repo(s) to .project-cache.json`
  );
}

main().catch((err) => {
  console.error('Sync script failed:', err);
  process.exit(1);
});
