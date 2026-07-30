import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createProjectDocument } from './content-store';

const frontmatter = {
  id: 'proj-planted',
  slug: 'planted',
  title: 'Planted',
  type: 'project',
  order: 1,
  categoryId: 'cat-experience',
};

describe('project document creation safety', () => {
  const originalCwd = process.cwd();
  let fixture: string;
  let outsideFile: string;

  beforeEach(() => {
    fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'content-store-test-'));
    fs.mkdirSync(path.join(fixture, 'src', 'data', 'projects'), {
      recursive: true,
    });
    outsideFile = path.join(fixture, 'AGENTS.md');
    process.chdir(fixture);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    fs.rmSync(fixture, { recursive: true, force: true });
  });

  // Creation is the fifth project sink. A dangling link is the interesting case:
  // `existsSync` reports it as absent, so only the shared writer's `lstat` check
  // keeps the invariant that no project sink follows or replaces a symlink.
  it('refuses a planted symbolic link that existsSync reports as absent', async () => {
    const link = path.join(fixture, 'src', 'data', 'projects', 'planted.md');
    fs.symlinkSync(outsideFile, link);
    expect(fs.existsSync(link)).toBe(false);

    await expect(
      createProjectDocument('planted.md', { frontmatter, body: 'Body.' })
    ).rejects.toThrow('symbolic link');

    expect(fs.existsSync(outsideFile)).toBe(false);
    expect(fs.lstatSync(link).isSymbolicLink()).toBe(true);
  });

  it('refuses a planted symbolic link to an existing file', async () => {
    fs.writeFileSync(outsideFile, 'untouched instructions\n');
    const link = path.join(fixture, 'src', 'data', 'projects', 'planted.md');
    fs.symlinkSync(outsideFile, link);

    await expect(
      createProjectDocument('planted.md', { frontmatter, body: 'Body.' })
    ).rejects.toThrow(/already exists|symbolic link/);

    expect(fs.readFileSync(outsideFile, 'utf8')).toBe(
      'untouched instructions\n'
    );
  });
});
