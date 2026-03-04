'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';

interface UseOrbitPositionOptions {
  radius: number;
  speed: number;
  reducedMotion: boolean;
  initialAngle?: number;
  /** Orbital inclination in radians — tilts the orbit plane */
  inclination?: number;
}

export function useOrbitPosition({
  radius,
  speed,
  reducedMotion,
  initialAngle = 0,
  inclination = 0,
}: UseOrbitPositionOptions) {
  const groupRef = useRef<Group>(null);
  const angleRef = useRef(initialAngle);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    if (!reducedMotion) {
      angleRef.current += speed * delta;
    }

    const x = Math.cos(angleRef.current) * radius;
    const flatZ = Math.sin(angleRef.current) * radius;
    // Tilt the orbit plane: rotate around X axis by inclination
    const y = flatZ * Math.sin(inclination);
    const z = flatZ * Math.cos(inclination);
    groupRef.current.position.set(x, y, z);
  });

  return groupRef;
}
