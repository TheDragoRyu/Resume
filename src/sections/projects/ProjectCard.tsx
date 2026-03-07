import Link from 'next/link';
import TrackClick from '@/components/ui/TrackClick';

interface ProjectCardProps {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  featured: boolean;
}

export default function ProjectCard({
  slug,
  title,
  description,
  tags,
  featured,
}: ProjectCardProps) {
  return (
    <TrackClick event="project_card_clicked" properties={{ project: slug, featured }}>
      <article
        className={`group rounded-xl border bg-surface-raised p-6 transition-all hover:border-glow-cyan ${
          featured ? 'border-neon-pink/30' : 'border-accent/10'
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-lg font-semibold text-cyan-100 group-hover:text-accent transition-colors">
            <Link href={`/projects/${slug}`} className="after:absolute after:inset-0 relative">
              {title}
            </Link>
          </h2>
        {featured && (
          <span className="shrink-0 rounded-full bg-neon-pink/20 px-2 py-0.5 text-xs font-medium text-neon-pink">
            Featured
          </span>
        )}
      </div>
      <p className="mt-2 text-sm text-cyan-100/70 line-clamp-2">{description}</p>
      {tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs text-accent/80"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      </article>
    </TrackClick>
  );
}
