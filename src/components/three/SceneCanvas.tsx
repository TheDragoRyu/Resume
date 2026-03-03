'use client';

import { useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { useRouter } from 'next/navigation';
import SolarSystem from './SolarSystem';
import ContextPanel from './ContextPanel';
import { useReducedMotion } from './helpers/useReducedMotion';
import { usePerformanceMode } from './helpers/usePerformanceMode';
import { useWebGLSupport } from './helpers/useWebGLSupport';
import type { SceneNode } from '@/content/content-types';

interface SceneCanvasProps {
  sceneGraph: SceneNode;
}

export default function SceneCanvas({ sceneGraph }: SceneCanvasProps) {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const { performanceMode, togglePerformanceMode } = usePerformanceMode();
  const webGLSupported = useWebGLSupport();
  const [selectedNode, setSelectedNode] = useState<SceneNode | null>(null);

  const handleSelect = useCallback((node: SceneNode) => {
    setSelectedNode((prev) => (prev?.id === node.id ? null : node));
  }, []);

  const handleClose = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const handleOpen = useCallback(() => {
    if (selectedNode) {
      router.push(selectedNode.route);
    }
  }, [selectedNode, router]);

  if (!webGLSupported) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-xl bg-gradient-to-b from-surface-raised to-surface">
        <p className="text-sm text-cyan-100/40">
          3D view unavailable on this device/browser.
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <Canvas
        camera={{ position: [0, 15, 25], fov: 50 }}
        className="h-full w-full"
        style={{ background: 'transparent' }}
      >
        <SolarSystem
          sceneGraph={sceneGraph}
          selectedId={selectedNode?.id ?? null}
          onSelect={handleSelect}
          reducedMotion={reducedMotion || performanceMode}
          performanceMode={performanceMode}
        />
      </Canvas>

      <button
        type="button"
        onClick={togglePerformanceMode}
        className="absolute right-3 top-3 rounded-md bg-surface-overlay/80 px-2.5 py-1.5 text-xs text-cyan-100/50 backdrop-blur transition-colors hover:text-accent"
        aria-pressed={performanceMode}
        title="Performance mode"
      >
        {performanceMode ? 'Performance mode on' : 'Performance mode'}
      </button>

      {selectedNode && (
        <ContextPanel
          node={selectedNode}
          onClose={handleClose}
          onOpen={handleOpen}
        />
      )}
    </div>
  );
}
