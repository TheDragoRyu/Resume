import Link from 'next/link';
import TrackClick from '@/components/ui/TrackClick';

interface HeroSectionProps {
  name: string;
  role: string;
  description: string;
}

export default function HeroSection({ name, role, description }: HeroSectionProps) {
  return (
    <section className="relative flex flex-col items-center justify-center px-4 py-24 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-accent text-glow-cyan glitch-text sm:text-5xl">
        {name}
      </h1>
      <p className="mt-4 text-lg text-neon-pink text-glow-pink sm:text-xl">{role}</p>
      <p className="mt-4 max-w-xl text-cyan-100/70">{description}</p>

      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <TrackClick event="hero_cta_clicked" properties={{ destination: 'resume' }}>
          <Link
            href="/resume"
            className="rounded-lg bg-neon-pink px-6 py-3 min-h-[44px] font-bold text-black transition-colors hover:bg-neon-pink/80"
          >
            Resume
          </Link>
        </TrackClick>
        <TrackClick event="hero_cta_clicked" properties={{ destination: 'projects' }}>
          <Link
            href="/projects"
            className="rounded-lg border border-accent/30 px-6 py-3 min-h-[44px] font-medium text-accent transition-colors hover:border-accent/60 hover:bg-accent/5"
          >
            Projects
          </Link>
        </TrackClick>
        <TrackClick event="hero_cta_clicked" properties={{ destination: 'contact' }}>
          <Link
            href="/contact"
            className="rounded-lg border border-accent/30 px-6 py-3 min-h-[44px] font-medium text-accent transition-colors hover:border-accent/60 hover:bg-accent/5"
          >
            Contact
          </Link>
        </TrackClick>
      </div>

      <p className="mt-6 text-sm text-cyan-100/40">
        Explore in 3D (optional) &middot; Use the menu if you prefer
      </p>
    </section>
  );
}
