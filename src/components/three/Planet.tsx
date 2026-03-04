'use client';

import { useState, useRef } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import OrbitLine from './OrbitLine';
import Moon from './Moon';
import { useSquashStretch } from './helpers/useSquashStretch';
import type { SceneNode } from '@/content/content-types';

interface PlanetProps {
  node: SceneNode;
  reducedMotion: boolean;
  selected: boolean;
  selectedId: string | null;
  onSelect: (node: SceneNode) => void;
  index: number;
  viewMode: 'system' | 'planet';
  isFocused: boolean;
  showMoons: boolean;
  onPositionUpdate?: (pos: [number, number, number]) => void;
}

export default function Planet({
  node,
  reducedMotion,
  selected,
  selectedId,
  onSelect,
  index,
  viewMode,
  isFocused,
  showMoons,
  onPositionUpdate,
}: PlanetProps) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const groupRef = useRef<Group>(null);
  const angleRef = useRef((index * Math.PI * 2) / 3);
  const effectRef = useSquashStretch({
    hovered: hovered || selected,
    pressed,
    spinSpeed: 3,
    amplitude: 0.15,
    frequency: 3,
  });

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Freeze orbit when this planet is focused, or when reduced motion is on
    if (!reducedMotion && !isFocused) {
      angleRef.current += node.orbit.orbitSpeed * delta;
    }

    const x = Math.cos(angleRef.current) * node.orbit.orbitRadius;
    const z = Math.sin(angleRef.current) * node.orbit.orbitRadius;
    groupRef.current.position.set(x, 0, z);

    // Report world position for camera targeting
    if (onPositionUpdate) {
      onPositionUpdate([x, 0, z]);
    }
  });

  const tooltipHint =
    viewMode === 'system' ? 'Click to explore' : 'Click to open';

  return (
    <>
      <OrbitLine radius={node.orbit.orbitRadius} color={node.orbit.color} />
      <group ref={groupRef}>
        {/* Spin on hover + squash-stretch on press — wraps both sphere and wireframe */}
        <group ref={effectRef}>
          <mesh
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
              setPressed(false);
              document.body.style.cursor = 'auto';
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              setPressed(true);
            }}
            onPointerUp={() => setPressed(false)}
          >
            <sphereGeometry args={[node.orbit.size, 24, 24]} />
            <meshStandardMaterial
              color={node.orbit.color}
              emissive={node.orbit.color}
              emissiveIntensity={hovered || selected ? 0.6 : 0.3}
            />
          </mesh>

          {/* Solid border outline for clickable affordance */}
          <mesh>
            <sphereGeometry args={[node.orbit.size * 1.06, 16, 16]} />
            <meshBasicMaterial
              color={node.orbit.color}
              wireframe
              transparent
              opacity={hovered || selected ? 0.8 : 0.35}
            />
          </mesh>
        </group>

        <Html
          position={[0, node.orbit.size + 0.8, 0]}
          center
          className="pointer-events-none select-none"
        >
          {hovered || selected ? (
            <div className="whitespace-nowrap rounded bg-surface-overlay/90 px-2 py-1 text-xs text-cyan-100 shadow-lg border border-accent/20">
              {node.label}
              {hovered && !selected && (
                <span className="ml-1 text-cyan-100/50">{tooltipHint}</span>
              )}
            </div>
          ) : (
            <div className="whitespace-nowrap text-[10px] text-cyan-100/50">
              {node.label}
            </div>
          )}
        </Html>

        {/* Moons — only rendered when showMoons is true */}
        {showMoons &&
          node.children.map((moon, i) => (
            <Moon
              key={moon.id}
              node={moon}
              reducedMotion={reducedMotion}
              selected={selectedId === moon.id}
              onSelect={onSelect}
              index={i}
              totalMoons={node.children.length}
            />
          ))}
      </group>
    </>
  );
}
