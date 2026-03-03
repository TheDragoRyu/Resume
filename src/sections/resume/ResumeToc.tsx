'use client';

interface TocItem {
  slug: string;
  title: string;
}

interface ResumeTocProps {
  items: TocItem[];
}

export default function ResumeToc({ items }: ResumeTocProps) {
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
              className="text-sm text-cyan-100/60 transition-colors hover:text-accent"
            >
              {title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
