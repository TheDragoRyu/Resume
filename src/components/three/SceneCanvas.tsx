'use client';

import { useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { useRouter } from 'next/navigation';
import SolarSystem from './SolarSystem';
import ContextPanel from './ContextPanel';
import { useReducedMotion } from './helpers/useReducedMotion';
import { usePerformanceMode } from './helpers/usePerformanceMode';
import { useWebGLSupport } from './helpers/useWebGLSupport';
import { useSceneNavigation } from './helpers/useSceneNavigation';
import type { SceneNode } from '@/content/content-types';

interface SceneCanvasProps {
  sceneGraph: SceneNode;
}

export default function SceneCanvas({ sceneGraph }: SceneCanvasProps) {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const { performanceMode, togglePerformanceMode } = usePerformanceMode();
  const webGLSupported = useWebGLSupport();
  const { state, selectNode, explorePlanet, backToSystem, closePanel } =
    useSceneNavigation(sceneGraph);

  const selectedNode = state.selectedNode;

  // In system view, clicking a planet zooms in directly (no panel).
  // Clicking the sun still selects it to show a panel.
  const handleSelect = useCallback(
    (node: SceneNode) => {
      if (state.mode === 'system' && node.type === 'planet') {
        explorePlanet(node);
      } else {
        selectNode(node);
      }
    },
    [state.mode, explorePlanet, selectNode],
  );

  // Primary action in ContextPanel — only used in planet view
  const getPrimaryAction = useCallback((): {
    label: string;
    handler: () => void;
  } => {
    if (!selectedNode) return { label: 'Open', handler: () => {} };

    // Sun selected in system view
    if (state.mode === 'system') {
      return {
        label: 'Open',
        handler: () => router.push(selectedNode.route),
      };
    }

    // Planet view — both planet and moon selections navigate
    return {
      label: 'Open',
      handler: () => router.push(selectedNode.route),
    };
  }, [selectedNode, state.mode, router]);

  if (!webGLSupported) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-xl bg-gradient-to-b from-surface-raised to-surface">
        <p className="text-sm text-cyan-100/70">
          3D view unavailable on this device/browser.
        </p>
      </div>
    );
  }

  const { label: primaryLabel, handler: onPrimary } = getPrimaryAction();

  return (
    <div className="relative h-full w-full">
      <Canvas
        camera={{ position: [0, 15, 25], fov: 50 }}
        className="h-full w-full"
        style={{ background: 'transparent' }}
      >
        <SolarSystem
          sceneGraph={sceneGraph}
          state={state}
          onSelect={handleSelect}
          reducedMotion={reducedMotion || performanceMode}
          performanceMode={performanceMode}
        />
      </Canvas>

      {/* Top bar — back button + performance toggle */}
      <div className="absolute left-4 right-4 top-4 flex items-center justify-between">
        {state.mode === 'planet' ? (
          <button
            type="button"
            onClick={backToSystem}
            className="rounded-lg border border-accent/30 bg-surface-overlay/90 px-4 py-2 text-sm font-medium text-accent backdrop-blur transition-colors hover:border-accent/60 hover:bg-accent/10"
            aria-label="Back to system view"
          >
            ← Back to System
          </button>
        ) : (
          <span />
        )}

        <button
          type="button"
          onClick={togglePerformanceMode}
          className="rounded-lg bg-surface-overlay/80 px-3 py-2 text-xs text-cyan-100/50 backdrop-blur transition-colors hover:text-accent"
          aria-pressed={performanceMode}
          title="Performance mode"
        >
          {performanceMode ? 'Performance mode on' : 'Performance mode'}
        </button>
      </div>

      {/* ContextPanel — shown in planet view, or for sun in system view */}
      {selectedNode && (state.mode === 'planet' || selectedNode.type === 'sun') && (
        <ContextPanel
          node={selectedNode}
          onClose={closePanel}
          onPrimary={onPrimary}
          primaryLabel={primaryLabel}
          onBack={state.mode === 'planet' ? backToSystem : undefined}
        />
      )}
    </div>
  );
}
