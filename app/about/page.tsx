import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About',
  description: 'About The Shelves of Mash and the person who keeps it.',
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-prose px-4 py-12 md:px-8">
      <p className="text-2xs uppercase tracking-widest2 text-accent">About</p>
      <h1 className="mt-2 font-serif text-3xl font-medium text-foreground md:text-4xl">
        The Shelves of Mash
      </h1>

      <div className="prose-shelf mt-8">
        <p>
          This is a personal archive — a single mind&rsquo;s library, opened to anyone
          curious enough to wander through it. Every writing here is a fragment of
          thought: an essay, a reflection, an experience set down in words, a piece of
          analysis, a poem.
        </p>
        <p>
          There is no feed to scroll, no algorithm deciding what you see next, and no
          comment section. You won&rsquo;t find likes or followers here. The shelves are
          arranged the way a private study might be arranged: by subject, by season, by
          whim.
        </p>
        <p>
          Everything published under this name is written by one person, Mash. Nothing
          here is generated. An AI assistant helps organize the library — sorting
          writings onto shelves, suggesting related pieces, answering simple questions
          about what&rsquo;s here — but it never writes the words themselves.
        </p>
      </div>
    </div>
  );
}
