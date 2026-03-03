'use client';

import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import * as THREE from 'three';

interface OrbitLineProps {
  radius: number;
  color?: string;
}

export default function OrbitLine({ radius, color = '#00fff0' }: OrbitLineProps) {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const segments = 128;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
    }
    return pts;
  }, [radius]);

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
