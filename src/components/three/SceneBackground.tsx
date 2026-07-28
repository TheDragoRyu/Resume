'use client';

import { useLayoutEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  MathUtils,
  PerspectiveCamera,
  Vector3,
  type Group,
  type Mesh,
} from 'three';
import type { SceneNode } from '@/content/content-types';
import OrbitLine from './OrbitLine';
import Starfield from './Starfield';
import { usePerformanceMode } from './helpers/usePerformanceMode';
import { useReducedMotion } from './helpers/useReducedMotion';
import { useWebGLSupport } from './helpers/useWebGLSupport';

interface SceneBackgroundProps {
  sceneGraph: SceneNode;
}

interface DecorativePlanetProps {
  node: SceneNode;
  index: number;
  reducedMotion: boolean;
}

const CAMERA_DIRECTION = new Vector3(0, 1, 0.35).normalize();
const FRAME_MARGIN = 1.12;

function BackgroundCamera({ frameRadius }: { frameRadius: number }) {
  const camera = useThree((state) => state.camera);
  const { width, height } = useThree((state) => state.size);

  useLayoutEffect(() => {
    if (!(camera instanceof PerspectiveCamera)) return;

    const aspect = width / Math.max(height, 1);
    const verticalFov = MathUtils.degToRad(camera.fov);
    const horizontalFov =
      2 * Math.atan(Math.tan(verticalFov / 2) * aspect);
    const limitingFov = Math.min(verticalFov, horizontalFov);
    const distance =
      (frameRadius * FRAME_MARGIN) / Math.sin(limitingFov / 2);

    camera.position.copy(CAMERA_DIRECTION.clone().multiplyScalar(distance));
    camera.near = Math.max(0.1, distance - frameRadius * 1.5);
    camera.far = distance + frameRadius * 3;
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, frameRadius, height, width]);

  return null;
}

function DecorativePlanet({
  node,
  index,
  reducedMotion,
}: DecorativePlanetProps) {
  const groupRef = useRef<Group>(null);
  const angleRef = useRef((index * Math.PI * 2) / 3);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    if (!reducedMotion) {
      angleRef.current += node.orbit.orbitSpeed * delta;
      groupRef.current.rotation.y += delta * 0.16;
    }

    groupRef.current.position.set(
      Math.cos(angleRef.current) * node.orbit.orbitRadius,
      0,
      Math.sin(angleRef.current) * node.orbit.orbitRadius,
    );
  });

  return (
    <>
      <OrbitLine radius={node.orbit.orbitRadius} color={node.orbit.color} />
      <group ref={groupRef}>
        <mesh>
          <sphereGeometry args={[node.orbit.size, 24, 24]} />
          <meshStandardMaterial
            color={node.orbit.color}
            emissive={node.orbit.color}
            emissiveIntensity={0.3}
          />
        </mesh>
        <mesh>
          <sphereGeometry args={[node.orbit.size * 1.06, 16, 16]} />
          <meshBasicMaterial
            color={node.orbit.color}
            wireframe
            transparent
            opacity={0.35}
          />
        </mesh>
      </group>
    </>
  );
}

function DecorativeSun({
  node,
  reducedMotion,
}: {
  node: SceneNode;
  reducedMotion: boolean;
}) {
  const meshRef = useRef<Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current && !reducedMotion) {
      meshRef.current.rotation.y += delta * 0.12;
    }
  });

  return (
    <>
      <pointLight color={node.orbit.color} intensity={3} distance={50} />
      <mesh ref={meshRef}>
        <sphereGeometry args={[node.orbit.size, 32, 32]} />
        <meshStandardMaterial
          color={node.orbit.color}
          emissive={node.orbit.color}
          emissiveIntensity={1.2}
        />
      </mesh>
    </>
  );
}

export default function SceneBackground({ sceneGraph }: SceneBackgroundProps) {
  const reducedMotion = useReducedMotion();
  const { performanceMode } = usePerformanceMode();
  const webGLSupported = useWebGLSupport();
  const frameRadius = useMemo(
    () =>
      Math.max(
        sceneGraph.orbit.size,
        ...sceneGraph.children.map(
          (planet) => planet.orbit.orbitRadius + planet.orbit.size * 1.06,
        ),
      ),
    [sceneGraph],
  );

  if (!webGLSupported) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    >
      <Canvas
        camera={{ position: [0, 15, 25], fov: 50 }}
        className="h-full w-full"
        style={{ background: 'transparent' }}
        aria-hidden="true"
      >
        <BackgroundCamera frameRadius={frameRadius} />
        <ambientLight intensity={0.15} />
        <Starfield
          reducedMotion={reducedMotion}
          performanceMode={performanceMode}
        />
        <DecorativeSun
          node={sceneGraph}
          reducedMotion={reducedMotion || performanceMode}
        />
        {sceneGraph.children.map((planet, index) => (
          <DecorativePlanet
            key={planet.id}
            node={planet}
            index={index}
            reducedMotion={reducedMotion || performanceMode}
          />
        ))}
      </Canvas>
    </div>
  );
}
