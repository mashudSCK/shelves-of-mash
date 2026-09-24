// Runs synchronously in <head> before paint. Kept as a plain string (not an
// imported .js file) so Next.js inlines it with no extra network request.
export function ThemeFlashGuard() {
  const code = `
    (function () {
      try {
        var stored = localStorage.getItem('shelves-theme');
        var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        var theme = stored || (prefersDark ? 'dark' : 'light');
        if (theme === 'dark') document.documentElement.classList.add('dark');
      } catch (e) {}
    })();
  `;
  return <Script id="theme-flash-guard" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: code }} />;
}
import Script from 'next/script';
