'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { SceneNode } from '@/content/content-types';
import { useReducedMotion } from '@/components/three/helpers/useReducedMotion';
import HeroSection from './HeroSection';
import SolarSystemSection from './SolarSystemSection';

interface LandingExperienceProps {
  name: string;
  role: string;
  description: string;
  sceneGraph: SceneNode;
}

type LandingStyle = CSSProperties & {
  '--landing-progress': number;
};

function clampProgress(value: number) {
  return Math.min(1, Math.max(0, value));
}

export default function LandingExperience({
  name,
  role,
  description,
  sceneGraph,
}: LandingExperienceProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [heroHidden, setHeroHidden] = useState(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage) return;

    let animationFrame = 0;

    const updateProgress = () => {
      animationFrame = 0;

      const sectionTop = section.getBoundingClientRect().top;
      const scrollDistance = Math.max(1, section.offsetHeight - stage.offsetHeight);
      const rawProgress = clampProgress(-sectionTop / scrollDistance);
      const progress = reducedMotion
        ? rawProgress >= 0.5
          ? 1
          : 0
        : rawProgress;

      stage.style.setProperty('--landing-progress', String(progress));
      setHeroHidden((wasHidden) => {
        const isHidden = progress >= 0.68;
        return wasHidden === isHidden ? wasHidden : isHidden;
      });
    };

    const requestProgressUpdate = () => {
      if (animationFrame) return;
      animationFrame = window.requestAnimationFrame(updateProgress);
    };

    updateProgress();
    window.addEventListener('scroll', requestProgressUpdate, { passive: true });
    window.addEventListener('resize', requestProgressUpdate);

    return () => {
      window.removeEventListener('scroll', requestProgressUpdate);
      window.removeEventListener('resize', requestProgressUpdate);
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
    };
  }, [reducedMotion]);

  const landingStyle: LandingStyle = {
    '--landing-progress': 0,
  };

  return (
    <section
      ref={sectionRef}
      aria-label="Interactive introduction"
      className="relative h-[165svh] md:h-[175svh]"
    >
      <div
        ref={stageRef}
        style={landingStyle}
        className="sticky top-[4.25rem] h-[calc(100svh-4.25rem)] overflow-hidden bg-surface md:top-[3.25rem] md:h-[calc(100svh-3.25rem)]"
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgba(30,24,56,0.72),rgba(10,10,18,0.92)_58%,#0a0a12_100%)]"
        />

        <div
          className="absolute inset-0 origin-center will-change-transform"
          style={{
            opacity:
              'calc(0.72 + (var(--landing-progress) * 0.28))',
            transform:
              'scale(calc(0.88 + (var(--landing-progress) * 0.12)))',
          }}
        >
          <SolarSystemSection sceneGraph={sceneGraph} />
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(10,10,18,0.18)_0%,rgba(10,10,18,0.66)_62%,rgba(10,10,18,0.9)_100%)] will-change-[opacity]"
          style={{
            opacity: 'calc(1 - var(--landing-progress))',
          }}
        />

        <div
          aria-hidden={heroHidden || undefined}
          inert={heroHidden ? true : undefined}
          className={`pointer-events-none absolute inset-0 z-20 flex items-center justify-center will-change-[filter,opacity,transform] ${
            heroHidden ? 'pointer-events-none' : ''
          }`}
          style={{
            filter: 'blur(calc(var(--landing-progress) * 6px))',
            opacity:
              'clamp(0, calc(1 - (var(--landing-progress) * 1.55)), 1)',
            transform:
              'translate3d(0, calc(var(--landing-progress) * -3rem), 0)',
          }}
        >
          <HeroSection name={name} role={role} description={description} />
        </div>
      </div>
    </section>
  );
}
