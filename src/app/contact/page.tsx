import type { Metadata } from 'next';
import { getPage } from '@/content/content-loader';
import Breadcrumb from '@/components/ui/Breadcrumb';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch.',
};

export default async function ContactPage() {
  const page = await getPage('contact');

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Breadcrumb items={[{ label: 'Contact' }]} />
      <h1 className="mb-8 text-4xl font-bold text-accent text-glow-cyan">Contact</h1>
      {page ? (
        <div
          className="prose prose-invert max-w-none prose-headings:text-accent prose-a:text-accent prose-a:no-underline hover:prose-a:underline"
          dangerouslySetInnerHTML={{ __html: page.body }}
        />
      ) : (
        <p className="text-cyan-100/70">
          Reach out via email at{' '}
          <a
            href="mailto:hello@example.com"
            className="text-accent hover:text-accent-hover"
          >
            hello@example.com
          </a>
          .
        </p>
      )}
    </div>
  );
}
