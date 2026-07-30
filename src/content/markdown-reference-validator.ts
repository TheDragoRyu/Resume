import fs from 'fs';
import path from 'path';
import { remark } from 'remark';
import { normalizeBasePath } from '../utils/site-url';
import type { ContentItem } from './content-types';
import type { ValidationError } from './content-validator';

const ALLOWED_IMAGE_EXTENSIONS = new Set([
  '.avif',
  '.jpeg',
  '.jpg',
  '.png',
  '.webp',
]);

interface MarkdownUrlNode {
  type?: string;
  url?: string;
  children?: MarkdownUrlNode[];
}

export function validateMarkdownReferences(
  item: ContentItem,
  label: string,
  internalRoutes: Set<string>,
  resumeAnchors: Set<string>,
  errors: ValidationError[]
): void {
  const tree = remark().parse(item.rawContent) as MarkdownUrlNode;

  visitMarkdownUrls(tree, (node) => {
    if (!node.url) return;

    if (node.type === 'image') {
      validateMarkdownImage(node.url, label, errors);
      return;
    }

    validateMarkdownLink(
      node.url,
      label,
      internalRoutes,
      resumeAnchors,
      errors
    );
  });
}

function visitMarkdownUrls(
  node: MarkdownUrlNode,
  visitor: (node: MarkdownUrlNode) => void
): void {
  if (node.type === 'link' || node.type === 'image') visitor(node);
  node.children?.forEach((child) => visitMarkdownUrls(child, visitor));
}

function validateMarkdownLink(
  value: string,
  label: string,
  internalRoutes: Set<string>,
  resumeAnchors: Set<string>,
  errors: ValidationError[]
): void {
  if (value.startsWith('#')) return;

  if (value.startsWith('//')) {
    errors.push({
      file: label,
      message: `Markdown link must use an explicit HTTPS URL: ${value}`,
    });
    return;
  }

  const scheme = value.match(/^([a-z][a-z\d+.-]*):/i)?.[1]?.toLowerCase();
  if (scheme) {
    if (!['http', 'https', 'mailto', 'tel'].includes(scheme)) {
      errors.push({
        file: label,
        message: `Markdown link uses an unsupported URL scheme: ${value}`,
      });
    }
    return;
  }

  if (!value.startsWith('/')) {
    errors.push({
      file: label,
      message: `Internal Markdown links must be root-relative: ${value}`,
    });
    return;
  }

  const configuredBasePath = normalizeBasePath(
    process.env.NEXT_PUBLIC_BASE_PATH
  );
  if (
    configuredBasePath &&
    (value === configuredBasePath ||
      value.startsWith(`${configuredBasePath}/`) ||
      value.startsWith(`${configuredBasePath}?`) ||
      value.startsWith(`${configuredBasePath}#`))
  ) {
    errors.push({
      file: label,
      message: `Markdown links must not include the deployment base path: ${value}`,
    });
    return;
  }

  const [pathAndQuery, fragment] = value.split('#', 2);
  const route = pathAndQuery.split('?', 1)[0].replace(/\/+$/, '') || '/';

  if (!internalRoutes.has(route)) {
    errors.push({
      file: label,
      message: `Markdown link references an unknown internal route: ${value}`,
    });
    return;
  }

  if (route === '/resume' && fragment && !resumeAnchors.has(fragment)) {
    errors.push({
      file: label,
      message: `Markdown link references an unknown Resume section: ${value}`,
    });
  }
}

function validateMarkdownImage(
  value: string,
  label: string,
  errors: ValidationError[]
): void {
  if (/^https?:\/\//i.test(value)) return;

  if (
    !value.startsWith('/images/') ||
    value.includes('..') ||
    value.includes('\\')
  ) {
    errors.push({
      file: label,
      message: `Markdown image must reference a local file under /images/: ${value}`,
    });
    return;
  }

  const extension = path.extname(value).toLowerCase();
  if (!ALLOWED_IMAGE_EXTENSIONS.has(extension)) {
    errors.push({
      file: label,
      message: `Markdown image must use AVIF, JPEG, PNG, or WebP: ${value}`,
    });
    return;
  }

  const filePath = path.resolve(process.cwd(), 'public', `.${value}`);
  if (!fs.existsSync(filePath)) {
    errors.push({
      file: label,
      message: `Markdown image references a missing file: ${value}`,
    });
  }
}
