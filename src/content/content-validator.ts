import fs from 'fs';
import path from 'path';
import type { BaseFrontmatter, IntroFrontmatter, ProjectFrontmatter } from './content-types';
import type { ContentItem } from './content-types';

export interface ValidationError {
  file: string;
  message: string;
}

const REQUIRED_BASE_FIELDS: (keyof BaseFrontmatter)[] = [
  'id',
  'slug',
  'title',
  'type',
  'order',
];

const VALID_TYPES = ['intro', 'category', 'project', 'page'];
const KEBAB_CASE_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ALLOWED_IMAGE_EXTENSIONS = new Set(['.avif', '.jpeg', '.jpg', '.png', '.webp']);

export function validateContent(items: ContentItem[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const slugs = new Map<string, string>();
  const ids = new Map<string, string>();
  const categoryIds = new Set<string>();

  // First pass: collect category IDs
  for (const item of items) {
    if (item.frontmatter.type === 'category') {
      categoryIds.add(item.frontmatter.id);
    }
  }

  // Second pass: validate each item
  for (const item of items) {
    const fm = item.frontmatter;
    const label = `[${fm.slug || fm.id || 'unknown'}]`;

    // Check required fields
    for (const field of REQUIRED_BASE_FIELDS) {
      if (fm[field] === undefined || fm[field] === null || fm[field] === '') {
        errors.push({
          file: label,
          message: `Missing required field: "${field}"`,
        });
      }
    }

    if (fm.slug && !KEBAB_CASE_PATTERN.test(fm.slug)) {
      errors.push({
        file: label,
        message: 'Slug must use lowercase kebab-case.',
      });
    }

    if (fm.id && !KEBAB_CASE_PATTERN.test(fm.id)) {
      errors.push({
        file: label,
        message: 'ID must use lowercase kebab-case.',
      });
    }

    if (fm.order !== undefined && (!Number.isInteger(fm.order) || fm.order < 0)) {
      errors.push({
        file: label,
        message: 'Order must be a non-negative integer.',
      });
    }

    // Check valid type
    if (fm.type && !VALID_TYPES.includes(fm.type)) {
      errors.push({
        file: label,
        message: `Invalid type: "${fm.type}". Must be one of: ${VALID_TYPES.join(', ')}`,
      });
    }

    // Check duplicate slugs
    if (fm.slug) {
      if (slugs.has(fm.slug)) {
        errors.push({
          file: label,
          message: `Duplicate slug: "${fm.slug}" (also used by ${slugs.get(fm.slug)})`,
        });
      } else {
        slugs.set(fm.slug, label);
      }
    }

    // Check duplicate IDs
    if (fm.id) {
      if (ids.has(fm.id)) {
        errors.push({
          file: label,
          message: `Duplicate id: "${fm.id}" (also used by ${ids.get(fm.id)})`,
        });
      } else {
        ids.set(fm.id, label);
      }
    }

    // Check project-specific fields
    if (fm.type === 'project') {
      const projectFm = fm as ProjectFrontmatter;
      if (!projectFm.categoryId) {
        errors.push({
          file: label,
          message: 'Project is missing required field: "categoryId"',
        });
      } else if (!categoryIds.has(projectFm.categoryId)) {
        errors.push({
          file: label,
          message: `Project references unknown categoryId: "${projectFm.categoryId}"`,
        });
      }

      if (projectFm.image) {
        validateImageReference(projectFm.image, 'image', label, errors);
        if (!projectFm.imageAlt?.trim()) {
          errors.push({
            file: label,
            message: 'Project cover images require a non-empty "imageAlt" description.',
          });
        }
      }
    }

    if (fm.type === 'intro') {
      const introFm = fm as IntroFrontmatter;
      if (introFm.photo) validateImageReference(introFm.photo, 'photo', label, errors);
    }
  }

  return errors;
}

function validateImageReference(
  value: string,
  field: string,
  label: string,
  errors: ValidationError[]
): void {
  if (
    !value.startsWith('/images/') ||
    value.includes('..') ||
    value.includes('\\')
  ) {
    errors.push({
      file: label,
      message: `"${field}" must reference a local file under /images/.`,
    });
    return;
  }

  const extension = path.extname(value).toLowerCase();
  if (!ALLOWED_IMAGE_EXTENSIONS.has(extension)) {
    errors.push({
      file: label,
      message: `"${field}" must use AVIF, JPEG, PNG, or WebP.`,
    });
    return;
  }

  const filePath = path.resolve(process.cwd(), 'public', `.${value}`);
  if (!fs.existsSync(filePath)) {
    errors.push({
      file: label,
      message: `"${field}" references a missing file: ${value}`,
    });
  }
}
