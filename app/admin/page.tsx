import { getDashboardStats } from '@/lib/data/admin';

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="min-w-0 rounded-md border border-border bg-surface p-4 sm:p-5">
      <p className="text-2xs uppercase tracking-widest2 text-muted-foreground">{label}</p>
      <p className="mt-2 font-serif text-2xl font-medium text-foreground sm:text-3xl">{value}</p>
    </div>
  );
}

export default async function AdminOverviewPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-8 sm:space-y-10">
      <header>
        <p className="text-2xs uppercase tracking-widest2 text-accent">Administrator</p>
        <h1 className="mt-1 font-serif text-2xl font-medium text-foreground">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A quick view of your library and reader activity.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Total writings" value={stats.totalWritings} />
        <StatCard label="Total views" value={stats.totalViews.toLocaleString()} />
        <StatCard label="Published" value={stats.publishedCount} />
        <StatCard label="Drafts" value={stats.draftCount} />
        <StatCard label="Scheduled" value={stats.scheduledCount} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 font-serif text-lg font-medium text-foreground">Most viewed</h2>
          <ul className="divide-y divide-border rounded-md border border-border bg-surface">
            {stats.mostViewed.length === 0 && (
              <li className="p-4 text-sm text-muted-foreground">No views yet.</li>
            )}
            {stats.mostViewed.map((w) => (
              <li key={w.slug} className="flex items-center justify-between p-4 text-sm">
                <span className="text-foreground">{w.title}</span>
                <span className="text-muted-foreground">{w.view_count} views</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="mb-3 font-serif text-lg font-medium text-foreground">Most bookmarked</h2>
          <ul className="divide-y divide-border rounded-md border border-border bg-surface">
            {stats.mostBookmarked.length === 0 && (
              <li className="p-4 text-sm text-muted-foreground">No bookmarks yet.</li>
            )}
            {stats.mostBookmarked.map((w) => (
              <li key={w.slug} className="flex items-center justify-between p-4 text-sm">
                <span className="text-foreground">{w.title}</span>
                <span className="text-muted-foreground">{w.bookmark_count} saves</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
