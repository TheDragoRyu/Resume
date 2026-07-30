import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { SceneNode } from '@/content/content-types';
import SceneCanvas from './SceneCanvas';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));
vi.mock('./SolarSystem', () => ({ default: () => null }));
vi.mock('./helpers/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));
vi.mock('./helpers/usePerformanceMode', () => ({
  usePerformanceMode: () => ({
    performanceMode: false,
    togglePerformanceMode: vi.fn(),
  }),
}));
vi.mock('./helpers/useWebGLSupport', () => ({
  useWebGLSupport: () => false,
}));
vi.mock('./helpers/useSceneNavigation', () => ({
  useSceneNavigation: () => ({
    state: { mode: 'system', selectedNode: null },
    selectNode: vi.fn(),
    explorePlanet: vi.fn(),
    backToSystem: vi.fn(),
    closePanel: vi.fn(),
  }),
}));
vi.mock('./helpers/useOnboardingHint', () => ({
  useOnboardingHint: () => ({
    showHint: false,
    dismissHint: vi.fn(),
  }),
}));

const orbit = {
  orbitRadius: 1,
  orbitSpeed: 1,
  size: 1,
  color: '#fff',
};

const sceneGraph: SceneNode = {
  id: 'home',
  slug: 'home',
  label: 'Home',
  destination: 'home',
  type: 'sun',
  route: '/',
  orbit,
  children: [
    {
      id: 'experience',
      slug: 'experience',
      label: 'Experience',
      destination: 'resume-section',
      type: 'planet',
      route: '/resume#experience',
      orbit,
      children: [],
    },
    {
      id: 'projects',
      slug: 'projects',
      label: 'Projects',
      destination: 'projects-index',
      type: 'planet',
      route: '/projects',
      orbit,
      children: [],
    },
  ],
};

describe('SceneCanvas fallback', () => {
  it('renders conventional links when WebGL is unavailable', () => {
    render(<SceneCanvas sceneGraph={sceneGraph} />);

    expect(
      screen.getByText('3D view unavailable — browse destinations below.')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Experience' })
    ).toHaveAttribute('href', '/resume#experience');
    expect(screen.getByRole('link', { name: 'Projects' })).toHaveAttribute(
      'href',
      '/projects'
    );
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute(
      'href',
      '/'
    );
  });
});
