'use client';

import { useState } from 'react';
import { Html } from '@react-three/drei';
import { useOrbitPosition } from './helpers/useOrbitPosition';
import OrbitLine from './OrbitLine';
import Moon from './Moon';
import type { SceneNode } from '@/content/content-types';

interface PlanetProps {
  node: SceneNode;
  reducedMotion: boolean;
  selected: boolean;
  selectedId: string | null;
  onSelect: (node: SceneNode) => void;
  index: number;
}

export default function Planet({
  node,
  reducedMotion,
  selected,
  selectedId,
  onSelect,
  index,
}: PlanetProps) {
  const [hovered, setHovered] = useState(false);
  const groupRef = useOrbitPosition({
    radius: node.orbit.orbitRadius,
    speed: node.orbit.orbitSpeed,
    reducedMotion,
    initialAngle: (index * Math.PI * 2) / 3,
  });

  const scale = hovered || selected ? 1.08 : 1;

  return (
    <>
      <OrbitLine radius={node.orbit.orbitRadius} color={node.orbit.color} />
      <group ref={groupRef}>
        <mesh
          scale={scale}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(node);
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(true);
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            setHovered(false);
            document.body.style.cursor = 'auto';
          }}
        >
          <sphereGeometry args={[node.orbit.size, 24, 24]} />
          <meshStandardMaterial
            color={node.orbit.color}
            emissive={node.orbit.color}
            emissiveIntensity={hovered || selected ? 0.6 : 0.3}
          />
        </mesh>

        <Html
          position={[0, node.orbit.size + 0.8, 0]}
          center
          className="pointer-events-none select-none"
        >
          {hovered || selected ? (
            <div className="whitespace-nowrap rounded bg-surface-overlay/90 px-2 py-1 text-xs text-cyan-100 shadow-lg border border-accent/20">
              {node.label}
              {hovered && !selected && (
                <span className="ml-1 text-cyan-100/50">Click to open</span>
              )}
            </div>
          ) : (
            <div className="whitespace-nowrap text-[10px] text-cyan-100/50">
              {node.label}
            </div>
          )}
        </Html>

        {/* Moons */}
        {node.children.map((moon, i) => (
          <Moon
            key={moon.id}
            node={moon}
            reducedMotion={reducedMotion}
            selected={selectedId === moon.id}
            onSelect={onSelect}
            index={i}
          />
        ))}
      </group>
    </>
  );
}
