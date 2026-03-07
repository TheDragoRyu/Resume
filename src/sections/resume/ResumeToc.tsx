'use client';

import { useState, useEffect, useRef } from 'react';
import posthog from 'posthog-js';

interface TocItem {
  slug: string;
  title: string;
}

interface ResumeTocProps {
  items: TocItem[];
}

export default function ResumeToc({ items }: ResumeTocProps) {
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const viewedSections = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (activeSlug && !viewedSections.current.has(activeSlug)) {
      viewedSections.current.add(activeSlug);
      posthog.capture('resume_section_viewed', { section: activeSlug });
    }
  }, [activeSlug]);

  useEffect(() => {
    const elements = items
      .map(({ slug }) => document.getElementById(slug))
      .filter(Boolean) as HTMLElement[];

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the first intersecting section from top
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) {
          setActiveSlug(visible[0].target.id);
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav aria-label="Resume sections" className="sticky top-20">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neon-pink/70">
        Sections
      </h2>
      <ul className="space-y-2">
        {items.map(({ slug, title }) => (
          <li key={slug}>
            <a
              href={`#${slug}`}
              onClick={() => posthog.capture('resume_toc_clicked', { section: slug, device: 'desktop' })}
              className={`text-sm transition-colors hover:text-accent ${
                activeSlug === slug
                  ? 'font-semibold text-accent'
                  : 'text-cyan-100/60'
              }`}
            >
              {title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
