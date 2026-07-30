import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { getAllContent } from '../../src/content/content-loader';
import {
  validateContent,
  type ValidationError,
} from '../../src/content/content-validator';
import { resolveProjectFilePathFromFilename } from '../project-paths';

const DATA_DIR = path.resolve(process.cwd(), 'src', 'data');
const PROJECTS_DIR = path.join(DATA_DIR, 'projects');
const MEDIA_DIR = path.resolve(process.cwd(), 'public', 'images');
const TRASH_DIR = path.resolve(process.cwd(), '.project-admin-trash');
const MAX_BODY_BYTES = 512 * 1024;
const MAX_FRONTMATTER_BYTES = 128 * 1024;

export interface ContentDocument {
  path: string;
  frontmatter: Record<string, unknown>;
  body: string;
  canDelete: boolean;
}

export interface SaveContentInput {
  path: string;
  frontmatter: Record<string, unknown>;
  body: string;
}

function findMarkdownFiles(directory: string): string[] {
  const files: string[] = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...findMarkdownFiles(absolute));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(absolute);
    }
  }
  return files;
}

function relativeContentPath(absolutePath: string): string {
  return path.relative(process.cwd(), absolutePath).split(path.sep).join('/');
}

function resolveContentPath(relativePath: string): string {
  if (
    !relativePath.startsWith('src/data/') ||
    !relativePath.endsWith('.md') ||
    relativePath.includes('\\') ||
    relativePath.includes('\0')
  ) {
    throw new Error('Invalid content path.');
  }

  const absolute = path.resolve(process.cwd(), relativePath);
  if (!absolute.startsWith(`${DATA_DIR}${path.sep}`)) {
    throw new Error('Content path escapes src/data.');
  }
  return absolute;
}

function rejectUnsafeObject(value: unknown, depth = 0): void {
  if (depth > 12) throw new Error('Frontmatter is nested too deeply.');
  if (!value || typeof value !== 'object') return;

  for (const [key, child] of Object.entries(value)) {
    if (['__proto__', 'prototype', 'constructor'].includes(key)) {
      throw new Error(`Unsafe frontmatter key: ${key}`);
    }
    rejectUnsafeObject(child, depth + 1);
  }
}

function validateInput(input: SaveContentInput): void {
  if (!input.frontmatter || Array.isArray(input.frontmatter)) {
    throw new Error('Frontmatter must be an object.');
  }
  if (typeof input.body !== 'string') {
    throw new Error('Markdown body must be a string.');
  }
  if (Buffer.byteLength(input.body, 'utf8') > MAX_BODY_BYTES) {
    throw new Error('Markdown body exceeds the 512 KiB limit.');
  }
  if (
    Buffer.byteLength(JSON.stringify(input.frontmatter), 'utf8') >
    MAX_FRONTMATTER_BYTES
  ) {
    throw new Error('Frontmatter exceeds the 128 KiB limit.');
  }
  rejectUnsafeObject(input.frontmatter);
}

function serialize(input: SaveContentInput): string {
  const normalizedBody = input.body
    ? `${input.body.replace(/\s+$/u, '')}\n`
    : '';
  return matter.stringify(normalizedBody, input.frontmatter);
}

function writeAtomic(destination: string, contents: string): void {
  const temporary = `${destination}.${randomUUID()}.tmp`;
  fs.writeFileSync(temporary, contents, {
    encoding: 'utf8',
    flag: 'wx',
    mode: 0o644,
  });
  fs.renameSync(temporary, destination);
}

async function currentValidationErrors(): Promise<ValidationError[]> {
  return validateContent(await getAllContent());
}

export function listContentDocuments(): ContentDocument[] {
  return findMarkdownFiles(DATA_DIR)
    .sort()
    .map((absolutePath) => {
      if (fs.lstatSync(absolutePath).isSymbolicLink()) {
        throw new Error(`Symbolic links are not allowed: ${absolutePath}`);
      }
      const parsed = matter(fs.readFileSync(absolutePath, 'utf8'));
      return {
        path: relativeContentPath(absolutePath),
        frontmatter: parsed.data as Record<string, unknown>,
        body: parsed.content,
        canDelete: absolutePath.startsWith(`${PROJECTS_DIR}${path.sep}`),
      };
    });
}

export async function saveContentDocument(
  input: SaveContentInput
): Promise<void> {
  validateInput(input);
  const destination = resolveContentPath(input.path);
  if (!fs.existsSync(destination) || !fs.statSync(destination).isFile()) {
    throw new Error('Content file does not exist.');
  }
  if (fs.lstatSync(destination).isSymbolicLink()) {
    throw new Error('Symbolic links cannot be edited.');
  }

  const previous = fs.readFileSync(destination, 'utf8');
  writeAtomic(destination, serialize(input));
  const errors = await currentValidationErrors();
  if (errors.length > 0) {
    writeAtomic(destination, previous);
    throw new Error(
      `Content validation failed: ${errors
        .slice(0, 8)
        .map((error) => `${error.file} ${error.message}`)
        .join('; ')}`
    );
  }
}

export async function createProjectDocument(
  filename: string,
  input: Omit<SaveContentInput, 'path'>
): Promise<string> {
  // Shared slug/containment rules; see scripts/project-paths.ts.
  const destination = resolveProjectFilePathFromFilename(filename);
  const relativePath = relativeContentPath(destination);
  if (fs.existsSync(destination)) {
    throw new Error('A project with this filename already exists.');
  }

  validateInput({ ...input, path: relativePath });
  writeAtomic(destination, serialize({ ...input, path: relativePath }));
  const errors = await currentValidationErrors();
  if (errors.length > 0) {
    fs.unlinkSync(destination);
    throw new Error(
      `Content validation failed: ${errors
        .slice(0, 8)
        .map((error) => `${error.file} ${error.message}`)
        .join('; ')}`
    );
  }
  return relativePath;
}

export async function deleteProjectDocument(relativePath: string): Promise<void> {
  const destination = resolveContentPath(relativePath);
  if (!destination.startsWith(`${PROJECTS_DIR}${path.sep}`)) {
    throw new Error('Only project documents can be deleted.');
  }
  if (!fs.existsSync(destination) || fs.lstatSync(destination).isSymbolicLink()) {
    throw new Error('Project document does not exist or is unsafe.');
  }

  fs.mkdirSync(TRASH_DIR, { recursive: true, mode: 0o700 });
  const trashPath = path.join(
    TRASH_DIR,
    `${Date.now()}-${path.basename(destination)}`
  );
  fs.renameSync(destination, trashPath);

  const errors = await currentValidationErrors();
  if (errors.length > 0) {
    fs.renameSync(trashPath, destination);
    throw new Error(
      `Deletion would invalidate content: ${errors
        .slice(0, 8)
        .map((error) => `${error.file} ${error.message}`)
        .join('; ')}`
    );
  }
}

export interface MediaFile {
  name: string;
  path: string;
}

export function listMediaFiles(): MediaFile[] {
  if (!fs.existsSync(MEDIA_DIR)) return [];
  return fs
    .readdirSync(MEDIA_DIR, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => ({
      name: entry.name,
      path: `/images/${entry.name}`,
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

const MEDIA_SIGNATURES: Record<string, (buffer: Buffer) => boolean> = {
  '.png': (buffer) =>
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex')),
  '.jpg': (buffer) => buffer.length >= 3 && buffer.subarray(0, 3).equals(Buffer.from('ffd8ff', 'hex')),
  '.jpeg': (buffer) => buffer.length >= 3 && buffer.subarray(0, 3).equals(Buffer.from('ffd8ff', 'hex')),
  '.webp': (buffer) =>
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP',
  '.avif': (buffer) =>
    buffer.length >= 12 && buffer.subarray(4, 12).toString('ascii').includes('ftyp'),
};

export async function deleteMediaFile(publicPath: string): Promise<void> {
  if (
    !publicPath.startsWith('/images/') ||
    publicPath.includes('..') ||
    publicPath.includes('\\')
  ) {
    throw new Error('Invalid media path.');
  }
  const filename = publicPath.slice('/images/'.length);
  if (!filename || filename !== path.basename(filename)) {
    throw new Error('Invalid media filename.');
  }

  const destination = path.join(MEDIA_DIR, filename);
  if (!fs.existsSync(destination) || fs.lstatSync(destination).isSymbolicLink()) {
    throw new Error('Media file does not exist or is unsafe.');
  }

  fs.mkdirSync(TRASH_DIR, { recursive: true, mode: 0o700 });
  const trashPath = path.join(
    TRASH_DIR,
    `${Date.now()}-media-${filename}`
  );
  fs.renameSync(destination, trashPath);

  const errors = await currentValidationErrors();
  if (errors.length > 0) {
    fs.renameSync(trashPath, destination);
    throw new Error(
      `Media is still referenced: ${errors
        .slice(0, 8)
        .map((error) => `${error.file} ${error.message}`)
        .join('; ')}`
    );
  }
}

export function saveMediaFile(filename: string, base64: string): MediaFile {
  const safeName = filename
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const extension = path.extname(safeName);
  const signature = MEDIA_SIGNATURES[extension];
  if (!safeName || !signature || safeName.includes('..')) {
    throw new Error('Unsupported or unsafe image filename.');
  }

  const buffer = Buffer.from(base64, 'base64');
  if (buffer.length === 0 || buffer.length > 10 * 1024 * 1024) {
    throw new Error('Image must be between 1 byte and 10 MiB.');
  }
  if (!signature(buffer)) {
    throw new Error('Image contents do not match the filename extension.');
  }

  fs.mkdirSync(MEDIA_DIR, { recursive: true });
  let destination = path.join(MEDIA_DIR, safeName);
  if (fs.existsSync(destination)) {
    const stem = path.basename(safeName, extension);
    destination = path.join(MEDIA_DIR, `${stem}-${Date.now()}${extension}`);
  }
  fs.writeFileSync(destination, buffer, { flag: 'wx', mode: 0o644 });

  return {
    name: path.basename(destination),
    path: `/images/${path.basename(destination)}`,
  };
}
