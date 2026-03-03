'use client';

import { OrbitControls } from '@react-three/drei';

export default function CameraController() {
  return (
    <OrbitControls
      enablePan={false}
      enableZoom={false}
      minDistance={5}
      maxDistance={40}
      maxPolarAngle={Math.PI / 2}
      minPolarAngle={Math.PI / 6}
    />
  );
}
