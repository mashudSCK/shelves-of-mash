// Hand-written types mirroring the Supabase schema (supabase/migrations/*.sql).
// If you run `supabase gen types typescript`, you can replace this file with the
// generated one — the shapes below match the SQL 1:1 so app code won't need changes.

export type WritingStatus = 'draft' | 'published' | 'archived' | 'scheduled';

export type Shelf = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sort_order: number;
  created_at: string;
};

export type Tag = {
  id: string;
  slug: string;
  name: string;
};

export type Writing = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  content: string; // markdown
  cover_image_url: string | null;
  shelf_id: string;
  status: WritingStatus;
  reading_time_minutes: number;
  published_at: string | null;
  scheduled_for: string | null;
  updated_at: string;
  created_at: string;
  is_featured: boolean;
  view_count: number;
};

export type WritingWithRelations = Writing & {
  shelf: Shelf;
  tags: Tag[];
};

export type WritingCardData = Pick<
  Writing,
  | 'id'
  | 'slug'
  | 'title'
  | 'subtitle'
  | 'cover_image_url'
  | 'reading_time_minutes'
  | 'published_at'
  | 'is_featured'
> & {
  shelf: Pick<Shelf, 'slug' | 'name'>;
  tags: Pick<Tag, 'slug' | 'name'>[];
};

export type Bookmark = {
  id: string;
  user_id: string;
  writing_id: string;
  created_at: string;
};

export type ReadingList = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
};

export type Profile = {
  id: string;
  display_name: string | null;
  role: 'admin' | 'reader';
  created_at: string;
};
