import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getBookmarkedWritings } from '@/lib/data/bookmarks';
import { WritingCard } from '@/components/writing/writing-card';
import { SignOutButton } from '@/components/layout/sign-out-button';
import { Pagination } from '@/components/layout/pagination';
import { parsePage, PUBLIC_PAGE_SIZE } from '@/lib/pagination';

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[]; page?: string | string[] }>;
}) {
  const { error, page: requestedPage } = await searchParams;
  const page = parsePage(requestedPage);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/account');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const { writings: bookmarks, total } = await getBookmarkedWritings(page);

  return (
    <div className="mx-auto max-w-shelf px-4 py-10 md:px-8">
      {error === 'admin_required' && (
        <p role="alert" className="mb-6 rounded-md border border-border bg-surface p-3 text-sm text-muted-foreground">
          This account does not have administrator access.
        </p>
      )}
      <header className="mb-8 flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-2xs uppercase tracking-widest2 text-accent">Your library card</p>
          <h1 className="mt-2 break-words font-serif text-2xl font-medium text-foreground sm:text-3xl">
            {user.email}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Signed in as {profile?.role ?? 'reader'}
          </p>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          {profile?.role === 'admin' && (
            <Link
              href="/admin"
              className="rounded-md border border-border px-3 py-2 text-sm text-foreground transition-colors hover:border-accent hover:text-accent"
            >
              Admin
            </Link>
          )}
          <Link
            href="/about"
            className="rounded-md border border-border px-3 py-2 text-sm text-foreground transition-colors hover:border-accent hover:text-accent"
          >
            About
          </Link>
          <SignOutButton />
        </div>
      </header>

      <h2 className="mb-4 font-serif text-xl font-medium text-foreground">Bookmarks</h2>
      {bookmarks.length === 0 ? (
        <p className="text-muted-foreground">
          {page > 1 ? 'No bookmarks on this page. Try a previous page.' : 'Nothing saved yet — bookmark a writing and it will appear here.'}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bookmarks.map((w, index) => (
            <WritingCard key={w.id} writing={w} priority={index === 0} />
          ))}
        </div>
      )}
      <Pagination page={page} totalPages={Math.max(1, Math.ceil(total / PUBLIC_PAGE_SIZE))} basePath="/account" searchParams={{}} />
    </div>
  );
}
