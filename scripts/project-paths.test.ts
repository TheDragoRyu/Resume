import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  assertProjectSlug,
  assertSafeProjectFile,
  isProjectSlug,
  projectsDirectory,
  removeProjectFile,
  resolveProjectFilePath,
  resolveProjectFilePathFromFilename,
  writeProjectFile,
} from './project-paths';

const UNSAFE_SLUGS: Array<[string, unknown]> = [
  ['a parent traversal', '../../../AGENTS'],
  ['a nested traversal', 'ok/../../../AGENTS'],
  ['a single dot segment', '.'],
  ['a double dot segment', '..'],
  ['a forward slash', 'projects/nested'],
  ['a backslash', 'projects\\nested'],
  ['an absolute path', '/etc/passwd'],
  ['a percent-encoded separator', '..%2f..%2fAGENTS'],
  ['a double percent-encoded separator', '%252e%252e%252fAGENTS'],
  ['a NUL byte', 'valid-slug\u0000.md'],
  ['a NUL-hidden traversal', 'valid\u0000/../../AGENTS'],
  ['an empty name', ''],
  ['a dotted filename', 'valid-slug.md'],
  ['a home-relative path', '~/notes'],
  ['upper case', 'Valid-Slug'],
  ['leading separator characters', '-leading'],
  ['trailing separator characters', 'trailing-'],
  ['whitespace', 'two words'],
  ['a non-string', 42],
  ['null', null],
  ['undefined', undefined],
  ['an over-long name', 'a'.repeat(161)],
];

describe('project slug validation', () => {
  it.each(UNSAFE_SLUGS)('rejects %s', (_label, value) => {
    expect(() => assertProjectSlug(value)).toThrow();
    expect(isProjectSlug(value)).toBe(false);
    expect(() => resolveProjectFilePath(value)).toThrow();
  });

  it('accepts kebab-case names', () => {
    for (const slug of ['a', 'a1', 'portfolio-site', 'go-particle-system']) {
      expect(assertProjectSlug(slug)).toBe(slug);
      expect(isProjectSlug(slug)).toBe(true);
    }
  });

  it('includes the caller label in the failure message', () => {
    expect(() =>
      assertProjectSlug('../escape', 'Slug for "owner/repo"')
    ).toThrow('Slug for "owner/repo"');
  });
});

describe('project path resolution', () => {
  it('keeps every resolved path directly inside the projects directory', () => {
    const resolved = resolveProjectFilePath('portfolio-site');
    expect(path.dirname(resolved)).toBe(projectsDirectory());
    expect(path.basename(resolved)).toBe('portfolio-site.md');
  });

  it('requires a kebab-case .md filename', () => {
    expect(resolveProjectFilePathFromFilename('portfolio-site.md')).toBe(
      path.join(projectsDirectory(), 'portfolio-site.md')
    );
    for (const filename of ['portfolio-site', '.md', '../../AGENTS.md', 'A.md']) {
      expect(() => resolveProjectFilePathFromFilename(filename)).toThrow();
    }
  });
});

describe('project file safety', () => {
  let fixture: string;

  beforeEach(() => {
    fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'project-paths-test-'));
  });

  afterEach(() => {
    fs.rmSync(fixture, { recursive: true, force: true });
  });

  it('reports a missing file without creating it', () => {
    const target = path.join(fixture, 'missing.md');
    expect(assertSafeProjectFile(target)).toBe('missing');
    expect(fs.existsSync(target)).toBe(false);
  });

  it('rejects an existing symbolic link', () => {
    const outside = path.join(fixture, 'outside.md');
    fs.writeFileSync(outside, 'original');
    const link = path.join(fixture, 'link.md');
    fs.symlinkSync(outside, link);

    expect(() => assertSafeProjectFile(link)).toThrow('symbolic link');
    expect(() => writeProjectFile(link, 'replaced')).toThrow('symbolic link');
    expect(fs.readFileSync(outside, 'utf8')).toBe('original');
  });

  it('rejects a dangling symbolic link that existsSync reports as absent', () => {
    const outside = path.join(fixture, 'never-created.md');
    const link = path.join(fixture, 'dangling.md');
    fs.symlinkSync(outside, link);

    expect(fs.existsSync(link)).toBe(false);
    expect(() => writeProjectFile(link, 'payload')).toThrow('symbolic link');
    expect(fs.existsSync(outside)).toBe(false);
  });

  it('rejects a directory in place of a project file', () => {
    const directory = path.join(fixture, 'directory.md');
    fs.mkdirSync(directory);
    expect(() => assertSafeProjectFile(directory)).toThrow('regular file');
  });

  it('reports whether a removal actually deleted a file', () => {
    const target = path.join(fixture, 'valid.md');
    writeProjectFile(target, 'contents');

    expect(removeProjectFile(target)).toBe(true);
    expect(removeProjectFile(target)).toBe(false);
    expect(fs.existsSync(target)).toBe(false);
  });

  it('refuses to remove a symbolic link', () => {
    const outside = path.join(fixture, 'outside.md');
    fs.writeFileSync(outside, 'original');
    const link = path.join(fixture, 'link.md');
    fs.symlinkSync(outside, link);

    expect(() => removeProjectFile(link)).toThrow('symbolic link');
    expect(fs.readFileSync(outside, 'utf8')).toBe('original');
    expect(fs.lstatSync(link).isSymbolicLink()).toBe(true);
  });

  it('replaces a regular file atomically and leaves no temporary files', () => {
    const target = path.join(fixture, 'valid.md');
    writeProjectFile(target, 'first');
    writeProjectFile(target, 'second');

    expect(fs.readFileSync(target, 'utf8')).toBe('second');
    expect(fs.readdirSync(fixture)).toEqual(['valid.md']);
  });
});
