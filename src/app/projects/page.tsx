import type { Metadata } from 'next';
import { getProjects, getProjectsPage } from '@/content/content-loader';
import Breadcrumb from '@/components/ui/Breadcrumb';
import ProjectFilterGrid from '@/sections/projects/ProjectFilterGrid';

export async function generateMetadata(): Promise<Metadata> {
  const page = await getProjectsPage();
  const { title, description } = page.frontmatter;

  return {
    title,
    description,
    openGraph: { title, description },
    twitter: { title, description },
  };
}

export default async function ProjectsPage() {
  const [projects, page] = await Promise.all([getProjects(), getProjectsPage()]);

  // Collect all unique tags
  const allTags = Array.from(
    new Set(projects.flatMap((p) => p.frontmatter.tags || []))
  ).sort();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <Breadcrumb items={[{ label: page.frontmatter.title }]} />
      <h1 className="mb-8 text-4xl font-bold text-accent text-glow-cyan">
        {page.frontmatter.title}
      </h1>
      <p className="mb-8 text-cyan-100/60">
        {page.frontmatter.intro}
      </p>
      <ProjectFilterGrid projects={projects} allTags={allTags} />
    </div>
  );
}
