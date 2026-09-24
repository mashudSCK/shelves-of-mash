-- =========================================================
-- Seed data: the eleven shelves named in the product brief.
-- Run once after 0001_initial_schema.sql.
-- =========================================================

insert into shelves (slug, name, description, sort_order) values
  ('society', 'Society', 'Observations on how people live together.', 1),
  ('politics', 'Politics', 'Analysis of power, policy, and governance.', 2),
  ('philosophy', 'Philosophy', 'Musings on meaning, ethics, and existence.', 3),
  ('technology', 'Technology', 'Thoughts on tools, software, and the digital world.', 4),
  ('culture', 'Culture', 'Notes on art, media, and shared belief.', 5),
  ('history', 'History', 'Looking backward to understand the present.', 6),
  ('personal-reflections', 'Personal Reflections', 'Private thoughts made public.', 7),
  ('experiences', 'Experiences', 'Things that happened, and what they meant.', 8),
  ('poetry', 'Poetry', 'Verse, fragments, and rhythm.', 9),
  ('narratives', 'Narratives', 'Stories, real or imagined.', 10),
  ('miscellaneous-thoughts', 'Miscellaneous Thoughts', 'Everything that doesn''t fit elsewhere.', 11)
on conflict (slug) do nothing;

-- =========================================================
-- Promoting Mash to administrator:
--
-- 1. Sign up / sign in once through the app's normal login flow
--    (magic link) using Mash's email address. This creates the
--    auth.users row and, via the trg_on_auth_user_created trigger,
--    a matching profiles row with role = 'reader'.
--
-- 2. Then run the following, substituting the real email:
--
--    update profiles
--    set role = 'admin'
--    where id = (select id from auth.users where email = 'mash@example.com');
--
-- There should only ever be one 'admin' row, per the product brief.
-- =========================================================
