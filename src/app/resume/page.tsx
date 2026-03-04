import type { Metadata } from 'next';
import { getCategories, getIntro } from '@/content/content-loader';
import Breadcrumb from '@/components/ui/Breadcrumb';
import ResumeToc from '@/sections/resume/ResumeToc';
import ResumeTocMobile from '@/sections/resume/ResumeTocMobile';
import CategorySection from '@/sections/resume/CategorySection';
import ResumeHeader from '@/sections/resume/ResumeHeader';

export const metadata: Metadata = {
  title: 'Resume',
  description: 'Professional experience, skills, and education.',
};

export default async function ResumePage() {
  const [categories, intro] = await Promise.all([getCategories(), getIntro()]);

  const tocItems = categories.map((c) => ({
    slug: c.frontmatter.slug,
    title: c.frontmatter.title,
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <Breadcrumb items={[{ label: 'Resume' }]} />
      <ResumeHeader
        name={intro.frontmatter.title}
        role={intro.frontmatter.role}
        photo={intro.frontmatter.photo}
      />

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
