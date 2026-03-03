'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';

interface UseOrbitPositionOptions {
  radius: number;
  speed: number;
  reducedMotion: boolean;
  initialAngle?: number;
}

export function useOrbitPosition({
  radius,
  speed,
  reducedMotion,
  initialAngle = 0,
}: UseOrbitPositionOptions) {
  const groupRef = useRef<Group>(null);
  const angleRef = useRef(initialAngle);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    if (!reducedMotion) {
      angleRef.current += speed * delta;
    }

    const x = Math.cos(angleRef.current) * radius;
    const z = Math.sin(angleRef.current) * radius;
    groupRef.current.position.set(x, 0, z);
  });

  return groupRef;
}
