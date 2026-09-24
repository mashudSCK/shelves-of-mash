'use client';

import { useSyncExternalStore } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from './theme-provider';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  );
  const visibleTheme = mounted ? theme : 'light';

  return (
    <button
      onClick={toggleTheme}
      aria-label={visibleTheme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {visibleTheme === 'light' ? (
        <Moon className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden="true" />
      ) : (
        <Sun className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden="true" />
      )}
    </button>
  );
}
