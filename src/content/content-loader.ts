import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import remarkHtml from 'remark-html';
import type {
  BaseFrontmatter,
  CategoryFrontmatter,
  ContentItem,
  IntroFrontmatter,
  NavData,
  PageFrontmatter,
  ProjectFrontmatter,
} from './content-types';

const DATA_DIR = path.join(process.cwd(), 'src', 'data');

/** Recursively find all .md files under a directory */
function findMarkdownFiles(dir: string): string[] {
  const files: string[] = [];
  if (!fs.existsSync(dir)) return files;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findMarkdownFiles(fullPath));
    } else if (entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }
  return files;
}

/** Parse a single markdown file into a ContentItem */
async function parseMarkdownFile<T extends BaseFrontmatter>(
  filePath: string
): Promise<ContentItem<T>> {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);
  const result = await remark().use(remarkHtml).process(content);

  return {
    frontmatter: data as T,
    body: result.toString(),
    rawContent: content,
  };
}

/** Get all content items from all data directories */
export async function getAllContent(): Promise<ContentItem[]> {
  const files = findMarkdownFiles(DATA_DIR);
  return Promise.all(files.map((f) => parseMarkdownFile(f)));
}

/** Get content items filtered by type */
export async function getContentByType<T extends BaseFrontmatter>(
  type: T['type']
): Promise<ContentItem<T>[]> {
  const all = await getAllContent();
  return all
    .filter((item) => item.frontmatter.type === type)
    .sort((a, b) => a.frontmatter.order - b.frontmatter.order) as ContentItem<T>[];
}

/** Get a single content item by slug */
export async function getContentBySlug<T extends BaseFrontmatter>(
  slug: string
): Promise<ContentItem<T> | undefined> {
  const all = await getAllContent();
  return all.find((item) => item.frontmatter.slug === slug) as
    | ContentItem<T>
    | undefined;
}

/** Get the intro content */
export async function getIntro(): Promise<ContentItem<IntroFrontmatter>> {
  const items = await getContentByType<IntroFrontmatter>('intro');
  if (items.length === 0) {
    throw new Error('No intro content found in src/data/intro/');
  }
  return items[0];
}

/** Get all resume categories, sorted by order */
export async function getCategories(): Promise<ContentItem<CategoryFrontmatter>[]> {
  return getContentByType<CategoryFrontmatter>('category');
}

/** Get all projects, sorted by order */
export async function getProjects(): Promise<ContentItem<ProjectFrontmatter>[]> {
  return getContentByType<ProjectFrontmatter>('project');
}

/** Get projects belonging to a specific category */
export async function getProjectsByCategory(
  categoryId: string
): Promise<ContentItem<ProjectFrontmatter>[]> {
  const projects = await getProjects();
  return projects.filter((p) => p.frontmatter.categoryId === categoryId);
}

/** Get navigation data with sub-items for Resume and Projects */
export async function getNavData(): Promise<NavData> {
  const [intro, categories, projects, contactPage] = await Promise.all([
    getIntro(),
    getCategories(),
    getProjects(),
    getPage('contact'),
  ]);

  return {
    siteTitle: intro.frontmatter.title,
    contactLabel: contactPage?.frontmatter.title ?? 'Contact',
    resumeSections: categories.map((c) => ({
      href: `/resume#${c.frontmatter.slug}`,
      label: c.frontmatter.title,
    })),
    projects: projects.map((p) => ({
      href: `/projects/${p.frontmatter.slug}`,
      label: p.frontmatter.title,
    })),
  };
}

/** Get a standalone page by slug */
export async function getPage(
  slug: string
): Promise<ContentItem<PageFrontmatter> | undefined> {
  return getContentBySlug<PageFrontmatter>(slug);
}

/** Get a standalone page by slug, throwing if not found */
export async function getPageOrThrow(
  slug: string
): Promise<ContentItem<PageFrontmatter>> {
  const page = await getPage(slug);
  if (!page) {
    throw new Error(`Required page "${slug}" not found in src/data/pages/`);
  }
  return page;
}
