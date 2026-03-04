import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-24 text-center">
      <p className="text-6xl font-bold text-white" aria-hidden="true">404</p>
      <h1 className="mt-4 text-2xl font-bold text-white">Page Not Found</h1>
      <p className="mt-2 text-lg text-gray-300">
        This page doesn&apos;t exist — but the rest of the site does.
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/"
          className="rounded-lg bg-accent px-6 py-3 font-medium text-white transition-colors hover:bg-accent-hover"
        >
          Back to Home
        </Link>
        <Link
          href="/projects"
          className="rounded-lg border border-white/20 px-6 py-3 font-medium text-white transition-colors hover:border-white/40 hover:bg-white/5"
        >
          View Projects
        </Link>
      </div>
    </div>
  );
}
