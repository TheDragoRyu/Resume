import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';

interface SquashStretchOptions {
  /** Whether hover spin is active */
  hovered: boolean;
  /** Whether squash-stretch is active (pointer down) */
  pressed: boolean;
  /** Spin speed in radians/sec when hovered */
  spinSpeed?: number;
  /** Squash-stretch amplitude (0–1 range) */
  amplitude?: number;
  /** Oscillation frequency in Hz */
  frequency?: number;
  /** Lerp speed for transitions */
  lerpSpeed?: number;
}

/**
 * Applies Y-axis spin on hover, squash-and-stretch on press.
 * Returns a ref to attach to a wrapping <group>.
 */
export function useSquashStretch({
  hovered,
  pressed,
  spinSpeed = 3,
  amplitude = 0.12,
  frequency = 2.5,
  lerpSpeed = 8,
}: SquashStretchOptions) {
  const groupRef = useRef<Group>(null);
  const spinIntensityRef = useRef(0);
  const squashIntensityRef = useRef(0);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Smoothly ramp spin intensity for hover
    const spinTarget = hovered ? 1 : 0;
    spinIntensityRef.current += (spinTarget - spinIntensityRef.current) * Math.min(lerpSpeed * delta, 1);

    // Smoothly ramp squash intensity for press
    const squashTarget = pressed ? 1 : 0;
    squashIntensityRef.current += (squashTarget - squashIntensityRef.current) * Math.min(lerpSpeed * delta, 1);

    const spin = spinIntensityRef.current;
    const squash = squashIntensityRef.current;

    // Spin on Y axis when hovered
    if (spin > 0.001) {
      groupRef.current.rotation.y += spinSpeed * spin * delta;
    }

    // Squash-stretch when pressed
    if (squash > 0.001) {
      timeRef.current += delta;
      const wave = Math.sin(timeRef.current * frequency * Math.PI * 2);
      const sy = 1 - wave * amplitude * squash;
      const sxz = 1 + wave * amplitude * 0.5 * squash;
      groupRef.current.scale.set(sxz, sy, sxz);
    } else {
      // Ease back to uniform scale
      groupRef.current.scale.lerp({ x: 1, y: 1, z: 1 } as THREE.Vector3, Math.min(lerpSpeed * delta, 1));
      timeRef.current = 0;
    }
  });

  return groupRef;
}

// Import needed for the Vector3-like type in lerp
import * as THREE from 'three';
