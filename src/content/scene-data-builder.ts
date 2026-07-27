import type {
  CategoryFrontmatter,
  ContentItem,
  IntroFrontmatter,
  OrbitMetadata,
  ProjectsPageFrontmatter,
  ProjectFrontmatter,
  SceneNode,
} from './content-types';
import { getCategories, getIntro, getProjects, getProjectsPage } from './content-loader';

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
    destination: 'home',
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
    destination: 'project',
    route: `/projects/${fm.slug}`,
    orbit: resolveOrbit(fm.orbit, index, {
      orbitRadius: 2 + index * 1.2,
      orbitSpeed: 0.12,
      size: 0.4,
    }),
    children: [],
  };
}

function buildResumePlanetNode(
  category: ContentItem<CategoryFrontmatter>,
  index: number
): SceneNode {
  const fm = category.frontmatter;
  return {
    id: fm.id,
    slug: fm.slug,
    label: fm.title,
    description: fm.description,
    type: 'planet',
    destination: 'resume-section',
    route: `/resume#${fm.slug}`,
    orbit: resolveOrbit(fm.orbit, index),
    children: [],
  };
}

function buildProjectsPlanetNode(
  page: ContentItem<ProjectsPageFrontmatter>,
  projects: ContentItem<ProjectFrontmatter>[],
  index: number
): SceneNode {
  const fm = page.frontmatter;
  return {
    id: fm.id,
    slug: fm.slug,
    label: fm.title,
    description: fm.description,
    type: 'planet',
    destination: 'projects-index',
    route: '/projects',
    orbit: resolveOrbit(fm.orbit, index),
    children: projects.map((project, projectIndex) =>
      buildMoonNode(project, projectIndex)
    ),
  };
}

/** Build the full scene graph from content data */
export async function buildSceneGraph(): Promise<SceneNode> {
  const [intro, categories, projectsPage, projects] = await Promise.all([
    getIntro(),
    getCategories(),
    getProjectsPage(),
    getProjects(),
  ]);

  const sun = buildSunNode(intro);

  categories.forEach((category, index) => {
    sun.children.push(buildResumePlanetNode(category, index));
  });

  sun.children.push(
    buildProjectsPlanetNode(projectsPage, projects, categories.length)
  );

  return sun;
}
