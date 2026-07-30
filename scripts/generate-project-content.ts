import { execFile } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { getAllContent } from '../src/content/content-loader';
import { validateContent } from '../src/content/content-validator';
import type { ProjectFrontmatter } from '../src/content/content-types';
import type {
  FeaturedRepoConfig,
  FeaturedReposDefaults,
} from './project-sync-config';
import {
  assertProjectSlug,
  assertSafeProjectFile,
  projectsDirectory,
  readProjectFile,
  removeProjectFile,
  resolveProjectFilePath,
  writeProjectFile,
} from './project-paths';
import {
  asChildEnvironment,
  buildGenerationInvocation,
  createGenerationSandbox,
  destroyGenerationSandbox,
  runGenerationInvocation,
  seedGenerationCredential,
  type GenerationInvocation,
} from './generation-worker';

// ---------------------------------------------------------------------------
// Types (matching sync-github-projects.ts output)
// ---------------------------------------------------------------------------


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

export interface CachedRepo {
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

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CACHE_PATH = path.join(process.cwd(), '.project-cache.json');
const MAX_README_CHARS = 3000;
const MAX_TAGS = 30;
const MAX_TAG_CHARS = 80;
const MAX_URL_CHARS = 2048;
const ALLOWED_LINK_PROTOCOLS = ['http:', 'https:'];

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

export function deriveSlug(repo: CachedRepo): string {
  const label = `Project slug for "${repo.github.full_name}"`;
  const override = repo.config.overrides?.slug;
  if (override !== undefined) {
    return assertProjectSlug(override, label);
  }
  return assertProjectSlug(toKebabCase(repo.github.name), label);
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

// ---------------------------------------------------------------------------
// Untrusted scalar validation
//
// Repository metadata and model output are both untrusted. Every value that
// reaches frontmatter is type-checked and bounded here, and the document itself
// is serialized with a YAML library rather than string interpolation.
// ---------------------------------------------------------------------------

function scalarString(value: unknown, label: string, maximum: number): string {
  if (typeof value !== 'string') {
    throw new Error(`${label} must be a string.`);
  }
  if (value.includes('\0')) {
    throw new Error(`${label} must not contain NUL bytes.`);
  }
  return value.length > maximum ? `${value.slice(0, maximum - 1)}…` : value;
}

function scalarInteger(value: unknown, label: string): number {
  if (!Number.isInteger(value)) {
    throw new Error(`${label} must be an integer.`);
  }
  return Number(value);
}

function normalizeTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const tags: string[] = [];
  for (const entry of value) {
    if (typeof entry !== 'string') continue;
    const tag = entry.trim();
    if (!tag || tag.includes('\0') || tag.length > MAX_TAG_CHARS) continue;
    if (!tags.includes(tag)) tags.push(tag);
    if (tags.length === MAX_TAGS) break;
  }
  return tags;
}

/** Returns the URL only when it is an absolute HTTP(S) URL. */
export function safeHttpUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const candidate = value.trim();
  if (!candidate || candidate.length > MAX_URL_CHARS) return undefined;

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return undefined;
  }
  return ALLOWED_LINK_PROTOCOLS.includes(url.protocol) ? candidate : undefined;
}

export function deriveLinks(repo: CachedRepo): Record<string, string> {
  const links: Record<string, string> = {};

  const repository = safeHttpUrl(repo.github.html_url);
  if (repository) links.github = repository;

  const demo = safeHttpUrl(
    repo.config.overrides?.links?.demo ?? repo.github.homepage
  );
  if (demo) links.demo = demo;

  const writeup = safeHttpUrl(repo.config.overrides?.links?.writeup);
  if (writeup) links.writeup = writeup;

  return links;
}

export function buildProjectDocument(
  target: GenerationTarget,
  defaults: FeaturedReposDefaults,
  aiTags: string[],
  aiDescription: string,
  body: string,
  existingProject?: Partial<ProjectFrontmatter>
): string {
  const { repo, slug } = target;
  const description =
    repo.config.overrides?.description ??
    (aiDescription || deriveDescription(repo));

  const frontmatter: Record<string, unknown> = {
    id: `proj-${slug}`,
    slug,
    title: scalarString(deriveTitle(repo), 'Project title', 240),
    type: 'project',
    order: scalarInteger(repo.config.order, 'Project order'),
    description: scalarString(description, 'Project description', 1_000),
    categoryId: scalarString(
      repo.config.categoryId ?? defaults.categoryId,
      'Project category',
      120
    ),
    featured: (repo.config.featured ?? defaults.featured) === true,
  };

  if (existingProject?.image) {
    frontmatter.image = scalarString(
      existingProject.image,
      'Project image',
      512
    );
    if (existingProject.imageAlt) {
      frontmatter.imageAlt = scalarString(
        existingProject.imageAlt,
        'Project image alt text',
        512
      );
    }
  }

  const tags = normalizeTags(repo.config.overrides?.tags ?? aiTags);
  if (tags.length > 0) frontmatter.tags = tags;

  const links = deriveLinks(repo);
  if (Object.keys(links).length > 0) frontmatter.links = links;

  const normalizedBody = body.replace(/\s+$/u, '');
  return matter.stringify(
    normalizedBody ? `\n${normalizedBody}\n` : '',
    frontmatter
  );
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
// Target planning
//
// Every slug is validated and every destination path is resolved before the
// generator touches the filesystem or starts a subprocess, so an unsafe entry
// anywhere in the cache rejects the whole run instead of leaving partial state.
// ---------------------------------------------------------------------------

export interface GenerationTarget {
  repo: CachedRepo;
  slug: string;
  filePath: string;
}

export function planGenerationTargets(repos: CachedRepo[]): GenerationTarget[] {
  return repos.map((repo) => {
    const slug = deriveSlug(repo);
    return {
      repo,
      slug,
      filePath: resolveProjectFilePath(
        slug,
        `Project slug for "${repo.github.full_name}"`
      ),
    };
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

/**
 * Puts a target back the way it was found. Restoring is itself a filesystem
 * operation on one target, so a failure here is reported and contained rather
 * than allowed to abort the remaining repositories.
 */
function restoreProjectTarget(
  filePath: string,
  previousContents: string | undefined
): void {
  try {
    if (previousContents !== undefined) {
      writeProjectFile(filePath, previousContents);
      console.error(`  Restored previous content: ${filePath}`);
    } else if (removeProjectFile(filePath)) {
      console.error(`  Removed invalid file: ${filePath}`);
    }
  } catch (err) {
    console.error(`  Could not restore ${filePath}: ${err}`);
  }
}

async function generateTarget(
  target: GenerationTarget,
  defaults: FeaturedReposDefaults,
  invocation: GenerationInvocation,
  shouldForce: boolean
): Promise<'generated' | 'skipped' | 'failed'> {
  const { repo, slug, filePath } = target;

  // Rejects symbolic links and non-regular files for existing and new targets.
  const state = assertSafeProjectFile(filePath);

  // Lock: never overwrite locked repos, even with --force
  if (repo.config.lock) {
    console.log(`Skipping ${slug} — locked in the local project selection`);
    return 'skipped';
  }

  // Idempotency: skip if file exists and not forced
  if (state === 'file' && !shouldForce) {
    console.log(`Skipping ${slug} — file already exists (use --force to overwrite)`);
    return 'skipped';
  }

  // Existing frontmatter is untrusted input too: a hand-edited file can fail to
  // parse or carry a non-string scalar. That must fail this target only.
  let existingContent: string | undefined;
  let existingProject: Partial<ProjectFrontmatter> | undefined;
  try {
    existingContent = state === 'file' ? readProjectFile(filePath) : undefined;
    existingProject = existingContent
      ? (matter(existingContent).data as Partial<ProjectFrontmatter>)
      : undefined;
  } catch (err) {
    console.error(
      `  Could not read the existing document for ${slug}: ${err} — skipping`
    );
    return 'failed';
  }

  console.log(`Generating content for ${slug}...`);

  let body: string;
  try {
    body = await runGenerationInvocation(invocation, buildUserPrompt(repo));
  } catch (err) {
    console.error(`  Claude generation failed for ${slug}: ${err} — skipping`);
    return 'failed';
  }

  // Validate output has expected sections
  const requiredSections = ['## Description', '## Tags', '## Problem', '## Solution', '## Highlights', '## Tech Stack'];
  const missingSections = requiredSections.filter((s) => !body.includes(s));
  if (missingSections.length > 0) {
    console.error(
      `  Generated content for ${slug} is missing sections: ${missingSections.join(', ')} — skipping`
    );
    return 'failed';
  }

  // Building, writing and validating the document all reject untrusted values by
  // throwing. Like the generation call above, that must fail this target only —
  // the remaining repositories still get their turn.
  try {
    const document = buildProjectDocument(
      target,
      defaults,
      parseTagsFromBody(body),
      parseDescriptionFromBody(body),
      stripMetaSections(body),
      existingProject
    );

    writeProjectFile(filePath, document);

    const validation = await validateGenerated(filePath);
    if (validation.valid) {
      console.log(`  Written: ${filePath}`);
      return 'generated';
    }

    console.error(
      `  Validation failed for ${slug}:\n${validation.errors.map((e) => `    ${e}`).join('\n')}`
    );
  } catch (err) {
    console.error(
      `  Could not write generated content for ${slug}: ${err} — skipping`
    );
  }

  restoreProjectTarget(filePath, existingContent);
  return 'failed';
}

async function main() {
  // Check cache exists
  if (!fs.existsSync(CACHE_PATH)) {
    console.error(
      'No .project-cache.json found. Run `npm run sync:fetch` first.'
    );
    process.exit(1);
  }

  // Check claude CLI is available. The probe gets no inherited environment
  // either, so a missing PATH entry fails here rather than mid-generation.
  try {
    await new Promise<void>((resolve, reject) => {
      execFile(
        'claude',
        ['--version'],
        {
          env: asChildEnvironment({ PATH: process.env.PATH ?? '' }),
          shell: false,
        },
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
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
  if (!cache.defaults?.categoryId) {
    console.error(
      'The project cache predates secure local configuration. ' +
        'Run npm run sync:fetch again.'
    );
    process.exit(1);
  }

  if (cache.repos.length === 0) {
    console.log('Cache is empty. Nothing to generate.');
    return;
  }

  // Validate every slug and resolve every destination before any file work.
  const targets = planGenerationTargets(cache.repos);
  const { forceAll, forceSlugs } = parseForceArg(process.argv.slice(2));

  const projectsDir = projectsDirectory();
  if (!fs.existsSync(projectsDir)) {
    fs.mkdirSync(projectsDir, { recursive: true });
  }

  let generated = 0;
  let skipped = 0;

  const sandbox = createGenerationSandbox();
  try {
    if (!seedGenerationCredential(sandbox)) {
      console.log(
        'No local Claude credential found; the generation worker will rely on ANTHROPIC_API_KEY.'
      );
    }
    const invocation = buildGenerationInvocation(sandbox);

    for (const target of targets) {
      const outcome = await generateTarget(
        target,
        cache.defaults,
        invocation,
        forceAll || forceSlugs.has(target.slug)
      );
      if (outcome === 'generated') generated += 1;
      if (outcome === 'skipped') skipped += 1;
    }
  } finally {
    destroyGenerationSandbox(sandbox);
  }

  console.log(
    `\nDone. Generated ${generated} file(s), skipped ${skipped} existing.`
  );
}

const isMainModule =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMainModule) {
  main().catch((err) => {
    console.error('Generate script failed:', err);
    process.exit(1);
  });
}
