import { getSitemapManifest, getSitemapEntries, xmlEscape, SITE_URL } from '@/lib/data/sitemap';

export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  const page = new URL(request.url).searchParams.get('page');
  let xml: string;
  if (page === null) {
    const { pages } = await getSitemapManifest();
    const items = Array.from({ length: pages }, (_, id) => `<sitemap><loc>${SITE_URL}/sitemap.xml?page=${id}</loc></sitemap>`).join('');
    xml = `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${items}</sitemapindex>`;
  } else {
    if (!/^\d+$/.test(page)) return new Response('Not found', { status: 404 });
    const entries = await getSitemapEntries(Number(page));
    if (!entries.length) return new Response('Not found', { status: 404 });
    const items = entries.map(entry => `<url><loc>${xmlEscape(entry.url)}</loc>${entry.lastModified ? `<lastmod>${xmlEscape(String(entry.lastModified))}</lastmod>` : ''}</url>`).join('');
    xml = `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${items}</urlset>`;
  }
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>${xml}`, {
    headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'no-store' },
  });
}
