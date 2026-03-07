'use client';

import { useCallback, useState, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import posthog from 'posthog-js';
import SolarSystem from './SolarSystem';
import ContextPanel from './ContextPanel';
import SceneKeyboardNav from './SceneKeyboardNav';
import { useReducedMotion } from './helpers/useReducedMotion';
import { usePerformanceMode } from './helpers/usePerformanceMode';
import { useWebGLSupport } from './helpers/useWebGLSupport';
import { useSceneNavigation } from './helpers/useSceneNavigation';
import { useOnboardingHint } from './helpers/useOnboardingHint';
import type { SceneNode } from '@/content/content-types';

interface SceneCanvasProps {
  sceneGraph: SceneNode;
  isMobile?: boolean;
}

const FOCUS_RING = 'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-overlay';

export default function SceneCanvas({ sceneGraph, isMobile }: SceneCanvasProps) {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const { performanceMode, togglePerformanceMode } = usePerformanceMode();
  const webGLSupported = useWebGLSupport();
  const { state, selectNode, explorePlanet, backToSystem, closePanel } =
    useSceneNavigation(sceneGraph);
  const { showHint, dismissHint } = useOnboardingHint();
  const [navigating, setNavigating] = useState(false);

  const selectedNode = state.selectedNode;

  // On mobile, clicking a planet always selects (shows panel) — never auto-explores.
  // On desktop, clicking a planet with moons zooms in to show them.
  const handleSelect = useCallback(
    (node: SceneNode) => {
      dismissHint();
      posthog.capture('scene_node_selected', { node: node.label, type: node.type, mode: state.mode });
      if (isMobile) {
        selectNode(node);
      } else if (state.mode === 'system' && node.type === 'planet' && node.children.length > 0) {
        posthog.capture('scene_planet_explored', { planet: node.label });
        explorePlanet(node);
      } else {
        selectNode(node);
      }
    },
    [state.mode, explorePlanet, selectNode, isMobile, dismissHint],
  );

  // Primary action in ContextPanel
  const getPrimaryAction = useCallback((): {
    label: string;
    handler: () => void;
  } => {
    if (!selectedNode) return { label: 'Open', handler: () => {} };

    // Gap 8: In system view, planets with moons show "Explore"
    if (state.mode === 'system' && selectedNode.type === 'planet' && selectedNode.children.length > 0) {
      return {
        label: 'Explore',
        handler: () => {
          posthog.capture('scene_panel_action', { node: selectedNode.label, action: 'explore' });
          explorePlanet(selectedNode);
        },
      };
    }

    // Everything else navigates
    return {
      label: 'Open',
      handler: () => {
        posthog.capture('scene_panel_action', { node: selectedNode.label, action: 'open', route: selectedNode.route });
        setNavigating(true);
        router.push(selectedNode.route);
      },
    };
  }, [selectedNode, state.mode, router, explorePlanet]);

  // Gap 9: Secondary action for sun — Contact
  const secondaryAction = useMemo(() => {
    if (selectedNode?.type === 'sun') {
      return {
        label: 'Contact',
        handler: () => {
          posthog.capture('scene_panel_action', { node: 'sun', action: 'contact' });
          router.push('/contact');
        },
      };
    }
    return undefined;
  }, [selectedNode, router]);

  // Keyboard nav nodes for current view
  const keyboardNodes = useMemo(() => {
    if (state.mode === 'planet') {
      const planet = (state as { focusedPlanet: SceneNode }).focusedPlanet;
      return [planet, ...planet.children];
    }
    return [sceneGraph, ...sceneGraph.children]; // sun + planets
  }, [state, sceneGraph]);

  const keyboardLabel = state.mode === 'planet'
    ? `Planet view: ${(state as { focusedPlanet: SceneNode }).focusedPlanet.label} and moons`
    : 'Solar system: sun and planets';

  // Gap 14: WebGL fallback — nav card grid
  if (!webGLSupported) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-6 rounded-xl bg-gradient-to-b from-surface-raised to-surface p-8">
        <p className="text-sm text-cyan-100/70">
          3D view unavailable — browse destinations below.
        </p>
        <nav aria-label="Site destinations" className="grid w-full max-w-md gap-3 sm:grid-cols-2">
          {sceneGraph.children.map((planet) => (
            <Link
              key={planet.id}
              href={planet.route}
              className="rounded-lg border border-accent/20 bg-surface-overlay/80 px-4 py-3 text-sm font-medium text-accent transition-colors hover:border-accent/50 hover:bg-accent/10"
            >
              {planet.label}
              {planet.children.length > 0 && (
                <span className="ml-1 text-cyan-100/50">({planet.children.length})</span>
              )}
            </Link>
          ))}
          <Link
            href={sceneGraph.route}
            className="rounded-lg border border-accent/20 bg-surface-overlay/80 px-4 py-3 text-sm font-medium text-accent transition-colors hover:border-accent/50 hover:bg-accent/10"
          >
            {sceneGraph.label}
          </Link>
        </nav>
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
        aria-hidden="true"
      >
        <SolarSystem
          sceneGraph={sceneGraph}
          state={state}
          onSelect={handleSelect}
          reducedMotion={reducedMotion || performanceMode}
          performanceMode={performanceMode}
          showPulse={showHint}
        />
      </Canvas>

      {/* Keyboard nav overlay (Gap 3) */}
      <SceneKeyboardNav
        nodes={keyboardNodes}
        onSelect={handleSelect}
        label={keyboardLabel}
      />

      {/* Onboarding hint (Gap 7) */}
      {showHint && (
        <div className="absolute bottom-20 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg border border-accent/20 bg-surface-overlay/90 px-4 py-2 text-sm text-cyan-100/70 backdrop-blur">
          {isMobile ? 'Tap a planet to explore' : 'Click a planet to explore'}
          <button
            onClick={() => {
              posthog.capture('scene_hint_dismissed');
              dismissHint();
            }}
            className={`ml-3 text-accent hover:underline ${FOCUS_RING} rounded`}
            aria-label="Dismiss hint"
          >
            Got it
          </button>
        </div>
      )}

      {/* Top bar — breadcrumb + performance toggle */}
      <div className="absolute left-4 right-4 top-4 flex items-center justify-between">
        {state.mode === 'planet' ? (
          <nav aria-label="Scene breadcrumb" className="flex items-center gap-1 rounded-lg border border-accent/30 bg-surface-overlay/90 px-4 py-2 min-h-[44px] text-sm backdrop-blur">
            <button
              type="button"
              onClick={() => {
                posthog.capture('scene_back_to_system');
                backToSystem();
              }}
              className={`font-medium text-accent transition-colors hover:text-accent-hover ${FOCUS_RING} rounded`}
            >
              System
            </button>
            <span className="text-cyan-100/40" aria-hidden="true"> ▸ </span>
            <span className="font-medium text-cyan-100/80">
              {(state as { focusedPlanet: SceneNode }).focusedPlanet.label}
            </span>
          </nav>
        ) : (
          <span />
        )}

        <button
          type="button"
          onClick={togglePerformanceMode}
          className={`rounded-lg bg-surface-overlay/80 px-3 py-2 min-h-[44px] text-xs text-cyan-100/50 backdrop-blur transition-colors hover:text-accent ${FOCUS_RING}`}
          aria-pressed={performanceMode}
          title="Performance mode"
        >
          {performanceMode ? 'Performance mode on' : 'Performance mode'}
        </button>
      </div>

      {/* ContextPanel — shown in planet view, or for sun/planet in system view */}
      {selectedNode && (state.mode === 'planet' || selectedNode.type === 'sun' || (state.mode === 'system' && selectedNode.type === 'planet')) && (
        <ContextPanel
          node={selectedNode}
          onClose={closePanel}
          onPrimary={onPrimary}
          primaryLabel={primaryLabel}
          onBack={state.mode === 'planet' ? backToSystem : undefined}
          secondaryAction={secondaryAction}
          navigating={navigating && primaryLabel === 'Open'}
        />
      )}
    </div>
  );
}
