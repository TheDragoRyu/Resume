import type { BaseFrontmatter, ProjectFrontmatter } from './content-types';
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
    }
  }

  return errors;
}
