'use client';

import dynamic from 'next/dynamic';
import type { SceneNode } from '@/content/content-types';
import { useMediaQuery } from '@/components/three/helpers/useMediaQuery';

const SceneCanvas = dynamic(() => import('@/components/three/SceneCanvas'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-gray-500">
      Loading scene...
    </div>
  ),
});

interface SolarSystemSectionProps {
  sceneGraph: SceneNode;
}

export default function SolarSystemSection({ sceneGraph }: SolarSystemSectionProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const isMobile = isDesktop === false;

  // SSR/hydration: show placeholder until media query resolves (Gap 13)
  if (isDesktop === null) {
    return (
      <section className="relative h-[50vh] min-h-[300px] w-full md:h-[70vh] md:min-h-[400px]" />
    );
  }

  return (
    <section className="relative h-[50vh] min-h-[300px] w-full md:h-[70vh] md:min-h-[400px]">
      <SceneCanvas sceneGraph={sceneGraph} isMobile={isMobile} />
    </section>
  );
}
