import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProjects, getContentBySlug } from '@/content/content-loader';
import type { ProjectFrontmatter } from '@/content/content-types';
import Breadcrumb from '@/components/ui/Breadcrumb';
import CaseStudyBody from '@/sections/projects/CaseStudyBody';
import { buildSiteUrl } from '@/utils/site-url';

const SITE_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

interface ProjectPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const projects = await getProjects();
  return projects.map((p) => ({ slug: p.frontmatter.slug }));
}

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getContentBySlug<ProjectFrontmatter>(slug);

  if (!project) {
    return { title: 'Project Not Found' };
  }

  return {
    title: project.frontmatter.title,
    description: project.frontmatter.description,
    openGraph: {
      title: project.frontmatter.title,
      description: project.frontmatter.description,
      images: project.frontmatter.image
        ? [
            {
              url: buildSiteUrl(SITE_ORIGIN, BASE_PATH, project.frontmatter.image),
              alt: project.frontmatter.imageAlt || project.frontmatter.title,
            },
          ]
        : [
            {
              url: buildSiteUrl(SITE_ORIGIN, BASE_PATH, '/og-default.png'),
              width: 1200,
              height: 630,
            },
          ],
    },
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = await getContentBySlug<ProjectFrontmatter>(slug);

  if (!project) {
    notFound();
  }

  const fm = project.frontmatter;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Breadcrumb
        items={[
          { label: 'Projects', href: '/projects' },
          { label: fm.title },
        ]}
      />
      <CaseStudyBody
        title={fm.title}
        description={fm.description || ''}
        bodyHtml={project.body}
        image={fm.image}
        imageAlt={fm.imageAlt}
        tags={fm.tags || []}
        links={fm.links}
      />
    </div>
  );
}
