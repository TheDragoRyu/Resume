interface CategorySectionProps {
  slug: string;
  title: string;
  bodyHtml: string;
}

export default function CategorySection({
  slug,
  title,
  bodyHtml,
}: CategorySectionProps) {
  return (
    <section id={slug} className="scroll-mt-24">
      <h2 className="mb-6 text-2xl font-bold text-accent text-glow-cyan">{title}</h2>
      <div
        className="prose prose-invert max-w-none prose-headings:text-cyan-100 prose-h3:text-lg prose-strong:text-cyan-100 prose-a:text-accent prose-a:no-underline hover:prose-a:underline"
        dangerouslySetInnerHTML={{ __html: bodyHtml }}
      />
    </section>
  );
}
