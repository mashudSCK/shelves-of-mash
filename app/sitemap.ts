import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://shelvesofmash.com';

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/shelves`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/archive`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${base}/about`, changeFrequency: 'monthly', priority: 0.3 },
  ];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return staticRoutes;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });

  const { data: writings } = await supabase
    .from('writings')
    .select('slug, updated_at')
    .eq('status', 'published');

  const { data: shelves } = await supabase.from('shelves').select('slug');

  const writingRoutes: MetadataRoute.Sitemap = (writings ?? []).map((w) => ({
    url: `${base}/writing/${w.slug}`,
    lastModified: w.updated_at,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  const shelfRoutes: MetadataRoute.Sitemap = (shelves ?? []).map((s) => ({
    url: `${base}/shelves/${s.slug}`,
    changeFrequency: 'weekly',
    priority: 0.5,
  }));

  return [...staticRoutes, ...writingRoutes, ...shelfRoutes];
}
