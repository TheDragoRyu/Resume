import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Single source of truth for project slug syntax and project Markdown paths.
 *
 * Every writer of `src/data/projects/*.md` — the authoring API normalizer, the
 * shared `.featured-repos.local.json` validator, the selection updater, the
 * content store, and the generator — must resolve its destination through this
 * module. A hostile `overrides.slug` previously escaped the projects directory
 * because each sink joined the slug itself. See docs/DECISIONS.md,
 * "Project Slug Containment and Sandboxed Generation".
 */

export const PROJECT_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const MAX_PROJECT_SLUG_LENGTH = 160;
export const PROJECT_FILE_EXTENSION = '.md';

/** Resolved at call time so tests and tools can operate on a fixture tree. */
export function projectsDirectory(): string {
  return path.resolve(process.cwd(), 'src', 'data', 'projects');
}

function describeRejectedSlug(value: unknown): string {
  if (typeof value !== 'string') return typeof value;
  return JSON.stringify(value.slice(0, 60));
}

/**
 * Rejects every shape that could leave the projects directory: non-strings,
 * empty names, over-long names, NUL bytes, path separators, percent-encoded
 * separators, dot segments, absolute paths, and anything that is not kebab-case.
 */
export function assertProjectSlug(value: unknown, label = 'Project slug'): string {
  const rendered = describeRejectedSlug(value);

  if (typeof value !== 'string') {
    throw new Error(`${label} must be a string; received ${rendered}.`);
  }
  if (value.length === 0) {
    throw new Error(`${label} must not be empty.`);
  }
  if (value.length > MAX_PROJECT_SLUG_LENGTH) {
    throw new Error(
      `${label} must be at most ${MAX_PROJECT_SLUG_LENGTH} characters.`
    );
  }
  if (value.includes('\0')) {
    throw new Error(`${label} must not contain NUL bytes.`);
  }
  if (value.includes('/') || value.includes('\\')) {
    throw new Error(
      `${label} must not contain path separators; received ${rendered}.`
    );
  }
  if (value.includes('%')) {
    throw new Error(
      `${label} must not contain percent-encoded characters; received ${rendered}.`
    );
  }
  if (value.includes('.')) {
    throw new Error(
      `${label} must not contain dot segments; received ${rendered}.`
    );
  }
  if (path.isAbsolute(value)) {
    throw new Error(
      `${label} must not be an absolute path; received ${rendered}.`
    );
  }
  if (!PROJECT_SLUG_PATTERN.test(value)) {
    throw new Error(
      `${label} must be kebab-case (${PROJECT_SLUG_PATTERN.source}); received ${rendered}.`
    );
  }

  return value;
}

export function isProjectSlug(value: unknown): value is string {
  try {
    assertProjectSlug(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Resolves `<projects dir>/<slug>.md` and then requires the resolved parent to
 * be exactly the projects directory. The syntax check above already makes
 * traversal impossible; this containment assertion is the second, independent
 * gate so a future change to the pattern cannot silently reopen the escape.
 */
export function resolveProjectFilePath(slug: unknown, label?: string): string {
  const safeSlug = assertProjectSlug(slug, label);
  const directory = projectsDirectory();
  const filename = `${safeSlug}${PROJECT_FILE_EXTENSION}`;
  const resolved = path.resolve(directory, filename);

  if (
    path.dirname(resolved) !== directory ||
    path.basename(resolved) !== filename
  ) {
    throw new Error(
      `${label ?? 'Project slug'} resolved outside ${directory}: ${resolved}`
    );
  }

  return resolved;
}

export function resolveProjectFilePathFromFilename(filename: unknown): string {
  if (
    typeof filename !== 'string' ||
    !filename.endsWith(PROJECT_FILE_EXTENSION) ||
    filename.length === PROJECT_FILE_EXTENSION.length
  ) {
    throw new Error('Project filename must use kebab-case and end in .md.');
  }

  return resolveProjectFilePath(
    filename.slice(0, -PROJECT_FILE_EXTENSION.length),
    'Project filename'
  );
}

export type ProjectFileState = 'missing' | 'file';

/**
 * Rejects symbolic links for both existing and newly targeted files. A dangling
 * symlink is not "missing": `existsSync` reports false while a plain write would
 * follow the link and create the target outside the projects directory.
 */
export function assertSafeProjectFile(filePath: string): ProjectFileState {
  let stats: fs.Stats;
  try {
    stats = fs.lstatSync(filePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return 'missing';
    throw error;
  }

  if (stats.isSymbolicLink()) {
    throw new Error(`Refusing to use a symbolic link: ${filePath}`);
  }
  if (!stats.isFile()) {
    throw new Error(`Project path is not a regular file: ${filePath}`);
  }
  return 'file';
}

export function readProjectFile(filePath: string): string {
  if (assertSafeProjectFile(filePath) !== 'file') {
    throw new Error(`Project file does not exist: ${filePath}`);
  }
  return fs.readFileSync(filePath, 'utf8');
}

/** Atomic create-or-replace. `rename` replaces a link rather than following it. */
export function writeProjectFile(filePath: string, contents: string): void {
  assertSafeProjectFile(filePath);

  const temporary = `${filePath}.${randomUUID()}.tmp`;
  fs.writeFileSync(temporary, contents, {
    encoding: 'utf8',
    flag: 'wx',
    mode: 0o644,
  });

  try {
    fs.renameSync(temporary, filePath);
  } catch (error) {
    fs.rmSync(temporary, { force: true });
    throw error;
  }
}

/** Returns whether a file was actually removed, as reported by the removal. */
export function removeProjectFile(filePath: string): boolean {
  assertSafeProjectFile(filePath);

  try {
    fs.unlinkSync(filePath);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw error;
  }
}
