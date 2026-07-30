import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import remarkHtml from 'remark-html';
import { resolveSitePath } from '../utils/site-url';
import type {
  BaseFrontmatter,
  CategoryFrontmatter,
  ContactFrontmatter,
  ContentItem,
  IntroFrontmatter,
  NavData,
  PageFrontmatter,
  ProjectFrontmatter,
  ProjectsPageFrontmatter,
} from './content-types';

const DATA_DIR = path.join(process.cwd(), 'src', 'data');

/** Map content-managed local asset paths to deployment-safe URLs */
function resolveContentAssetPaths<T extends BaseFrontmatter>(
  item: ContentItem<T>
): ContentItem<T> {
  const frontmatter = item.frontmatter;

  if (frontmatter.type === 'intro') {
    const intro = frontmatter as T & IntroFrontmatter;
    if (!intro.photo) return item;

    return {
      ...item,
      frontmatter: {
        ...intro,
        photo: resolveSitePath(intro.photo, process.env.NEXT_PUBLIC_BASE_PATH),
      },
    };
  }

  if (frontmatter.type === 'project') {
    const project = frontmatter as T & ProjectFrontmatter;
    if (!project.image) return item;

    return {
      ...item,
      frontmatter: {
        ...project,
        image: resolveSitePath(project.image, process.env.NEXT_PUBLIC_BASE_PATH),
      },
    };
  }

  return item;
}

interface MarkdownUrlNode {
  type?: string;
  url?: string;
  children?: MarkdownUrlNode[];
}

function rewriteMarkdownUrls(
  node: MarkdownUrlNode,
  basePath: string | undefined
): void {
  if (
    (node.type === 'link' || node.type === 'image') &&
    typeof node.url === 'string'
  ) {
    node.url = resolveSitePath(node.url, basePath);
  }

  node.children?.forEach((child) => rewriteMarkdownUrls(child, basePath));
}

function deploymentSafeMarkdownPlugin(options?: { basePath?: string }) {
  return (tree: MarkdownUrlNode) => {
    rewriteMarkdownUrls(tree, options?.basePath);
  };
}

/** Render Markdown while making root-relative links safe for subpath hosting. */
export async function renderMarkdown(
  content: string,
  basePath: string | undefined = process.env.NEXT_PUBLIC_BASE_PATH
): Promise<string> {
  const result = await remark()
    .use(deploymentSafeMarkdownPlugin, { basePath })
    .use(remarkHtml)
    .process(content);

  return result.toString();
}

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

  return {
    frontmatter: data as T,
    body: await renderMarkdown(content),
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
    .sort((a, b) => a.frontmatter.order - b.frontmatter.order)
    .map((item) => resolveContentAssetPaths(item as ContentItem<T>));
}

/** Get a single content item by slug */
export async function getContentBySlug<T extends BaseFrontmatter>(
  slug: string
): Promise<ContentItem<T> | undefined> {
  const all = await getAllContent();
  const item = all.find((candidate) => candidate.frontmatter.slug === slug) as
    | ContentItem<T>
    | undefined;

  return item ? resolveContentAssetPaths(item) : undefined;
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
    getContactPage(),
  ]);

  return {
    siteTitle: intro.frontmatter.title,
    contactLabel: contactPage.frontmatter.title,
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

/** Get the required structured contact page */
export async function getContactPage(): Promise<ContentItem<ContactFrontmatter>> {
  const page = await getContentBySlug<ContactFrontmatter>('contact');
  if (!page) {
    throw new Error('Required contact page not found in src/data/pages/');
  }
  return page;
}

/** Get the required structured Projects index page */
export async function getProjectsPage(): Promise<ContentItem<ProjectsPageFrontmatter>> {
  const page = await getContentBySlug<ProjectsPageFrontmatter>('projects');
  if (!page) {
    throw new Error('Required Projects page not found in src/data/pages/');
  }
  return page;
}
