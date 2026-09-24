'use client';

import Link from 'next/link';
import { ExternalLink, ShieldCheck, User } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { DesktopNavLinks } from './desktop-nav-links';
import { ThemeToggle } from './theme-toggle';

export function Navbar() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');

  if (isAdmin) {
    return (
      <header className="sticky top-0 z-30 border-b border-border bg-surface-raised/95 backdrop-blur-md">
        <div className="mx-auto flex min-h-16 max-w-shelf items-center justify-between gap-2 px-4 md:gap-4 md:px-8">
          <Link href="/admin" className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-serif text-sm font-medium text-foreground sm:text-base">
                Mash&rsquo;s Desk
              </span>
              <span className="hidden text-2xs uppercase tracking-widest2 text-muted-foreground sm:block">
                Admin workspace
              </span>
            </span>
          </Link>

          <div className="flex shrink-0 items-center gap-1.5">
            <Link
              href="/"
              className="flex h-10 w-10 items-center justify-center rounded-md text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:w-auto sm:gap-2 sm:px-3"
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">View site</span>
            </Link>
            <Link
              href="/account"
              aria-label="Account"
              className="hidden h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:flex"
            >
              <User className="h-4 w-4" aria-hidden="true" />
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex min-h-16 max-w-shelf items-center justify-between gap-3 px-4 md:px-8">
        <Link href="/" className="group flex items-baseline gap-2">
          <span className="font-serif text-base font-medium tracking-tight text-foreground sm:text-lg">
            The Shelves of Mash
          </span>
        </Link>

        <DesktopNavLinks />

        <div className="flex items-center gap-1">
          <Link
            href="/account"
            aria-label="Account"
            className="hidden h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:flex"
          >
            <User className="h-4 w-4" aria-hidden="true" />
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
