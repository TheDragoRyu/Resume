'use client';

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import type { Mesh } from 'three';

interface SunProps {
  size: number;
  color: string;
  label: string;
  selected: boolean;
  onSelect: () => void;
}

export default function Sun({ size, color, label, selected, onSelect }: SunProps) {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.002;
    }
  });

  const scale = hovered || selected ? 1.05 : 1;

  return (
    <group>
      <pointLight color={color} intensity={3} distance={50} />
      <mesh
        ref={meshRef}
        scale={scale}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
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
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered || selected ? 1.8 : 1.2}
        />
      </mesh>
      <Html
        position={[0, size + 1, 0]}
        center
        className="pointer-events-none select-none"
      >
        {hovered || selected ? (
          <div className="whitespace-nowrap rounded bg-surface-overlay/90 px-2 py-1 text-xs text-accent shadow-lg border border-accent/20">
            {label}
            {hovered && !selected && (
              <span className="ml-1 text-cyan-100/50">Click to open</span>
            )}
          </div>
        ) : (
          <div className="whitespace-nowrap text-[10px] text-accent/70">
            {label}
          </div>
        )}
      </Html>
    </group>
  );
}
