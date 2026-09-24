'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, LayoutDashboard, LibraryBig, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const links = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/writings', label: 'Writings', icon: FileText },
  { href: '/admin/shelves', label: 'Shelves', icon: LibraryBig },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin workspace" className="hidden md:block">
      <ul className="flex gap-2 overflow-x-auto pb-1 md:flex-col md:gap-1 md:overflow-visible md:pb-0">
        {links.map(({ href, label, icon: Icon, exact }) => {
          const active = exact
            ? pathname === href
            : pathname.startsWith(href) && pathname !== '/admin/writings/new';

          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-10 items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>

      <Link
        href="/admin/writings/new"
        className="mt-3 hidden min-h-10 items-center justify-center gap-2 rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 md:flex"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        New writing
      </Link>
    </nav>
  );
}
