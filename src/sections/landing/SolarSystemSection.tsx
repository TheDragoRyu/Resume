'use client';

import dynamic from 'next/dynamic';
import type { SceneNode } from '@/content/content-types';

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
  return (
    <section
      className="relative hidden h-[60vh] min-h-[400px] w-full md:block md:h-[70vh]"
      aria-hidden="true"
    >
      <SceneCanvas sceneGraph={sceneGraph} />
    </section>
  );
}
