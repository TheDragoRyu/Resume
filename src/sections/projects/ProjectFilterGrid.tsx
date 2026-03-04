'use client';

import { useState, useMemo } from 'react';
import type { ContentItem, ProjectFrontmatter } from '@/content/content-types';
import ProjectCard from './ProjectCard';

interface ProjectFilterGridProps {
  projects: ContentItem<ProjectFrontmatter>[];
  allTags: string[];
}

export default function ProjectFilterGrid({ projects, allTags }: ProjectFilterGridProps) {
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set());

  const toggleTag = (tag: string) => {
    setActiveTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  };

  const clearTags = () => setActiveTags(new Set());

  const filtered = useMemo(() => {
    if (activeTags.size === 0) return projects;
    return projects.filter((p) =>
      (p.frontmatter.tags || []).some((t) => activeTags.has(t))
    );
  }, [projects, activeTags]);

  const sorted = useMemo(() => {
    const featured = filtered.filter((p) => p.frontmatter.featured);
    const rest = filtered.filter((p) => !p.frontmatter.featured);
    return [...featured, ...rest];
  }, [filtered]);

  return (
    <div>
      {/* Tag filters */}
      <div className="mb-6 flex flex-wrap items-center gap-2" role="group" aria-label="Filter by tag">
        {allTags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => toggleTag(tag)}
            aria-pressed={activeTags.has(tag)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              activeTags.has(tag)
                ? 'bg-accent text-black'
                : 'bg-accent/10 text-accent/80 hover:bg-accent/20'
            }`}
          >
            {tag}
          </button>
        ))}
        {activeTags.size > 0 && (
          <button
            type="button"
            onClick={clearTags}
            className="rounded-full px-3 py-1 text-xs text-cyan-100/50 hover:text-accent"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Grid */}
      {sorted.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((project) => (
            <ProjectCard
              key={project.frontmatter.id}
              slug={project.frontmatter.slug}
              title={project.frontmatter.title}
              description={project.frontmatter.description || ''}
              tags={project.frontmatter.tags || []}
              featured={project.frontmatter.featured || false}
            />
          ))}
        </div>
      ) : (
        <p className="py-12 text-center text-cyan-100/50">
          No projects match the selected tags.
        </p>
      )}
    </div>
  );
}
