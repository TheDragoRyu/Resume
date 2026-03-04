import type {
  CategoryFrontmatter,
  ContentItem,
  IntroFrontmatter,
  OrbitMetadata,
  ProjectFrontmatter,
  SceneNode,
} from './content-types';
import { getCategories, getIntro, getProjectsByCategory } from './content-loader';

const DEFAULT_ORBIT: Required<OrbitMetadata> = {
  orbitRadius: 8,
  orbitSpeed: 0.05,
  size: 1.0,
  color: '#888888',
};

function resolveOrbit(
  partial: OrbitMetadata | undefined,
  index: number,
  defaults: Partial<Required<OrbitMetadata>> = {}
): Required<OrbitMetadata> {
  return {
    orbitRadius: partial?.orbitRadius ?? defaults.orbitRadius ?? 4 + index * 4,
    orbitSpeed: partial?.orbitSpeed ?? defaults.orbitSpeed ?? 0.08 - index * 0.01,
    size: partial?.size ?? defaults.size ?? 1.0,
    color: partial?.color ?? defaults.color ?? DEFAULT_ORBIT.color,
  };
}

function buildSunNode(intro: ContentItem<IntroFrontmatter>): SceneNode {
  const fm = intro.frontmatter;
  const desc = fm.description
    ? `${fm.description} · Navigate to learn more or get in touch.`
    : 'Navigate to learn more or get in touch.';
  return {
    id: fm.id,
    slug: fm.slug,
    label: fm.title,
    description: desc,
    type: 'sun',
    route: '/',
    orbit: {
      orbitRadius: 0,
      orbitSpeed: 0,
      size: fm.orbit?.size ?? 2.0,
      color: fm.orbit?.color ?? '#fbbf24',
    },
    children: [],
  };
}

function buildMoonNode(
  project: ContentItem<ProjectFrontmatter>,
  index: number
): SceneNode {
  const fm = project.frontmatter;
  return {
    id: fm.id,
    slug: fm.slug,
    label: fm.title,
    description: fm.description,
    type: 'moon',
    route: `/projects/${fm.slug}`,
    orbit: resolveOrbit(fm.orbit, index, {
      orbitRadius: 2 + index * 1.2,
      orbitSpeed: 0.12,
      size: 0.4,
    }),
    children: [],
  };
}

function buildPlanetNode(
  category: ContentItem<CategoryFrontmatter>,
  projects: ContentItem<ProjectFrontmatter>[],
  index: number
): SceneNode {
  const fm = category.frontmatter;
  return {
    id: fm.id,
    slug: fm.slug,
    label: fm.title,
    description: fm.description,
    type: 'planet',
    route: `/resume#${fm.slug}`,
    orbit: resolveOrbit(fm.orbit, index),
    children: projects.map((p, i) => buildMoonNode(p, i)),
  };
}

/** Build the full scene graph from content data */
export async function buildSceneGraph(): Promise<SceneNode> {
  const intro = await getIntro();
  const categories = await getCategories();

  const sun = buildSunNode(intro);

  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i];
    const projects = await getProjectsByCategory(cat.frontmatter.id);
    sun.children.push(buildPlanetNode(cat, projects, i));
  }

  return sun;
}
