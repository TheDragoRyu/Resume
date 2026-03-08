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
  lock?: boolean;
  context?: string;
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
const MAX_README_CHARS = 3000;

const SYSTEM_PROMPT = `You write short project case studies for a developer's portfolio website. The audience is recruiters and hiring managers — they care about what the project DOES, what a user SEES, and what skills it demonstrates. They do not care about internal code structure, build pipelines, or developer tooling.

Output ONLY raw Markdown. No frontmatter, no code fences, no preamble, no extra commentary.

Produce exactly six sections in this order with these exact H2 headings:

## Description
## Tags
## Problem
## Solution
## Highlights
## Tech Stack

Section rules:
- "## Description": One sentence (max 20 words). What this project IS from a user's perspective. E.g. "An interactive portfolio site with a 3D solar system navigation." This goes on the project card — make it count.
- "## Tags": One line. 3-6 comma-separated tags in Title Case. Focus on skills a recruiter searches for (e.g. "React", "Three.js", "Responsive Design", "Accessibility") not internal concerns (e.g. "Content Pipeline", "Validation").
- "## Problem": 1-2 sentences. What gap or need motivated this project? Frame it from the repo owner's personal perspective — this is THEIR project, not a generic tool for "developers". Use first person or impersonal phrasing like "Needed..." not "Developers needed...".
- "## Solution": 2-3 sentences. What was built and how does it work FROM THE OUTSIDE? Mention visible features, interactions, and user experience. Name technologies only when they explain a visible capability (e.g. "Three.js powers an interactive 3D solar system" not "Three.js scenes loaded client-side").
- "## Highlights": 3-5 short bullet points. Each must describe something a recruiter can SEE, CLICK, or VERIFY. Good: "Keyboard-navigable 3D scene with screen reader support". Bad: "Strict folder boundaries". Bad: "Content validation at build time".
- "## Tech Stack": One line. Comma-separated list of technologies.

Style constraints:
- Total output MUST be under 200 words.
- Write in third person past tense.
- Lead with what's visible and impressive. Save internal details for last or omit them.
- Do not invent features, metrics, or outcomes not in the source material.
- Do not mention: file paths, directory structures, config files, build scripts, folder boundaries, frontmatter, loaders, or validation pipelines.
- No marketing fluff ("cutting-edge", "seamless", "robust", "elegant").
- No meta-commentary about the README or repo.
- If "Author's notes" are provided, treat them as the highest-priority source. They contain the author's own perspective on what matters about the project — use them to guide tone, emphasis, and what to highlight.`;

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

function parseOneLinerSection(body: string, heading: string): string {
  const match = body.match(new RegExp(`## ${heading}\\n(.+)`));
  return match ? match[1].trim() : '';
}

function parseTagsFromBody(body: string): string[] {
  const line = parseOneLinerSection(body, 'Tags');
  if (!line) return [];
  return line.split(',').map((t) => t.trim()).filter(Boolean);
}

function parseDescriptionFromBody(body: string): string {
  return parseOneLinerSection(body, 'Description');
}

function stripMetaSections(body: string): string {
  return body
    .replace(/## Description\n.+\n\n?/, '')
    .replace(/## Tags\n.+\n\n?/, '');
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
  defaults: FeaturedReposDefaults,
  aiTags: string[],
  aiDescription: string
): string {
  const slug = deriveSlug(repo);
  const title = deriveTitle(repo);
  const description = repo.config.overrides?.description ?? (aiDescription || deriveDescription(repo));
  const tags = repo.config.overrides?.tags ?? aiTags;
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

  const contextBlock = repo.config.context
    ? `\nAuthor's notes:\n${repo.config.context}\n`
    : '';

  return `Project: ${repo.github.full_name}
Description: ${repo.github.description ?? 'N/A'}
Homepage: ${repo.github.homepage ?? 'N/A'}
Stars: ${repo.github.stargazers_count} | Forks: ${repo.github.forks_count}
Languages: ${langs || 'N/A'}
Topics: ${topics || 'N/A'}
${contextBlock}
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
      { maxBuffer: 1024 * 1024, timeout: 120_000, env: { ...process.env, CLAUDECODE: '' } },
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

    // Lock: never overwrite locked repos, even with --force
    if (repo.config.lock) {
      console.log(`Skipping ${slug} — locked in featured-repos.json`);
      skipped++;
      continue;
    }

    // Idempotency: skip if file exists and not forced
    if (fs.existsSync(filePath) && !shouldForce) {
      console.log(`Skipping ${slug} — file already exists (use --force to overwrite)`);
      skipped++;
      continue;
    }

    console.log(`Generating content for ${slug}...`);

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
    const requiredSections = ['## Description', '## Tags', '## Problem', '## Solution', '## Highlights', '## Tech Stack'];
    const missingSections = requiredSections.filter((s) => !body.includes(s));
    if (missingSections.length > 0) {
      console.error(
        `  Generated content for ${slug} is missing sections: ${missingSections.join(', ')} — skipping`
      );
      continue;
    }

    // Extract AI-generated metadata and strip meta sections from body
    const aiTags = parseTagsFromBody(body);
    const aiDescription = parseDescriptionFromBody(body);
    const cleanBody = stripMetaSections(body);

    // Build frontmatter with AI tags and description
    const frontmatter = buildFrontmatter(repo, config.defaults, aiTags, aiDescription);

    // Assemble full file
    const fullContent = `${frontmatter}\n\n${cleanBody}\n`;

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
