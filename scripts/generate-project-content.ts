import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { getAllContent } from '../src/content/content-loader';
import { validateContent } from '../src/content/content-validator';
import type { ContentItem, ProjectFrontmatter } from '../src/content/content-types';

// ---------------------------------------------------------------------------
// Types (matching sync-github-projects.ts output)
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

interface FeaturedReposDefaults {
  categoryId: string;
  featured: boolean;
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
// Constants
// ---------------------------------------------------------------------------

const PROJECTS_DIR = path.join(process.cwd(), 'src', 'data', 'projects');
const CACHE_PATH = path.join(process.cwd(), '.project-cache.json');
const CONFIG_PATH = path.join(process.cwd(), 'scripts', 'featured-repos.json');
const MAX_README_CHARS = 8000;

const SYSTEM_PROMPT = `You are a technical writer creating a project case study for a software developer's portfolio website. Your output must be ONLY raw Markdown content with no frontmatter, no code fences, and no preamble.

Write exactly four sections using these exact H2 headings in this order:
## Problem
## Approach
## Results
## Tech Stack

Rules:
- "## Problem" (2-4 sentences): The real-world problem this project solves.
- "## Approach" (3-6 sentences): Technical approach, key decisions, patterns used.
- "## Results" (3-5 bullet points): Concrete outcomes as a Markdown list.
- "## Tech Stack" (1 line): Comma-separated list of technologies.

Do not invent metrics not in the source material. Write in third person past tense. Keep total output under 300 words.`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toKebabCase(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .replace(/^-+|-+$/g, '');
}

function toTitleCase(str: string): string {
  return str
    .split(/[-_]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function getTopLanguages(languages: Record<string, number>, max = 4): string[] {
  return Object.entries(languages)
    .sort(([, a], [, b]) => b - a)
    .slice(0, max)
    .map(([lang]) => lang);
}

function deriveSlug(repo: CachedRepo): string {
  return repo.config.overrides?.slug ?? toKebabCase(repo.github.name);
}

function deriveTitle(repo: CachedRepo): string {
  return repo.config.overrides?.title ?? toTitleCase(repo.github.name);
}

function deriveTags(repo: CachedRepo): string[] {
  if (repo.config.overrides?.tags) return repo.config.overrides.tags;
  const topics = repo.github.topics ?? [];
  const langs = getTopLanguages(repo.languages);
  const combined = [...new Set([...topics, ...langs])];
  return combined.slice(0, 8);
}

function deriveDescription(repo: CachedRepo): string {
  return (
    repo.config.overrides?.description ??
    repo.github.description ??
    ''
  );
}

function deriveLinks(repo: CachedRepo): Record<string, string> {
  const links: Record<string, string> = {
    github: repo.github.html_url,
  };
  if (repo.config.overrides?.links?.demo) {
    links.demo = repo.config.overrides.links.demo;
  } else if (repo.github.homepage) {
    links.demo = repo.github.homepage;
  }
  if (repo.config.overrides?.links?.writeup) {
    links.writeup = repo.config.overrides.links.writeup;
  }
  return links;
}

function buildFrontmatter(
  repo: CachedRepo,
  defaults: FeaturedReposDefaults
): string {
  const slug = deriveSlug(repo);
  const title = deriveTitle(repo);
  const description = deriveDescription(repo);
  const tags = deriveTags(repo);
  const links = deriveLinks(repo);
  const categoryId = repo.config.categoryId ?? defaults.categoryId;
  const featured = repo.config.featured ?? defaults.featured;

  const lines: string[] = [
    '---',
    `id: proj-${slug}`,
    `slug: ${slug}`,
    `title: "${title}"`,
    `type: project`,
    `order: ${repo.config.order}`,
    `description: "${description}"`,
    `categoryId: ${categoryId}`,
    `featured: ${featured}`,
  ];

  if (tags.length > 0) {
    lines.push('tags:');
    for (const tag of tags) {
      lines.push(`  - ${tag}`);
    }
  }

  if (Object.keys(links).length > 0) {
    lines.push('links:');
    for (const [key, value] of Object.entries(links)) {
      lines.push(`  ${key}: ${value}`);
    }
  }

  lines.push('---');
  return lines.join('\n');
}

function buildUserPrompt(repo: CachedRepo): string {
  const readme = repo.readme.length > MAX_README_CHARS
    ? repo.readme.slice(0, MAX_README_CHARS) + '\n\n[README truncated]'
    : repo.readme;

  const langs = getTopLanguages(repo.languages, 6).join(', ');
  const topics = (repo.github.topics ?? []).join(', ');

  return `Project: ${repo.github.full_name}
Description: ${repo.github.description ?? 'N/A'}
Homepage: ${repo.github.homepage ?? 'N/A'}
Stars: ${repo.github.stargazers_count} | Forks: ${repo.github.forks_count}
Languages: ${langs || 'N/A'}
Topics: ${topics || 'N/A'}

README:
${readme || 'No README available.'}`;
}

// ---------------------------------------------------------------------------
// Claude CLI invocation
// ---------------------------------------------------------------------------

function invokeClaude(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = execFile(
      'claude',
      ['-p', '--model', 'sonnet', '--output-format', 'text'],
      { maxBuffer: 1024 * 1024, timeout: 120_000 },
      (err, stdout, stderr) => {
        if (err) {
          reject(new Error(`claude CLI failed: ${err.message}\n${stderr}`));
          return;
        }
        resolve(stdout.trim());
      }
    );

    // Write system prompt + user prompt to stdin
    if (child.stdin) {
      child.stdin.write(`${systemPrompt}\n\n---\n\n${userPrompt}`);
      child.stdin.end();
    }
  });
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

async function validateGenerated(
  filePath: string
): Promise<{ valid: boolean; errors: string[] }> {
  const allContent = await getAllContent();
  const errors = validateContent(allContent);
  const slug = path.basename(filePath, '.md');
  const relevantErrors = errors.filter(
    (e) => e.file.includes(slug)
  );
  return {
    valid: relevantErrors.length === 0,
    errors: relevantErrors.map((e) => `${e.file}: ${e.message}`),
  };
}

// ---------------------------------------------------------------------------
// CLI arg parsing
// ---------------------------------------------------------------------------

function parseForceArg(args: string[]): { forceAll: boolean; forceSlugs: Set<string> } {
  const forceSlugs = new Set<string>();
  let forceAll = false;

  for (const arg of args) {
    if (arg === '--force') {
      forceAll = true;
    } else if (arg.startsWith('--force=')) {
      forceSlugs.add(arg.slice('--force='.length));
    }
  }

  return { forceAll, forceSlugs };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  // Check cache exists
  if (!fs.existsSync(CACHE_PATH)) {
    console.error(
      'No .project-cache.json found. Run `npm run sync:fetch` first.'
    );
    process.exit(1);
  }

  // Check claude CLI is available
  try {
    await new Promise<void>((resolve, reject) => {
      execFile('claude', ['--version'], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  } catch {
    console.error(
      'The `claude` CLI is not installed or not in PATH.\n' +
        'Install it: npm install -g @anthropic-ai/claude-code\n' +
        'Then run this command again.'
    );
    process.exit(1);
  }

  const cache: CacheFile = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf-8'));
  const config: { defaults: FeaturedReposDefaults } = JSON.parse(
    fs.readFileSync(CONFIG_PATH, 'utf-8')
  );

  if (cache.repos.length === 0) {
    console.log('Cache is empty. Nothing to generate.');
    return;
  }

  const { forceAll, forceSlugs } = parseForceArg(process.argv.slice(2));

  // Ensure projects directory exists
  if (!fs.existsSync(PROJECTS_DIR)) {
    fs.mkdirSync(PROJECTS_DIR, { recursive: true });
  }

  let generated = 0;
  let skipped = 0;

  for (const repo of cache.repos) {
    const slug = deriveSlug(repo);
    const filePath = path.join(PROJECTS_DIR, `${slug}.md`);
    const shouldForce = forceAll || forceSlugs.has(slug);

    // Idempotency: skip if file exists and not forced
    if (fs.existsSync(filePath) && !shouldForce) {
      console.log(`Skipping ${slug} — file already exists (use --force to overwrite)`);
      skipped++;
      continue;
    }

    console.log(`Generating content for ${slug}...`);

    // Build frontmatter deterministically
    const frontmatter = buildFrontmatter(repo, config.defaults);
    const userPrompt = buildUserPrompt(repo);

    // Invoke Claude for body content
    let body: string;
    try {
      body = await invokeClaude(SYSTEM_PROMPT, userPrompt);
    } catch (err) {
      console.error(`  Claude generation failed for ${slug}: ${err} — skipping`);
      continue;
    }

    // Validate output has expected sections
    const requiredSections = ['## Problem', '## Approach', '## Results', '## Tech Stack'];
    const missingSections = requiredSections.filter((s) => !body.includes(s));
    if (missingSections.length > 0) {
      console.error(
        `  Generated content for ${slug} is missing sections: ${missingSections.join(', ')} — skipping`
      );
      continue;
    }

    // Assemble full file
    const fullContent = `${frontmatter}\n\n${body}\n`;

    // Write file
    fs.writeFileSync(filePath, fullContent);

    // Validate against existing content
    const validation = await validateGenerated(filePath);
    if (!validation.valid) {
      console.error(
        `  Validation failed for ${slug}:\n${validation.errors.map((e) => `    ${e}`).join('\n')}`
      );
      // Remove the invalid file
      fs.unlinkSync(filePath);
      console.error(`  Removed invalid file: ${filePath}`);
      continue;
    }

    console.log(`  Written: ${filePath}`);
    generated++;
  }

  console.log(
    `\nDone. Generated ${generated} file(s), skipped ${skipped} existing.`
  );
}

main().catch((err) => {
  console.error('Generate script failed:', err);
  process.exit(1);
});
