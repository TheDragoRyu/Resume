'use client';

import dynamic from 'next/dynamic';
import type { SceneNode } from '@/content/content-types';

const SceneBackground = dynamic(
  () => import('@/components/three/SceneBackground'),
  {
    ssr: false,
    loading: () => null,
  },
);

interface SolarSystemSectionProps {
  sceneGraph: SceneNode;
}

export default function SolarSystemSection({ sceneGraph }: SolarSystemSectionProps) {
  return (
    <div aria-hidden="true" className="relative h-full w-full">
      <SceneBackground sceneGraph={sceneGraph} />
    </div>
  );
}
