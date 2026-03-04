import type { Metadata } from 'next';
import { getPageOrThrow } from '@/content/content-loader';
import Breadcrumb from '@/components/ui/Breadcrumb';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch — reach out for collaboration, questions, or just to say hello.',
};

export default async function ContactPage() {
  const page = await getPageOrThrow('contact');

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Breadcrumb items={[{ label: 'Contact' }]} />
      <h1 className="mb-8 text-4xl font-bold text-accent text-glow-cyan">
        {page.frontmatter.title}
      </h1>
      <div
        className="prose prose-invert max-w-none prose-headings:text-accent prose-a:text-accent prose-a:no-underline hover:prose-a:underline"
        dangerouslySetInnerHTML={{ __html: page.body }}
      />
    </div>
  );
}
