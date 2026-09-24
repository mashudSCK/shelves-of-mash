'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  FileText,
  Home,
  Map,
  Library,
  LibraryBig,
  Plus,
  Search,
  User,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

const items: NavItem[] = [
  { href: '/', label: 'Home', icon: Library },
  { href: '/shelves', label: 'Shelves', icon: BookOpen },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/atlas', label: 'Atlas', icon: Map },
  { href: '/account', label: 'You', icon: User },
];

const adminItems: NavItem[] = [
  { href: '/admin', label: 'Overview', icon: Home, exact: true },
  { href: '/admin/writings', label: 'Writings', icon: FileText },
  { href: '/admin/writings/new', label: 'New', icon: Plus, exact: true },
  { href: '/admin/shelves', label: 'Shelves', icon: LibraryBig },
];

export function BottomNav() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');
  const navItems = isAdmin ? adminItems : items;

  return (
    <nav
      aria-label="Primary"
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface-raised/95 backdrop-blur-md md:hidden"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-between px-1">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const active = exact || href === '/'
            ? pathname === href
            : pathname.startsWith(href) && pathname !== '/admin/writings/new';
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-[58px] flex-col items-center justify-center gap-1 px-1 py-2 text-[0.65rem] tracking-wide transition-colors',
                  active ? 'text-accent' : 'text-muted-foreground'
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.25 : 1.75} aria-hidden="true" />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
