import Image from 'next/image';

interface ResumeHeaderProps {
  name: string;
  role?: string;
  photo?: string;
}

export default function ResumeHeader({ name, role, photo }: ResumeHeaderProps) {
  return (
    <section className="mb-12 flex items-center gap-6">
      {photo && (
        <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full border-2 border-accent sm:h-36 sm:w-36">
          <Image
            src={photo}
            alt={`Photo of ${name}`}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}
      <div>
        <h1 className="text-4xl font-bold text-accent text-glow-cyan">Resume</h1>
        <p className="mt-1 text-xl font-semibold text-cyan-100">{name}</p>
        {role && (
          <p className="mt-1 text-lg text-muted">{role}</p>
        )}
      </div>
    </section>
  );
}
