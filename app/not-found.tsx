import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <p className="text-2xs uppercase tracking-widest2 text-accent">Misplaced</p>
      <h1 className="mt-3 font-serif text-3xl font-medium text-foreground">
        This shelf is empty
      </h1>
      <p className="mt-3 text-muted-foreground">
        Whatever you were looking for isn&rsquo;t here — perhaps it was never shelved, or
        it moved.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
      >
        Return to the entrance
      </Link>
    </div>
  );
}
