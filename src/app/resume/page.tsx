import type { Metadata } from 'next';
import { getCategories } from '@/content/content-loader';
import Breadcrumb from '@/components/ui/Breadcrumb';
import ResumeToc from '@/sections/resume/ResumeToc';
import ResumeTocMobile from '@/sections/resume/ResumeTocMobile';
import CategorySection from '@/sections/resume/CategorySection';

export const metadata: Metadata = {
  title: 'Resume',
  description: 'Professional experience, skills, and education.',
};

export default async function ResumePage() {
  const categories = await getCategories();

  const tocItems = categories.map((c) => ({
    slug: c.frontmatter.slug,
    title: c.frontmatter.title,
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <Breadcrumb items={[{ label: 'Resume' }]} />
      <h1 className="mb-12 text-4xl font-bold text-accent text-glow-cyan">Resume</h1>

      <ResumeTocMobile items={tocItems} />

      <div className="flex flex-col gap-12 lg:flex-row">
        {/* Sidebar TOC — desktop only */}
        <aside className="hidden lg:block lg:w-48 lg:shrink-0">
          <ResumeToc items={tocItems} />
        </aside>

        {/* Content */}
        <div className="flex-1 space-y-16">
          {categories.map((cat) => (
            <CategorySection
              key={cat.frontmatter.id}
              slug={cat.frontmatter.slug}
              title={cat.frontmatter.title}
              bodyHtml={cat.body}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
