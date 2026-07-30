import Image from 'next/image';
import Link from 'next/link';

interface ProjectCardProps {
  slug: string;
  title: string;
  description: string;
  image?: string;
  imageAlt?: string;
  tags: string[];
  featured: boolean;
}

export default function ProjectCard({
  slug,
  title,
  description,
  image,
  imageAlt,
  tags,
  featured,
}: ProjectCardProps) {
  return (
      <article
        className={`group rounded-xl border bg-surface-raised p-6 transition-all hover:border-glow-cyan ${
          featured ? 'border-neon-pink/30' : 'border-accent/10'
        }`}
      >
        {image && imageAlt && (
          <div className="relative -mx-6 -mt-6 mb-6 aspect-video overflow-hidden border-b border-accent/10">
            <Image
              src={image}
              alt={imageAlt}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          </div>
        )}
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
  );
}
