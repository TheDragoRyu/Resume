import type { ContentItem } from '@/content/content-types';
import type { ProjectFrontmatter } from '@/content/content-types';
import ProjectCard from './ProjectCard';

interface ProjectGridProps {
  projects: ContentItem<ProjectFrontmatter>[];
}

export default function ProjectGrid({ projects }: ProjectGridProps) {
  const featured = projects.filter((p) => p.frontmatter.featured);
  const rest = projects.filter((p) => !p.frontmatter.featured);
  const sorted = [...featured, ...rest];

  return (
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
  );
}
