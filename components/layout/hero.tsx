export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border/70 px-4 py-12 sm:py-16 md:px-8 md:py-20 lg:py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.04] dark:opacity-[0.06]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, currentColor 0, currentColor 1px, transparent 1px, transparent 64px)',
        }}
      />
      <div className="relative mx-auto max-w-shelf">
        <p className="mb-4 text-2xs uppercase tracking-widest2 text-accent">
          A personal archive
        </p>
        <h1 className="max-w-2xl font-serif text-4xl font-medium leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          The Shelves of Mash
        </h1>
        <p className="mt-4 max-w-xl font-serif text-lg italic text-muted-foreground md:text-xl">
          Explore the shelves of a wandering mind.
        </p>
        <p className="mt-6 max-w-prose text-base leading-relaxed text-muted-foreground">
          A personal archive of thoughts, reflections, experiences, and literary works —
          organized not as a feed, but as a library. Nothing here is optimized to keep you
          scrolling. Wander instead.
        </p>
      </div>
    </section>
  );
}
