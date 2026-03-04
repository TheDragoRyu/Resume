'use client';

import { useRef, useEffect } from 'react';
import { CameraControls } from '@react-three/drei';
import type CameraControlsImpl from 'camera-controls';

interface CameraControllerProps {
  viewMode: 'system' | 'planet';
  focusTarget: [number, number, number] | null;
  reducedMotion: boolean;
}

const SYSTEM_POS: [number, number, number] = [0, 15, 25];
const SYSTEM_TARGET: [number, number, number] = [0, 0, 0];
const PLANET_OFFSET: [number, number, number] = [0, 4, 8];

export default function CameraController({
  viewMode,
  focusTarget,
  reducedMotion,
}: CameraControllerProps) {
  const controlsRef = useRef<CameraControlsImpl>(null);

  // Disable scroll-wheel zoom so wheel events pass through to the page
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    // ACTION.NONE = 0 — disables the wheel binding entirely
    controls.mouseButtons.wheel = 0;
    controls.touches.three = 0;
  }, []);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const enableTransition = !reducedMotion;

    if (viewMode === 'planet' && focusTarget) {
      const [tx, ty, tz] = focusTarget;
      controls.setLookAt(
        tx + PLANET_OFFSET[0],
        ty + PLANET_OFFSET[1],
        tz + PLANET_OFFSET[2],
        tx,
        ty,
        tz,
        enableTransition,
      );
    } else {
      controls.setLookAt(
        ...SYSTEM_POS,
        ...SYSTEM_TARGET,
        enableTransition,
      );
    }
  }, [viewMode, focusTarget, reducedMotion]);

  return (
    <CameraControls
      ref={controlsRef}
      makeDefault
      minPolarAngle={Math.PI / 6}
      maxPolarAngle={Math.PI / 2}
      minDistance={5}
      maxDistance={40}
    />
  );
}
