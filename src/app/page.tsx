import type { Metadata } from 'next';
import { getIntro } from '@/content/content-loader';
import { buildSceneGraph } from '@/content/scene-data-builder';
import LandingExperience from '@/sections/landing/LandingExperience';

export async function generateMetadata(): Promise<Metadata> {
  const intro = await getIntro();
  return {
    title: `${intro.frontmatter.title} | ${intro.frontmatter.role || 'Software Engineer'}`,
    description: intro.frontmatter.description || 'Software engineer portfolio.',
  };
}

export default async function HomePage() {
  const intro = await getIntro();
  const sceneGraph = await buildSceneGraph();

  return (
    <LandingExperience
      name={intro.frontmatter.title}
      role={intro.frontmatter.role || 'Software Engineer'}
      description={intro.frontmatter.description || ''}
      sceneGraph={sceneGraph}
    />
  );
}
