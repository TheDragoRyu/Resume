import type { Metadata } from 'next';
import { getContactPage } from '@/content/content-loader';
import Breadcrumb from '@/components/ui/Breadcrumb';

export async function generateMetadata(): Promise<Metadata> {
  const page = await getContactPage();
  const { title, description } = page.frontmatter;

  return {
    title,
    description,
    openGraph: { title, description },
    twitter: { title, description },
  };
}

export default async function ContactPage() {
  const page = await getContactPage();
  const { introHeading, intro, email, social, location } = page.frontmatter;

  return (
    <div className="relative isolate overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-24 h-80 w-80 rounded-full bg-neon-pink/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 bottom-12 h-96 w-96 rounded-full bg-accent/10 blur-3xl"
      />

      <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
        <Breadcrumb items={[{ label: page.frontmatter.title }]} />

        <section className="relative overflow-hidden rounded-3xl border border-accent/20 bg-surface-raised/80 shadow-2xl shadow-accent/5 backdrop-blur-sm">
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent"
          />

          <div className="grid lg:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="p-6 sm:p-10 lg:p-12">
              <h1 className="text-4xl font-bold tracking-tight text-accent text-glow-cyan sm:text-5xl">
                {page.frontmatter.title}
              </h1>

              <div className="mt-8">
                <h2 className="text-2xl font-semibold text-cyan-100">
                  {introHeading}
                </h2>
                <p className="mt-4 max-w-2xl leading-8 text-cyan-100/70">
                  {intro}
                </p>

                <div className="mt-10 grid gap-4 sm:grid-cols-2">
                  <article className="rounded-2xl border border-accent/15 bg-surface-overlay/40 p-5">
                    <h3 className="border-l-2 border-neon-pink pl-3 text-lg font-semibold text-neon-pink">
                      {email.heading}
                    </h3>
                    <p className="mt-4 leading-7 text-cyan-100/65">
                      {email.description}
                    </p>
                    <a
                      href={`mailto:${email.address}`}
                      className="mt-4 inline-flex min-h-11 items-center break-all rounded-lg border border-accent/30 bg-accent/5 px-4 py-2 font-bold text-accent transition-colors hover:border-accent/70 hover:bg-accent/10 hover:text-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      {email.address}
                    </a>
                  </article>

                  <article className="rounded-2xl border border-accent/15 bg-surface-overlay/40 p-5">
                    <h3 className="border-l-2 border-neon-pink pl-3 text-lg font-semibold text-neon-pink">
                      {social.heading}
                    </h3>
                    <ul className="mt-4 flex flex-wrap gap-3">
                      {social.links.map((link) => (
                        <li key={link.url}>
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex min-h-11 items-center rounded-lg border border-accent/30 bg-accent/5 px-4 py-2 font-bold text-accent transition-colors hover:border-accent/70 hover:bg-accent/10 hover:text-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                          >
                            {link.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </article>

                  <article className="rounded-2xl border border-accent/15 bg-surface-overlay/40 p-5 sm:col-span-2">
                    <h3 className="border-l-2 border-neon-pink pl-3 text-lg font-semibold text-neon-pink">
                      {location.heading}
                    </h3>
                    <p className="mt-4 text-cyan-100/80">{location.text}</p>
                    <p className="mt-2 leading-7 text-cyan-100/65">
                      {location.availability}
                    </p>
                  </article>
                </div>
              </div>
            </div>

            <div
              aria-hidden="true"
              className="relative hidden min-h-full overflow-hidden border-l border-accent/10 bg-surface-overlay/40 lg:block"
            >
              <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,240,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,240,0.05)_1px,transparent_1px)] bg-[size:28px_28px]" />
              <div className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent/20" />
              <div className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full border border-neon-pink/30" />
              <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent/50 bg-accent/5 border-glow-cyan" />
              <div className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon-green shadow-[0_0_16px_#39ff14]" />
              <div className="absolute left-1/2 top-1/2 h-px w-56 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
              <div className="absolute left-1/2 top-1/2 h-px w-56 -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-gradient-to-r from-transparent via-neon-pink/50 to-transparent" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
