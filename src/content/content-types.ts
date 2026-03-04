/** Base frontmatter fields required by all content files */
export interface BaseFrontmatter {
  id: string;
  slug: string;
  title: string;
  type: 'intro' | 'category' | 'project' | 'page';
  order: number;
  description?: string;
}

/** Orbit metadata for 3D scene positioning */
export interface OrbitMetadata {
  orbitRadius?: number;
  orbitSpeed?: number;
  size?: number;
  color?: string;
}

/** Frontmatter for the intro/landing content */
export interface IntroFrontmatter extends BaseFrontmatter {
  type: 'intro';
  role?: string;
  photo?: string;
  orbit?: OrbitMetadata;
}

/** Frontmatter for resume category sections (Experience, Skills, Education) */
export interface CategoryFrontmatter extends BaseFrontmatter {
  type: 'category';
  icon?: string;
  orbit?: OrbitMetadata;
}

/** Frontmatter for individual projects */
export interface ProjectFrontmatter extends BaseFrontmatter {
  type: 'project';
  categoryId: string;
  tags?: string[];
  featured?: boolean;
  links?: {
    github?: string;
    demo?: string;
    writeup?: string;
  };
  orbit?: OrbitMetadata;
}

/** Frontmatter for standalone pages (contact, etc.) */
export interface PageFrontmatter extends BaseFrontmatter {
  type: 'page';
}

/** Union of all frontmatter types */
export type ContentFrontmatter =
  | IntroFrontmatter
  | CategoryFrontmatter
  | ProjectFrontmatter
  | PageFrontmatter;

/** A parsed content item with frontmatter and rendered HTML body */
export interface ContentItem<T extends BaseFrontmatter = BaseFrontmatter> {
  frontmatter: T;
  body: string;
  rawContent: string;
}

/** A sub-navigation item for the header */
export interface NavSubItem {
  href: string;
  label: string;
}

/** Navigation data with sub-items for Resume and Projects */
export interface NavData {
  siteTitle: string;
  contactLabel: string;
  resumeSections: NavSubItem[];
  projects: NavSubItem[];
}

/** A node in the 3D scene graph */
export interface SceneNode {
  id: string;
  slug: string;
  label: string;
  description?: string;
  type: 'sun' | 'planet' | 'moon';
  route: string;
  orbit: Required<OrbitMetadata>;
  children: SceneNode[];
}
