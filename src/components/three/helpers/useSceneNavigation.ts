'use client';

import { useReducer, useCallback, useEffect } from 'react';
import type { SceneNode } from '@/content/content-types';

// --- State types ---

export interface SystemViewState {
  mode: 'system';
  selectedNode: SceneNode | null;
}

export interface PlanetViewState {
  mode: 'planet';
  focusedPlanet: SceneNode;
  selectedNode: SceneNode | null;
}

export type SceneState = SystemViewState | PlanetViewState;

// --- Action types ---

type SceneAction =
  | { type: 'SELECT_NODE'; node: SceneNode }
  | { type: 'EXPLORE_PLANET'; planet: SceneNode }
  | { type: 'BACK_TO_SYSTEM' }
  | { type: 'CLOSE_PANEL' }
  | { type: 'SYNC_HASH'; slug: string | null; sceneGraph: SceneNode };

// --- Reducer ---

function sceneReducer(state: SceneState, action: SceneAction): SceneState {
  switch (action.type) {
    case 'SELECT_NODE': {
      const node = action.node;
      // Toggle off if already selected
      const currentSelected =
        state.selectedNode?.id === node.id ? null : node;
      if (state.mode === 'system') {
        return { mode: 'system', selectedNode: currentSelected };
      }
      return { ...state, selectedNode: currentSelected };
    }

    case 'EXPLORE_PLANET':
      return {
        mode: 'planet',
        focusedPlanet: action.planet,
        selectedNode: null,
      };

    case 'BACK_TO_SYSTEM':
      return { mode: 'system', selectedNode: null };

    case 'CLOSE_PANEL':
      if (state.mode === 'system') {
        return { mode: 'system', selectedNode: null };
      }
      return { ...state, selectedNode: null };

    case 'SYNC_HASH': {
      if (!action.slug) {
        return { mode: 'system', selectedNode: null };
      }
      // Find planet by slug in scene graph children
      const planet = action.sceneGraph.children.find(
        (p) => p.slug === action.slug,
      );
      if (planet) {
        return { mode: 'planet', focusedPlanet: planet, selectedNode: null };
      }
      return { mode: 'system', selectedNode: null };
    }

    default:
      return state;
  }
}

// --- Hash helpers ---

function getHashSlug(): string | null {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash;
  const match = hash.match(/^#planet\/(.+)$/);
  return match ? match[1] : null;
}

function setHash(slug: string | null) {
  if (typeof window === 'undefined') return;
  const newHash = slug ? `#planet/${slug}` : '';
  if (window.location.hash !== newHash) {
    window.history.pushState(null, '', newHash || window.location.pathname);
  }
}

// --- Hook ---

export function useSceneNavigation(sceneGraph: SceneNode) {
  const initialSlug = typeof window !== 'undefined' ? getHashSlug() : null;
  const initialPlanet = initialSlug
    ? sceneGraph.children.find((p) => p.slug === initialSlug) ?? null
    : null;

  const initialState: SceneState = initialPlanet
    ? { mode: 'planet', focusedPlanet: initialPlanet, selectedNode: null }
    : { mode: 'system', selectedNode: null };

  const [state, dispatch] = useReducer(sceneReducer, initialState);

  // Sync hash to URL when state changes
  useEffect(() => {
    if (state.mode === 'planet') {
      setHash(state.focusedPlanet.slug);
    } else {
      setHash(null);
    }
  }, [state.mode, state.mode === 'planet' ? (state as PlanetViewState).focusedPlanet.slug : null]);

  // Listen for browser back/forward
  useEffect(() => {
    const handler = () => {
      const slug = getHashSlug();
      dispatch({ type: 'SYNC_HASH', slug, sceneGraph });
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, [sceneGraph]);

  const selectNode = useCallback((node: SceneNode) => {
    dispatch({ type: 'SELECT_NODE', node });
  }, []);

  const explorePlanet = useCallback((planet: SceneNode) => {
    dispatch({ type: 'EXPLORE_PLANET', planet });
  }, []);

  const backToSystem = useCallback(() => {
    dispatch({ type: 'BACK_TO_SYSTEM' });
  }, []);

  const closePanel = useCallback(() => {
    dispatch({ type: 'CLOSE_PANEL' });
  }, []);

  return { state, selectNode, explorePlanet, backToSystem, closePanel };
}
