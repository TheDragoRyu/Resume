import type { Metadata } from 'next';
import { getProjects } from '@/content/content-loader';
import Breadcrumb from '@/components/ui/Breadcrumb';
import ProjectFilterGrid from '@/sections/projects/ProjectFilterGrid';

export const metadata: Metadata = {
  title: 'Projects',
  description: 'Featured projects and case studies.',
};

export default async function ProjectsPage() {
  const projects = await getProjects();

  // Collect all unique tags
  const allTags = Array.from(
    new Set(projects.flatMap((p) => p.frontmatter.tags || []))
  ).sort();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <Breadcrumb items={[{ label: 'Projects' }]} />
      <h1 className="mb-8 text-4xl font-bold text-accent text-glow-cyan">Projects</h1>
      <p className="mb-8 text-cyan-100/60">
        A selection of projects I&apos;ve worked on. Click any card for the full case study.
      </p>
      <ProjectFilterGrid projects={projects} allTags={allTags} />
    </div>
  );
}
