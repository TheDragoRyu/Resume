import { spawn } from 'node:child_process';
import { randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import fs from 'node:fs';
import http, {
  type IncomingMessage,
  type ServerResponse,
} from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  type FeaturedRepoConfig,
  type FeaturedReposFile,
  loadExampleDefaults,
  loadFeaturedReposConfig,
  requireGitHubToken,
  validateFeaturedReposConfig,
} from './project-sync-config';
import {
  assertPublicRepositorySelection,
  fetchAvailableRepositories,
  saveProjectConfiguration,
} from './project-selection';
import {
  assertProjectSlug,
  MAX_PROJECT_SLUG_LENGTH,
} from './project-paths';
import {
  createProjectDocument,
  deleteMediaFile,
  deleteProjectDocument,
  listContentDocuments,
  listMediaFiles,
  saveContentDocument,
  saveMediaFile,
} from './project-admin/content-store';

const HOST = '127.0.0.1';
const PORT = Number(process.env.PROJECT_ADMIN_PORT ?? '4180');
const PUBLIC_ORIGIN = process.env.PROJECT_ADMIN_PUBLIC_ORIGIN?.replace(/\/$/, '');
const ALLOWED_USERS = (process.env.PROJECT_ADMIN_ALLOWED_USERS ?? '')
  .split(',')
  .map((user) => user.trim().toLowerCase())
  .filter(Boolean);
const STATIC_DIR = path.join(process.cwd(), 'scripts', 'project-admin');
const CSRF_TOKEN = randomBytes(32).toString('base64url');
const MAX_JSON_BYTES = 12 * 1024 * 1024;
const MAX_JOB_OUTPUT = 200_000;

interface AdminJob {
  id: string;
  action: JobAction;
  status: 'running' | 'succeeded' | 'failed';
  startedAt: string;
  finishedAt?: string;
  output: string;
  exitCode?: number | null;
}

type JobAction = 'fetch' | 'generate' | 'check';

const JOB_COMMANDS: Record<JobAction, string[]> = {
  fetch: ['run', 'sync:fetch'],
  generate: ['run', 'sync:generate'],
  check: ['run', 'check'],
};

const jobs: AdminJob[] = [];

export function parseAllowedUsers(value: string): string[] {
  return value
    .split(',')
    .map((user) => user.trim().toLowerCase())
    .filter(Boolean);
}

export function identityIsAllowed(
  candidate: string | undefined,
  allowedUsers: string[]
): boolean {
  if (!candidate) return false;
  const normalized = Buffer.from(candidate.trim().toLowerCase());

  return allowedUsers.some((allowed) => {
    const expected = Buffer.from(allowed);
    return (
      normalized.length === expected.length &&
      timingSafeEqual(normalized, expected)
    );
  });
}

/**
 * Identity comes solely from the `Tailscale-User-Login` header, which is trusted
 * because Tailscale Serve is the only reachable path to this process: the server
 * binds to 127.0.0.1 and the proxy strips and re-injects the header. Tailscale's
 * local API cannot improve on this — the backend sees the loopback proxy as its
 * peer, not the tailnet caller, so there is no non-spoofable peer identity to
 * ask for. This application is deliberately single-user with no authentication
 * layer; a separate local OS principal is inside the trust boundary. See
 * docs/RUNBOOK.md, "Security and recovery".
 */
function requestIdentity(request: IncomingMessage): string | undefined {
  const value = request.headers['tailscale-user-login'];
  return Array.isArray(value) ? value[0] : value;
}

function secureHeaders(contentType: string): Record<string, string> {
  return {
    'Cache-Control': 'no-store, max-age=0',
    'Content-Security-Policy':
      "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; " +
      "connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
    'Content-Type': contentType,
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
  };
}

function sendJson(
  response: ServerResponse,
  status: number,
  value: unknown
): void {
  response.writeHead(status, secureHeaders('application/json; charset=utf-8'));
  response.end(JSON.stringify(value));
}

function sendError(response: ServerResponse, status: number, error: unknown): void {
  const message = error instanceof Error ? error.message : 'Unexpected error.';
  sendJson(response, status, { error: message });
}

function authorize(
  request: IncomingMessage,
  response: ServerResponse
): string | undefined {
  const identity = requestIdentity(request);
  if (!identityIsAllowed(identity, ALLOWED_USERS)) {
    sendJson(response, 401, {
      error: 'This Tailscale identity is not allowed to use the authoring server.',
    });
    return undefined;
  }
  return identity;
}

function requireMutationProtection(
  request: IncomingMessage,
  response: ServerResponse
): boolean {
  if (!PUBLIC_ORIGIN || request.headers.origin !== PUBLIC_ORIGIN) {
    sendJson(response, 403, { error: 'Request origin was rejected.' });
    return false;
  }
  if (request.headers['x-csrf-token'] !== CSRF_TOKEN) {
    sendJson(response, 403, { error: 'CSRF token was rejected.' });
    return false;
  }
  if (!request.headers['content-type']?.startsWith('application/json')) {
    sendJson(response, 415, { error: 'JSON content type is required.' });
    return false;
  }
  return true;
}

async function readJson(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > MAX_JSON_BYTES) {
      throw new Error('Request body exceeds the 12 MiB limit.');
    }
    chunks.push(buffer);
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new Error('Request body is not valid JSON.');
  }
}

function optionalString(
  value: unknown,
  label: string,
  maximum: number
): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string' || value.length > maximum) {
    throw new Error(`${label} must be a string under ${maximum} characters.`);
  }
  return value;
}

function optionalUrl(value: unknown, label: string): string | undefined {
  const candidate = optionalString(value, label, 2_048);
  if (!candidate) return undefined;
  const url = new URL(candidate);
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error(`${label} must use HTTP or HTTPS.`);
  }
  return candidate;
}

function optionalSlug(value: unknown, label: string): string | undefined {
  const candidate = optionalString(value, label, MAX_PROJECT_SLUG_LENGTH);
  if (candidate === undefined) return undefined;
  return assertProjectSlug(candidate, label);
}

export function normalizeProjectConfig(value: unknown): FeaturedReposFile {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Project configuration must be an object.');
  }
  const input = value as {
    defaults?: { categoryId?: unknown; featured?: unknown };
    repos?: unknown;
  };
  const categoryId = optionalString(
    input.defaults?.categoryId,
    'Default category',
    120
  );
  if (!categoryId) throw new Error('Default category is required.');
  if (!Array.isArray(input.repos) || input.repos.length > 500) {
    throw new Error('Repositories must be an array with at most 500 entries.');
  }

  const repos: FeaturedRepoConfig[] = input.repos.map((entry, index) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      throw new Error(`Repository ${index + 1} is invalid.`);
    }
    const candidate = entry as Record<string, unknown>;
    const repo = optionalString(candidate.repo, 'Repository name', 240);
    if (!repo) throw new Error(`Repository ${index + 1} needs a name.`);
    const order = candidate.order;
    if (!Number.isInteger(order) || Number(order) < 1) {
      throw new Error(`Repository "${repo}" needs a positive integer order.`);
    }

    const rawOverrides =
      candidate.overrides &&
      typeof candidate.overrides === 'object' &&
      !Array.isArray(candidate.overrides)
        ? (candidate.overrides as Record<string, unknown>)
        : {};
    const rawLinks =
      rawOverrides.links &&
      typeof rawOverrides.links === 'object' &&
      !Array.isArray(rawOverrides.links)
        ? (rawOverrides.links as Record<string, unknown>)
        : {};
    const tags = rawOverrides.tags;
    if (
      tags !== undefined &&
      (!Array.isArray(tags) ||
        tags.length > 30 ||
        tags.some((tag) => typeof tag !== 'string' || tag.length > 80))
    ) {
      throw new Error(`Repository "${repo}" has invalid override tags.`);
    }

    return {
      repo,
      order: Number(order),
      lock: candidate.lock === true,
      context: optionalString(candidate.context, 'Context', 20_000),
      categoryId: optionalString(candidate.categoryId, 'Category', 120),
      featured: candidate.featured === true,
      overrides: {
        title: optionalString(rawOverrides.title, 'Title', 240),
        slug: optionalSlug(rawOverrides.slug, 'Slug'),
        description: optionalString(
          rawOverrides.description,
          'Description',
          1_000
        ),
        tags: tags as string[] | undefined,
        links: {
          demo: optionalUrl(rawLinks.demo, 'Demo URL'),
          writeup: optionalUrl(rawLinks.writeup, 'Write-up URL'),
        },
      },
    };
  });

  return validateFeaturedReposConfig({
    defaults: {
      categoryId,
      featured: input.defaults?.featured === true,
    },
    repos,
  });
}

function existingConfig(): FeaturedReposFile {
  try {
    return loadFeaturedReposConfig();
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.startsWith('No local project selection found.')
    ) {
      return { defaults: loadExampleDefaults(), repos: [] };
    }
    throw error;
  }
}

function appendJobOutput(job: AdminJob, value: string): void {
  const withoutAnsi = value.replace(/\u001b\[[0-9;]*m/g, '');
  job.output = `${job.output}${withoutAnsi}`.slice(-MAX_JOB_OUTPUT);
}

function startJob(action: JobAction): AdminJob {
  const running = jobs.find((job) => job.status === 'running');
  if (running) {
    throw new Error(`The "${running.action}" action is already running.`);
  }

  const job: AdminJob = {
    id: randomUUID(),
    action,
    status: 'running',
    startedAt: new Date().toISOString(),
    output: '',
  };
  jobs.unshift(job);
  jobs.splice(20);

  const child = spawn('/usr/bin/npm', JOB_COMMANDS[action], {
    cwd: process.cwd(),
    env: process.env,
    shell: false,
  });
  child.stdout.on('data', (chunk) => appendJobOutput(job, String(chunk)));
  child.stderr.on('data', (chunk) => appendJobOutput(job, String(chunk)));
  child.on('error', (error) => {
    appendJobOutput(job, `\n${error.message}\n`);
    job.status = 'failed';
    job.finishedAt = new Date().toISOString();
  });
  child.on('close', (exitCode) => {
    job.exitCode = exitCode;
    job.status = exitCode === 0 ? 'succeeded' : 'failed';
    job.finishedAt = new Date().toISOString();
  });

  return job;
}

function serveStatic(pathname: string, response: ServerResponse): boolean {
  const assets: Record<string, [string, string]> = {
    '/': ['index.html', 'text/html; charset=utf-8'],
    '/app.js': ['app.js', 'text/javascript; charset=utf-8'],
    '/admin.css': ['admin.css', 'text/css; charset=utf-8'],
  };
  const asset = assets[pathname];
  if (!asset) return false;

  const contents = fs.readFileSync(path.join(STATIC_DIR, asset[0]));
  response.writeHead(200, secureHeaders(asset[1]));
  response.end(contents);
  return true;
}

function serveMedia(pathname: string, response: ServerResponse): boolean {
  if (!pathname.startsWith('/images/')) return false;

  let filename: string;
  try {
    filename = decodeURIComponent(pathname.slice('/images/'.length));
  } catch {
    return false;
  }
  if (!filename || filename !== path.basename(filename)) return false;

  const extension = path.extname(filename).toLowerCase();
  const contentTypes: Record<string, string> = {
    '.avif': 'image/avif',
    '.jpeg': 'image/jpeg',
    '.jpg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
  };
  const contentType = contentTypes[extension];
  if (!contentType) return false;

  const mediaPath = path.join(process.cwd(), 'public', 'images', filename);
  if (!fs.existsSync(mediaPath) || !fs.statSync(mediaPath).isFile()) return false;
  if (fs.lstatSync(mediaPath).isSymbolicLink()) return false;

  response.writeHead(200, secureHeaders(contentType));
  response.end(fs.readFileSync(mediaPath));
  return true;
}

async function handleApi(
  request: IncomingMessage,
  response: ServerResponse,
  pathname: string,
  identity: string
): Promise<boolean> {
  if (request.method === 'GET' && pathname === '/api/session') {
    sendJson(response, 200, {
      identity,
      csrfToken: CSRF_TOKEN,
      publicOrigin: PUBLIC_ORIGIN,
    });
    return true;
  }

  if (request.method === 'GET' && pathname === '/api/projects') {
    const token = requireGitHubToken();
    const repositories = await fetchAvailableRepositories(token);
    sendJson(response, 200, {
      repositories,
      config: existingConfig(),
    });
    return true;
  }

  if (request.method === 'PUT' && pathname === '/api/projects') {
    if (!requireMutationProtection(request, response)) return true;
    const next = normalizeProjectConfig(await readJson(request));
    const token = requireGitHubToken();
    const repositories = await fetchAvailableRepositories(token);
    assertPublicRepositorySelection(next, repositories);
    const previous = existingConfig();
    // Plans every project file path before persisting configuration; see
    // saveProjectConfiguration in project-selection.ts.
    const updatedProjectFiles = saveProjectConfiguration(previous, next);
    sendJson(response, 200, { saved: next.repos.length, updatedProjectFiles });
    return true;
  }

  if (request.method === 'GET' && pathname === '/api/content') {
    sendJson(response, 200, {
      documents: listContentDocuments(),
      media: listMediaFiles(),
    });
    return true;
  }

  if (request.method === 'PUT' && pathname === '/api/content') {
    if (!requireMutationProtection(request, response)) return true;
    const input = (await readJson(request)) as Parameters<
      typeof saveContentDocument
    >[0];
    await saveContentDocument(input);
    sendJson(response, 200, { saved: input.path });
    return true;
  }

  if (request.method === 'POST' && pathname === '/api/content/project') {
    if (!requireMutationProtection(request, response)) return true;
    const input = (await readJson(request)) as {
      filename: string;
      frontmatter: Record<string, unknown>;
      body: string;
    };
    const created = await createProjectDocument(input.filename, input);
    sendJson(response, 201, { created });
    return true;
  }

  if (request.method === 'DELETE' && pathname === '/api/content') {
    if (!requireMutationProtection(request, response)) return true;
    const input = (await readJson(request)) as { path: string };
    await deleteProjectDocument(input.path);
    sendJson(response, 200, { deleted: input.path, recoverable: true });
    return true;
  }

  if (request.method === 'POST' && pathname === '/api/media') {
    if (!requireMutationProtection(request, response)) return true;
    const input = (await readJson(request)) as {
      filename: string;
      base64: string;
    };
    const media = saveMediaFile(input.filename, input.base64);
    sendJson(response, 201, { media });
    return true;
  }

  if (request.method === 'DELETE' && pathname === '/api/media') {
    if (!requireMutationProtection(request, response)) return true;
    const input = (await readJson(request)) as { path: string };
    await deleteMediaFile(input.path);
    sendJson(response, 200, { deleted: input.path, recoverable: true });
    return true;
  }

  if (request.method === 'GET' && pathname === '/api/jobs') {
    sendJson(response, 200, { jobs });
    return true;
  }

  const jobMatch = pathname.match(/^\/api\/jobs\/(fetch|generate|check)$/);
  if (request.method === 'POST' && jobMatch) {
    if (!requireMutationProtection(request, response)) return true;
    await readJson(request);
    const job = startJob(jobMatch[1] as JobAction);
    sendJson(response, 202, { job });
    return true;
  }

  return false;
}

async function handleRequest(
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  const identity = authorize(request, response);
  if (!identity) return;

  const url = new URL(request.url ?? '/', PUBLIC_ORIGIN ?? 'http://localhost');
  if (url.pathname.startsWith('/api/')) {
    if (await handleApi(request, response, url.pathname, identity)) return;
    sendJson(response, 404, { error: 'API route not found.' });
    return;
  }

  if (
    request.method === 'GET' &&
    (serveStatic(url.pathname, response) || serveMedia(url.pathname, response))
  ) {
    return;
  }
  sendJson(response, 404, { error: 'Not found.' });
}

function validateEnvironment(): void {
  if (!Number.isInteger(PORT) || PORT < 1024 || PORT > 65_535) {
    throw new Error('PROJECT_ADMIN_PORT must be an integer from 1024 to 65535.');
  }
  if (ALLOWED_USERS.length === 0) {
    throw new Error('PROJECT_ADMIN_ALLOWED_USERS must name at least one user.');
  }
  if (!PUBLIC_ORIGIN || new URL(PUBLIC_ORIGIN).protocol !== 'https:') {
    throw new Error('PROJECT_ADMIN_PUBLIC_ORIGIN must be an HTTPS origin.');
  }
  for (const file of ['index.html', 'app.js', 'admin.css']) {
    if (!fs.existsSync(path.join(STATIC_DIR, file))) {
      throw new Error(`Missing admin asset: ${file}`);
    }
  }
}

const isMainModule =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMainModule) {
  validateEnvironment();
  const server = http.createServer((request, response) => {
    handleRequest(request, response).catch((error) => {
      sendError(response, 500, error);
    });
  });
  server.requestTimeout = 30_000;
  server.headersTimeout = 15_000;
  server.listen(PORT, HOST, () => {
    console.log(
      `Portfolio authoring server listening on http://${HOST}:${PORT} for ${ALLOWED_USERS.join(', ')}`
    );
  });
}
