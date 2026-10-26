import { siteUrl } from '@/lib/site';
import type { MetadataRoute } from 'next';
import { createPublicClient } from '@/lib/supabase/public';
import { publicRead } from '@/lib/data/public-cache';

export const SITE_URL = siteUrl();
const SITEMAP_SIZE = 50_000;
const STATIC: MetadataRoute.Sitemap = [
  { url: SITE_URL, changeFrequency: 'daily', priority: 1 },
  { url: `${SITE_URL}/shelves`, changeFrequency: 'weekly', priority: 0.8 },
  { url: `${SITE_URL}/archive`, changeFrequency: 'daily', priority: 0.8 },
  { url: `${SITE_URL}/about`, changeFrequency: 'monthly', priority: 0.3 },
];

export const getSitemapManifest = publicRead('sitemap-manifest', async () => {
  const client = createPublicClient();
  const [writings, shelves] = await Promise.all([
    client.from('writings').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    client.from('shelves').select('id', { count: 'exact', head: true }),
  ]);
  if (writings.error) throw writings.error;
  if (shelves.error) throw shelves.error;
  const total = (writings.count ?? 0) + (shelves.count ?? 0) + STATIC.length;
  return { writings: writings.count ?? 0, shelves: shelves.count ?? 0, pages: Math.ceil(total/SITEMAP_SIZE) };
});

const batch = publicRead('sitemap-batch', async (table: 'writings' | 'shelves', from: number, to: number) => {
  let query = createPublicClient().from(table).select(table === 'writings' ? 'id,slug,updated_at' : 'id,slug')
    .order('id').range(from, to);
  if (table === 'writings') query = query.eq('status', 'published');
  const { data, error } = await query.returns<{ id: string; slug: string; updated_at?: string }[]>();
  if (error) throw error;
  return data ?? [];
});

export async function getSitemapEntries(page: number): Promise<MetadataRoute.Sitemap> {
  const manifest = await getSitemapManifest();
  if (!Number.isSafeInteger(page) || page < 0 || page >= manifest.pages) return [];
  const start = page * SITEMAP_SIZE;
  const end = start + SITEMAP_SIZE;
  const entries = STATIC.slice(start, end);
  let position = STATIC.length;
  for (const [table, count] of [['shelves', manifest.shelves], ['writings', manifest.writings]] as const) {
    const from = Math.max(0, start - position);
    const to = Math.min(count, end - position);
    for (let offset = from; offset < to;) {
      const rows = await batch(table, offset, Math.min(offset + 500, to) - 1);
      if (!rows.length) break;
      for (const row of rows) entries.push({
        url: `${SITE_URL}/${table === 'writings' ? 'writing' : 'shelves'}/${row.slug}`,
        ...(table === 'writings' ? { lastModified: row.updated_at } : {}),
        changeFrequency: table === 'writings' ? 'monthly' : 'weekly',
        priority: table === 'writings' ? 0.6 : 0.5,
      });
      offset += rows.length;
    }
    position += count;
  }
  return entries;
}

export function xmlEscape(value: string) {
  return value.replace(/[<>&"']/g, char => ({ '<':'&lt;', '>':'&gt;', '&':'&amp;', '"':'&quot;', "'":'&apos;' })[char]!);
}
