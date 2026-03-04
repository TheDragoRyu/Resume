'use client';

import { useRef, useState, useCallback } from 'react';
import Sun from './Sun';
import Planet from './Planet';
import Starfield from './Starfield';
import CameraController from './CameraController';
import type { SceneNode } from '@/content/content-types';
import type { SceneState } from './helpers/useSceneNavigation';

interface SolarSystemProps {
  sceneGraph: SceneNode;
  state: SceneState;
  onSelect: (node: SceneNode) => void;
  reducedMotion: boolean;
  performanceMode?: boolean;
  showPulse?: boolean;
}

export default function SolarSystem({
  sceneGraph,
  state,
  onSelect,
  reducedMotion,
  performanceMode = false,
  showPulse = false,
}: SolarSystemProps) {
  const viewMode = state.mode;
  const focusedPlanetId =
    state.mode === 'planet' ? state.focusedPlanet.id : null;
  const selectedId = state.selectedNode?.id ?? null;

  // Track focused planet position. We use state so CameraController re-renders
  // when the position is first reported. After the initial set, the planet is
  // frozen so the position won't change (no unnecessary re-renders).
  const [focusTarget, setFocusTarget] = useState<
    [number, number, number] | null
  >(null);
  const hasSetTarget = useRef(false);

  const handlePositionUpdate = useCallback(
    (pos: [number, number, number]) => {
      // Only update state once to avoid per-frame re-renders.
      // The planet freezes its orbit when focused, so position is stable.
      if (!hasSetTarget.current) {
        hasSetTarget.current = true;
        setFocusTarget(pos);
      }
    },
    [],
  );

  // Reset target tracking when leaving planet view
  const prevFocusedId = useRef<string | null>(null);
  if (focusedPlanetId !== prevFocusedId.current) {
    prevFocusedId.current = focusedPlanetId;
    hasSetTarget.current = false;
    if (!focusedPlanetId) {
      setFocusTarget(null);
    }
  }

  // Determine which planets to render
  const planetsToRender =
    viewMode === 'planet'
      ? sceneGraph.children.filter((p) => p.id === focusedPlanetId)
      : sceneGraph.children;

  const showSun = viewMode === 'system';

  return (
    <>
      <ambientLight intensity={0.15} />
      <CameraController
        viewMode={viewMode}
        focusTarget={viewMode === 'planet' ? focusTarget : null}
        reducedMotion={reducedMotion || performanceMode}
      />

      <Starfield
        reducedMotion={reducedMotion}
        performanceMode={performanceMode}
      />

      {/* Sun — only visible in system view */}
      {showSun && (
        <Sun
          size={sceneGraph.orbit.size}
          color={sceneGraph.orbit.color}
          label={sceneGraph.label}
          selected={selectedId === sceneGraph.id}
          onSelect={() => onSelect(sceneGraph)}
          reducedMotion={reducedMotion || performanceMode}
        />
      )}

      {/* Planets */}
      {planetsToRender.map((planet) => {
        const isFocused = planet.id === focusedPlanetId;
        return (
          <Planet
            key={planet.id}
            node={planet}
            reducedMotion={reducedMotion || performanceMode}
            selected={selectedId === planet.id}
            selectedId={selectedId}
            onSelect={onSelect}
            index={sceneGraph.children.indexOf(planet)}
            viewMode={viewMode}
            isFocused={isFocused}
            showMoons={isFocused && viewMode === 'planet'}
            showPulse={showPulse && viewMode === 'system'}
            onPositionUpdate={isFocused ? handlePositionUpdate : undefined}
          />
        );
      })}
    </>
  );
}
