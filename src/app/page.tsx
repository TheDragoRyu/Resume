import { getIntro } from '@/content/content-loader';
import { buildSceneGraph } from '@/content/scene-data-builder';
import HeroSection from '@/sections/landing/HeroSection';
import SolarSystemSection from '@/sections/landing/SolarSystemSection';

export default async function HomePage() {
  const intro = await getIntro();
  const sceneGraph = await buildSceneGraph();

  return (
    <>
      <HeroSection
        name={intro.frontmatter.title}
        role={intro.frontmatter.role || 'Software Engineer'}
        description={intro.frontmatter.description || ''}
      />
      <SolarSystemSection sceneGraph={sceneGraph} />
    </>
  );
}
