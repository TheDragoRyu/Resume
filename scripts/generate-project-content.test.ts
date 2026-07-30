import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import matter from 'gray-matter';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import {
  buildGenerationEnvironment,
  buildGenerationInvocation,
  buildProjectDocument,
  createGenerationSandbox,
  deriveLinks,
  deriveSlug,
  destroyGenerationSandbox,
  GENERATION_ENV_ALLOWLIST,
  parseGenerationStream,
  planGenerationTargets,
  runGenerationInvocation,
  type CachedRepo,
  type GenerationSandbox,
} from './generate-project-content';
import { projectsDirectory } from './project-paths';
import type { FeaturedRepoConfig } from './project-sync-config';

const defaults = { categoryId: 'cat-experience', featured: false };

function cachedRepo(
  overrides: {
    config?: Partial<FeaturedRepoConfig>;
    github?: Partial<CachedRepo['github']>;
  } = {}
): CachedRepo {
  return {
    config: {
      repo: 'owner/example',
      order: 1,
      ...overrides.config,
    },
    github: {
      name: 'example',
      full_name: 'owner/example',
      description: 'An example repository.',
      homepage: null,
      html_url: 'https://github.com/owner/example',
      stargazers_count: 1,
      forks_count: 0,
      topics: [],
      language: 'TypeScript',
      created_at: '2026-01-01T00:00:00Z',
      pushed_at: '2026-01-02T00:00:00Z',
      ...overrides.github,
    },
    languages: { TypeScript: 100 },
    readme: '# Example',
    fetchedAt: '2026-01-02T00:00:00Z',
  };
}

// ---------------------------------------------------------------------------
// F1: the generation worker must not see the service environment or any tool.
// ---------------------------------------------------------------------------

const POLLUTED_ENV: NodeJS.ProcessEnv = {
  PATH: process.env.PATH,
  LANG: 'en_US.UTF-8',
  TZ: 'UTC',
  HOME: os.homedir(),
  CLAUDE_CONFIG_DIR: path.join(os.homedir(), '.claude'),
  CLAUDECODE: '1',
  GITHUB_TOKEN: 'github-token-must-not-leak',
  GH_TOKEN: 'gh-token-must-not-leak',
  PROJECT_ADMIN_ALLOWED_USERS: 'owner@example.com',
  PROJECT_ADMIN_PUBLIC_ORIGIN: 'https://host.example.ts.net',
  PROJECT_ADMIN_PORT: '4180',
  TAILSCALE_USER_LOGIN: 'owner@example.com',
  AWS_SECRET_ACCESS_KEY: 'aws-secret-must-not-leak',
  AUDIT_ENVIRONMENT_MARKER: 'audit-marker-must-not-leak',
};

const FORBIDDEN_ENV_NAMES = [
  'CLAUDECODE',
  'GITHUB_TOKEN',
  'GH_TOKEN',
  'PROJECT_ADMIN_ALLOWED_USERS',
  'PROJECT_ADMIN_PUBLIC_ORIGIN',
  'PROJECT_ADMIN_PORT',
  'TAILSCALE_USER_LOGIN',
  'AWS_SECRET_ACCESS_KEY',
  'AUDIT_ENVIRONMENT_MARKER',
];

/**
 * Stands in for the `claude` CLI. It reports the environment, arguments, working
 * directory and stdin it actually received inside a well-formed stream so the
 * test can assert on what the real worker would have been able to see.
 */
const STUB_WORKER = `'use strict';
const fs = require('fs');
const chunks = [];
process.stdin.on('data', (chunk) => chunks.push(chunk));
process.stdin.on('end', () => {
  const report = {
    env: process.env,
    argv: process.argv.slice(2),
    cwd: process.cwd(),
    stdin: Buffer.concat(chunks).toString('utf8'),
    homeEntries: fs.readdirSync(process.env.HOME),
  };
  process.stdout.write(
    JSON.stringify({
      type: 'system',
      subtype: 'init',
      tools: [],
      mcp_servers: [],
      slash_commands: [],
    }) + '\\n'
  );
  process.stdout.write(
    JSON.stringify({
      type: 'result',
      subtype: 'success',
      is_error: false,
      result: JSON.stringify(report),
    }) + '\\n'
  );
});
`;

interface WorkerReport {
  env: Record<string, string>;
  argv: string[];
  cwd: string;
  stdin: string;
  homeEntries: string[];
}

describe('generation worker privilege reduction', () => {
  let stubDirectory: string;
  let stubPath: string;
  let sandbox: GenerationSandbox;

  beforeAll(() => {
    stubDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'generation-stub-'));
    stubPath = path.join(stubDirectory, 'stub-worker.cjs');
    fs.writeFileSync(stubPath, STUB_WORKER);
  });

  afterAll(() => {
    fs.rmSync(stubDirectory, { recursive: true, force: true });
  });

  beforeEach(() => {
    sandbox = createGenerationSandbox();
  });

  afterEach(() => {
    destroyGenerationSandbox(sandbox);
  });

  it('builds the worker environment from an allowlist rather than process.env', () => {
    const env = buildGenerationEnvironment(POLLUTED_ENV, sandbox);
    const permitted = [...GENERATION_ENV_ALLOWLIST, 'HOME', 'CLAUDE_CONFIG_DIR'];

    for (const name of Object.keys(env)) {
      expect(permitted).toContain(name);
    }
    for (const name of FORBIDDEN_ENV_NAMES) {
      expect(env).not.toHaveProperty(name);
    }
    expect(env.HOME).toBe(sandbox.home);
    expect(env.CLAUDE_CONFIG_DIR).toBe(sandbox.configDir);
  });

  it('never lists a GitHub, Tailscale or service-origin variable in the allowlist', () => {
    for (const name of GENERATION_ENV_ALLOWLIST) {
      expect(name).not.toMatch(/GITHUB|GH_|TAILSCALE|PROJECT_ADMIN|AWS/);
    }
  });

  it('gives the spawned worker no parent environment, no repository access and an empty HOME', async () => {
    const invocation = buildGenerationInvocation(sandbox, POLLUTED_ENV);
    const output = await runGenerationInvocation(
      {
        ...invocation,
        command: process.execPath,
        args: [stubPath, ...invocation.args],
      },
      'UNTRUSTED README CONTENT'
    );
    const report = JSON.parse(output) as WorkerReport;

    // No parent environment value reaches the worker.
    for (const name of FORBIDDEN_ENV_NAMES) {
      expect(report.env).not.toHaveProperty(name);
    }
    expect(JSON.stringify(report.env)).not.toContain('must-not-leak');
    for (const name of Object.keys(report.env)) {
      expect([
        ...GENERATION_ENV_ALLOWLIST,
        'HOME',
        'CLAUDE_CONFIG_DIR',
      ]).toContain(name);
    }

    // An empty temporary HOME, not the operator's home.
    expect(report.env.HOME).toBe(sandbox.home);
    expect(report.env.HOME).not.toBe(os.homedir());
    expect(report.homeEntries).toEqual([]);

    // No repository access: the worker runs in an empty temporary directory.
    expect(report.cwd).toBe(sandbox.workDir);
    expect(report.cwd.startsWith(process.cwd())).toBe(false);
    expect(fs.readdirSync(sandbox.workDir)).toEqual([]);

    // The untrusted text arrives only on stdin.
    expect(report.stdin).toBe('UNTRUSTED README CONTENT');
    expect(report.argv.join(' ')).not.toContain('UNTRUSTED README CONTENT');
  });

  it('disables every tool category at the call site', async () => {
    const invocation = buildGenerationInvocation(sandbox, POLLUTED_ENV);
    const output = await runGenerationInvocation(
      {
        ...invocation,
        command: process.execPath,
        args: [stubPath, ...invocation.args],
      },
      'prompt'
    );
    const { argv } = JSON.parse(output) as WorkerReport;

    expect(argv[argv.indexOf('--tools') + 1]).toBe('');
    expect(argv[argv.indexOf('--setting-sources') + 1]).toBe('');
    expect(argv).toContain('--strict-mcp-config');
    expect(argv).toContain('--disable-slash-commands');
    expect(argv).toContain('--no-session-persistence');

    for (const dangerous of [
      '--dangerously-skip-permissions',
      '--allow-dangerously-skip-permissions',
      '--add-dir',
      '--permission-mode',
      '--mcp-config',
      '--allowedTools',
      '--allowed-tools',
    ]) {
      expect(argv).not.toContain(dangerous);
    }
  });
});

describe('generation worker tool attestation', () => {
  function stream(init: Record<string, unknown>): string {
    return [
      JSON.stringify({ type: 'system', subtype: 'init', ...init }),
      JSON.stringify({
        type: 'result',
        subtype: 'success',
        is_error: false,
        result: '## Description\nOK',
      }),
    ].join('\n');
  }

  it('accepts output only when no tool is available', () => {
    expect(
      parseGenerationStream(
        stream({ tools: [], mcp_servers: [], slash_commands: [] })
      )
    ).toBe('## Description\nOK');
  });

  it.each([
    ['a shell tool', { tools: ['Bash'], mcp_servers: [], slash_commands: [] }],
    ['file tools', { tools: ['Read', 'Write'], mcp_servers: [], slash_commands: [] }],
    ['a web tool', { tools: ['WebFetch'], mcp_servers: [], slash_commands: [] }],
    ['a search tool', { tools: ['WebSearch'], mcp_servers: [], slash_commands: [] }],
    ['an MCP server', { tools: [], mcp_servers: [{ name: 'github' }], slash_commands: [] }],
    ['a slash command', { tools: [], mcp_servers: [], slash_commands: ['deploy'] }],
    ['an unreported tool list', { mcp_servers: [], slash_commands: [] }],
  ])('rejects the result when the worker reports %s', (_label, init) => {
    expect(() => parseGenerationStream(stream(init))).toThrow(
      /refusing to send untrusted repository text/
    );
  });

  it('rejects output from a worker that never attested its configuration', () => {
    expect(() =>
      parseGenerationStream(
        JSON.stringify({
          type: 'result',
          subtype: 'success',
          is_error: false,
          result: 'text',
        })
      )
    ).toThrow('no session initialization event');
  });

  it('rejects an error result', () => {
    expect(() =>
      parseGenerationStream(
        [
          JSON.stringify({
            type: 'system',
            subtype: 'init',
            tools: [],
            mcp_servers: [],
            slash_commands: [],
          }),
          JSON.stringify({ type: 'result', subtype: 'error_max_turns', is_error: true }),
        ].join('\n')
      )
    ).toThrow('error result');
  });
});

// ---------------------------------------------------------------------------
// F2: the generator must resolve every destination inside src/data/projects.
// ---------------------------------------------------------------------------

describe('generation target containment', () => {
  const originalCwd = process.cwd();
  let fixture: string;
  let outsideFile: string;

  beforeEach(() => {
    fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'generation-target-'));
    fs.mkdirSync(path.join(fixture, 'src', 'data', 'projects'), {
      recursive: true,
    });
    outsideFile = path.join(fixture, 'AGENTS.md');
    fs.writeFileSync(outsideFile, 'untouched instructions\n');
    process.chdir(fixture);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    fs.rmSync(fixture, { recursive: true, force: true });
  });

  it('resolves valid slugs inside the projects directory', () => {
    const targets = planGenerationTargets([
      cachedRepo(),
      cachedRepo({ config: { overrides: { slug: 'custom-slug' } } }),
    ]);

    expect(targets.map((target) => target.slug)).toEqual([
      'example',
      'custom-slug',
    ]);
    for (const target of targets) {
      expect(path.dirname(target.filePath)).toBe(projectsDirectory());
    }
  });

  it.each([
    '../../../AGENTS',
    '../../AGENTS',
    'nested/AGENTS',
    '/tmp/AGENTS',
    '..%2f..%2fAGENTS',
    'Example',
  ])('rejects the whole plan for unsafe slug %s', (slug) => {
    const repos = [
      cachedRepo(),
      cachedRepo({ config: { overrides: { slug } } }),
    ];

    expect(() => planGenerationTargets(repos)).toThrow();
    expect(() => deriveSlug(repos[1])).toThrow();
    expect(fs.readFileSync(outsideFile, 'utf8')).toBe(
      'untouched instructions\n'
    );
    expect(fs.readdirSync(path.join(fixture, 'src', 'data', 'projects'))).toEqual(
      []
    );
  });
});

// ---------------------------------------------------------------------------
// Model output and repository metadata stay untrusted in the written document.
// ---------------------------------------------------------------------------

describe('generated project document', () => {
  const target = {
    repo: cachedRepo(),
    slug: 'example',
    filePath: path.join(projectsDirectory(), 'example.md'),
  };

  it('serializes hostile scalars as YAML strings instead of new keys', () => {
    const hostile = 'evil"\ninjected: true\nid: proj-pwned';
    const document = buildProjectDocument(
      {
        ...target,
        repo: cachedRepo({ config: { overrides: { title: hostile } } }),
      },
      defaults,
      ['tag"\nowned: yes'],
      hostile,
      '## Problem\nBody.'
    );
    const parsed = matter(document);

    expect(parsed.data.title).toBe(hostile);
    expect(parsed.data.description).toBe(hostile);
    expect(parsed.data.tags).toEqual(['tag"\nowned: yes']);
    expect(parsed.data.id).toBe('proj-example');
    expect(parsed.data).not.toHaveProperty('injected');
    expect(parsed.data).not.toHaveProperty('owned');
    expect(parsed.content.trim()).toBe('## Problem\nBody.');
  });

  it('rejects a non-string scalar from the cache', () => {
    expect(() =>
      buildProjectDocument(
        {
          ...target,
          repo: cachedRepo({
            config: {
              overrides: { title: 42 as unknown as string },
            },
          }),
        },
        defaults,
        [],
        '',
        'Body.'
      )
    ).toThrow('Project title must be a string');
  });

  it('rejects a non-integer order', () => {
    expect(() =>
      buildProjectDocument(
        {
          ...target,
          repo: cachedRepo({ config: { order: 1.5 } }),
        },
        defaults,
        [],
        '',
        'Body.'
      )
    ).toThrow('Project order must be an integer');
  });

  it('drops non-string and over-long tags', () => {
    const document = buildProjectDocument(
      target,
      defaults,
      ['React', 42 as unknown as string, '', 'x'.repeat(81), 'React'],
      '',
      'Body.'
    );
    expect(matter(document).data.tags).toEqual(['React']);
  });
});

describe('project link validation', () => {
  it('keeps only absolute HTTP and HTTPS links', () => {
    expect(deriveLinks(cachedRepo()).github).toBe(
      'https://github.com/owner/example'
    );
    expect(
      deriveLinks(cachedRepo({ github: { homepage: 'https://example.com' } })).demo
    ).toBe('https://example.com');

    for (const hostile of [
      'javascript:alert(1)',
      'data:text/html,<script>alert(1)</script>',
      'file:///etc/passwd',
      '//example.com/protocol-relative',
      'not a url',
      '',
    ]) {
      expect(
        deriveLinks(cachedRepo({ github: { homepage: hostile } }))
      ).not.toHaveProperty('demo');
    }
  });

  it('drops an unusable repository URL rather than writing it', () => {
    expect(
      deriveLinks(cachedRepo({ github: { html_url: 'file:///etc/passwd' } }))
    ).not.toHaveProperty('github');
  });
});
