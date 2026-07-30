import path from 'node:path';
import {
  type FeaturedRepoConfig,
  type FeaturedReposDefaults,
  getGitHubHeaders,
  loadFeaturedReposConfig,
  resolveGitHubToken,
  writePrivateJsonFile,
} from './project-sync-config';

interface GitHubRepoResponse {
  name: string;
  full_name: string;
  private: boolean;
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
  defaults: FeaturedReposDefaults;
  repos: CachedRepo[];
}

const GITHUB_API = 'https://api.github.com';
const CACHE_PATH = path.join(process.cwd(), '.project-cache.json');

async function fetchWithRetry(
  url: string,
  headers: Record<string, string>
): Promise<Response> {
  try {
    return await fetch(url, { headers });
  } catch {
    console.warn('  GitHub request failed, retrying once...');
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return fetch(url, { headers });
  }
}

function throwForAuthenticationOrRateLimit(response: Response): void {
  if (response.status === 401) {
    throw new Error(
      'GitHub rejected the credential. Run `gh auth login` again or replace GITHUB_TOKEN.'
    );
  }

  if (
    response.status === 403 &&
    response.headers.get('x-ratelimit-remaining') === '0'
  ) {
    const resetHeader = response.headers.get('x-ratelimit-reset');
    const resetTime = resetHeader
      ? new Date(Number(resetHeader) * 1000).toLocaleTimeString()
      : 'an unknown time';
    throw new Error(`GitHub API rate limit exceeded; it resets at ${resetTime}.`);
  }
}

async function fetchRepo(
  config: FeaturedRepoConfig,
  headers: Record<string, string>
): Promise<CachedRepo | null> {
  const { repo } = config;
  console.log(`Fetching ${repo}...`);

  const repoResponse = await fetchWithRetry(
    `${GITHUB_API}/repos/${repo}`,
    headers
  );
  throwForAuthenticationOrRateLimit(repoResponse);

  if (repoResponse.status === 404) {
    console.error(`  Repository not found: ${repo} — skipping`);
    return null;
  }
  if (!repoResponse.ok) {
    console.error(
      `  GitHub returned status ${repoResponse.status} for ${repo} — skipping`
    );
    return null;
  }

  const repoData = (await repoResponse.json()) as GitHubRepoResponse;
  if (repoData.private) {
    throw new Error(
      'Refusing to cache or publish a private repository. ' +
        'Only public repositories can be featured.'
    );
  }

  const languageResponse = await fetchWithRetry(
    `${GITHUB_API}/repos/${repo}/languages`,
    headers
  );
  throwForAuthenticationOrRateLimit(languageResponse);
  const languages: Record<string, number> = languageResponse.ok
    ? ((await languageResponse.json()) as Record<string, number>)
    : {};

  const readmeResponse = await fetchWithRetry(
    `${GITHUB_API}/repos/${repo}/readme`,
    headers
  );
  throwForAuthenticationOrRateLimit(readmeResponse);
  let readme = '';
  if (readmeResponse.ok) {
    const readmeData = (await readmeResponse.json()) as {
      content: string;
      encoding: string;
    };
    if (readmeData.encoding === 'base64') {
      readme = Buffer.from(readmeData.content, 'base64').toString('utf8');
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

async function main(): Promise<void> {
  const config = loadFeaturedReposConfig();
  const token = resolveGitHubToken();
  const headers = getGitHubHeaders(token);

  console.log(
    token
      ? 'Using authenticated GitHub API requests.'
      : 'Using unauthenticated requests for selected public repositories.'
  );

  const cached: CachedRepo[] = [];
  for (const repoConfig of config.repos) {
    try {
      const result = await fetchRepo(repoConfig, headers);
      if (result) {
        cached.push(result);
      }
    } catch (error) {
      console.error(
        `  Failed to fetch ${repoConfig.repo}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  const cacheFile: CacheFile = {
    generatedAt: new Date().toISOString(),
    defaults: config.defaults,
    repos: cached,
  };
  writePrivateJsonFile(CACHE_PATH, cacheFile);

  console.log(
    `Done. Cached ${cached.length}/${config.repos.length} public repository ` +
      `selection(s) to .project-cache.json.`
  );
}

main().catch((error) => {
  console.error(
    `Sync failed: ${error instanceof Error ? error.message : String(error)}`
  );
  process.exitCode = 1;
});
