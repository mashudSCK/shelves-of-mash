export default function Loading() {
  return (
    <div className="mx-auto max-w-shelf animate-pulse px-4 py-10 md:px-8">
      <div className="mb-3 h-3 w-24 rounded bg-muted" />
      <div className="mb-6 h-9 w-64 rounded bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-64 rounded-md border border-border bg-surface" />
        ))}
      </div>
    </div>
  );
}
