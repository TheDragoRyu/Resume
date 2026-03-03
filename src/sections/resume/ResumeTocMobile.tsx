'use client';

import { useState } from 'react';

interface TocItem {
  slug: string;
  title: string;
}

interface ResumeTocMobileProps {
  items: TocItem[];
}

export default function ResumeTocMobile({ items }: ResumeTocMobileProps) {
  const [open, setOpen] = useState(false);

  return (
    <nav aria-label="Resume sections" className="mb-8 lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-lg bg-surface-raised px-4 py-3 text-sm font-semibold text-cyan-100/70 transition-colors hover:text-accent"
      >
        <span>Jump to section</span>
        <span
          aria-hidden="true"
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
        >
          ▾
        </span>
      </button>
      {open && (
        <ul className="mt-2 space-y-1 rounded-lg bg-surface-raised px-4 py-3">
          {items.map(({ slug, title }) => (
            <li key={slug}>
              <a
                href={`#${slug}`}
                onClick={() => setOpen(false)}
                className="block py-1.5 text-sm text-cyan-100/60 transition-colors hover:text-accent"
              >
                {title}
              </a>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}
