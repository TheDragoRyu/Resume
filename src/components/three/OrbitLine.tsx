'use client';

import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import * as THREE from 'three';

interface OrbitLineProps {
  radius: number;
  color?: string;
  /** Orbital inclination in radians — tilts the orbit ring */
  inclination?: number;
}

export default function OrbitLine({ radius, color = '#00fff0', inclination = 0 }: OrbitLineProps) {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const segments = 128;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const flatZ = Math.sin(angle) * radius;
      const y = flatZ * Math.sin(inclination);
      const z = flatZ * Math.cos(inclination);
      pts.push(new THREE.Vector3(x, y, z));
    }
    return pts;
  }, [radius, inclination]);

  return (
    <Line
      points={points}
      color={color}
      transparent
      opacity={0.25}
      lineWidth={1}
    />
  );
}
