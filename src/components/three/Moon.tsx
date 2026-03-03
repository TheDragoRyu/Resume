'use client';

import { useState } from 'react';
import { Html } from '@react-three/drei';
import { useOrbitPosition } from './helpers/useOrbitPosition';
import OrbitLine from './OrbitLine';
import type { SceneNode } from '@/content/content-types';

interface MoonProps {
  node: SceneNode;
  reducedMotion: boolean;
  selected: boolean;
  onSelect: (node: SceneNode) => void;
  index: number;
}

export default function Moon({
  node,
  reducedMotion,
  selected,
  onSelect,
  index,
}: MoonProps) {
  const [hovered, setHovered] = useState(false);
  const groupRef = useOrbitPosition({
    radius: node.orbit.orbitRadius,
    speed: node.orbit.orbitSpeed,
    reducedMotion,
    initialAngle: (index * Math.PI * 2) / 4,
  });

  const scale = hovered || selected ? 1.1 : 1;

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
          <sphereGeometry args={[node.orbit.size, 16, 16]} />
          <meshStandardMaterial
            color={node.orbit.color}
            emissive={node.orbit.color}
            emissiveIntensity={hovered || selected ? 0.5 : 0.25}
          />
        </mesh>

        <Html
          position={[0, node.orbit.size + 0.5, 0]}
          center
          className="pointer-events-none select-none"
        >
          {hovered || selected ? (
            <div className="whitespace-nowrap rounded bg-surface-overlay/90 px-2 py-1 text-xs text-cyan-100 shadow-lg border border-accent/20">
              {node.label}
            </div>
          ) : (
            <div className="whitespace-nowrap text-[9px] text-cyan-100/40">
              {node.label}
            </div>
          )}
        </Html>
      </group>
    </>
  );
}
