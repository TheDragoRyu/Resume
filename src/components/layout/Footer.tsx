interface FooterProps {
  siteTitle: string;
}

export default function Footer({ siteTitle }: FooterProps) {
  return (
    <footer className="border-t border-accent/20 bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-8 text-center text-sm text-cyan-100/60 text-glow-cyan">
        <p>&copy; {new Date().getFullYear()} {siteTitle}. Built with Next.js &amp; Three.js.</p>
      </div>
    </footer>
  );
}
