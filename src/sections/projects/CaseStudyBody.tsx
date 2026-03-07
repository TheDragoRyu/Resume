import TrackClick from '@/components/ui/TrackClick';

interface CaseStudyBodyProps {
  title: string;
  description: string;
  bodyHtml: string;
  tags: string[];
  links?: {
    github?: string;
    demo?: string;
    writeup?: string;
  };
}

export default function CaseStudyBody({
  title,
  description,
  bodyHtml,
  tags,
  links,
}: CaseStudyBodyProps) {
  return (
    <article>
      <h1 className="text-4xl font-bold text-accent text-glow-cyan">{title}</h1>
      <p className="mt-2 text-lg text-cyan-100/70">{description}</p>

      {tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-accent/10 px-3 py-1 text-sm text-accent/80"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {links && (Object.values(links).some(Boolean)) && (
        <div className="mt-4 flex gap-4">
          {links.github && (
            <TrackClick event="project_link_clicked" properties={{ project: title, link_type: 'github' }}>
              <a
                href={links.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-accent hover:text-accent-hover transition-colors"
              >
                GitHub
              </a>
            </TrackClick>
          )}
          {links.demo && (
            <TrackClick event="project_link_clicked" properties={{ project: title, link_type: 'demo' }}>
              <a
                href={links.demo}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-accent hover:text-accent-hover transition-colors"
              >
                Live Demo
              </a>
            </TrackClick>
          )}
          {links.writeup && (
            <TrackClick event="project_link_clicked" properties={{ project: title, link_type: 'writeup' }}>
              <a
                href={links.writeup}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-accent hover:text-accent-hover transition-colors"
              >
                Write-up
              </a>
            </TrackClick>
          )}
        </div>
      )}

      <hr className="my-8 border-accent/20" />

      <div
        className="prose prose-invert max-w-none prose-headings:text-accent prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-strong:text-cyan-100 prose-a:text-accent prose-a:no-underline hover:prose-a:underline"
        dangerouslySetInnerHTML={{ __html: bodyHtml }}
      />
    </article>
  );
}
