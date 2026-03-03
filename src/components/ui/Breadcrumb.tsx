import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-8">
      <ol className="flex items-center gap-1 text-sm text-cyan-100/50">
        <li>
          <Link href="/" className="transition-colors hover:text-accent">
            Home
          </Link>
        </li>
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1">
            <span aria-hidden="true" className="text-accent/30">
              ▸
            </span>
            {item.href ? (
              <Link
                href={item.href}
                className="transition-colors hover:text-accent"
              >
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-cyan-100">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
