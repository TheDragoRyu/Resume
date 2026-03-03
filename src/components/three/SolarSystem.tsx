'use client';

import Sun from './Sun';
import Planet from './Planet';
import Starfield from './Starfield';
import CameraController from './CameraController';
import type { SceneNode } from '@/content/content-types';

interface SolarSystemProps {
  sceneGraph: SceneNode;
  selectedId: string | null;
  onSelect: (node: SceneNode) => void;
  reducedMotion: boolean;
  performanceMode?: boolean;
}

export default function SolarSystem({
  sceneGraph,
  selectedId,
  onSelect,
  reducedMotion,
  performanceMode = false,
}: SolarSystemProps) {
  return (
    <>
      <ambientLight intensity={0.15} />
      <CameraController />

      <Starfield
        reducedMotion={reducedMotion}
        performanceMode={performanceMode}
      />

      {/* Sun */}
      <Sun
        size={sceneGraph.orbit.size}
        color={sceneGraph.orbit.color}
        label={sceneGraph.label}
        selected={selectedId === sceneGraph.id}
        onSelect={() => onSelect(sceneGraph)}
      />

      {/* Planets */}
      {sceneGraph.children.map((planet, i) => (
        <Planet
          key={planet.id}
          node={planet}
          reducedMotion={reducedMotion}
          selected={selectedId === planet.id}
          selectedId={selectedId}
          onSelect={onSelect}
          index={i}
        />
      ))}
    </>
  );
}
