import { siteUrl } from '@/lib/site';
import type { Metadata, Viewport } from 'next';
import { Fraunces, Source_Serif_4, JetBrains_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/layout/theme-provider';
import { ThemeFlashGuard } from '@/components/layout/theme-flash-guard';
import { Navbar } from '@/components/layout/navbar';
import { BottomNav } from '@/components/layout/bottom-nav';
import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  axes: ['opsz', 'SOFT', 'WONK'],
});

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: 'The Shelves of Mash',
    template: '%s · The Shelves of Mash',
  },
  description:
    'A personal archive of thoughts, reflections, experiences, and literary works. Explore the shelves of a wandering mind.',
  openGraph: {
    title: 'The Shelves of Mash',
    description: 'Explore the shelves of a wandering mind.',
    siteName: 'The Shelves of Mash',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Shelves of Mash',
    description: 'Explore the shelves of a wandering mind.',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F4EFE6' },
    { media: '(prefers-color-scheme: dark)', color: '#16130F' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeFlashGuard />
      </head>
      <body
        className={`${fraunces.variable} ${sourceSerif.variable} ${mono.variable} font-body antialiased`}
      >
        <ThemeProvider>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-foreground"
          >
            Skip to content
          </a>
          <Navbar />
          <main id="main-content" className="min-h-[calc(100vh-8rem)] pb-24 md:pb-0">
            {children}
          </main>
          <BottomNav />
        </ThemeProvider>
      </body>
    </html>
  );
}
