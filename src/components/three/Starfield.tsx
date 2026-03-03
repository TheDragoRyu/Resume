'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface StarfieldProps {
  count?: number;
  radius?: number;
  reducedMotion: boolean;
  performanceMode: boolean;
}

export default function Starfield({
  count = 1500,
  radius = 80,
  reducedMotion,
  performanceMode,
}: StarfieldProps) {
  const groupRef = useRef<THREE.Group>(null);

  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    const palette = [
      [0, 1, 0.94],       // cyan #00fff0
      [1, 0, 1],           // pink #ff00ff
      [0.224, 1, 0.078],   // green #39ff14
      [1, 1, 1],           // white
      [1, 1, 1],           // white (more common)
    ];

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = radius * (0.5 + Math.random() * 0.5);

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      const c = palette[Math.floor(Math.random() * palette.length)];
      col[i * 3] = c[0];
      col[i * 3 + 1] = c[1];
      col[i * 3 + 2] = c[2];
    }

    return { positions: pos, colors: col };
  }, [count, radius]);

  useFrame(() => {
    if (groupRef.current && !reducedMotion && !performanceMode) {
      groupRef.current.rotation.y += 0.0002;
    }
  });

  return (
    <group ref={groupRef}>
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[colors, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.15}
          vertexColors
          transparent
          opacity={0.8}
          sizeAttenuation
        />
      </points>
    </group>
  );
}
