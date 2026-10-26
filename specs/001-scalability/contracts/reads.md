# Read contracts

Public functions in lib/data/writings.ts use anonymous cached queries and return WritingPage
{writings:WritingCardData[],total:number}; all public listing sizes clamp to100 or less.
getWritingsByShelf, searchWritings, getWritingsByTag default to12. Admin status lists return
{id,title,slug,updated_at,status} rows with total and20 items. Bookmarks use request auth and12 items.
parsePage accepts integers1..1000000; invalid/repeated parameters normalize to1.

SQL RPC signatures and grants are specified in migration0007 and docs/performance/scalability-db.md.
No existing RPC signature or table is removed. Deploy migration0007 before dependent app code.

GET /sitemap.xml returns a root-scoped index. GET /sitemap.xml?page=N returns at most50000 URL entries.
Invalid/nonexistent chunk parameters return404. Reads batch500 records with ID ordering.

invalidatePublicContent expires the public-content tag immediately after successful mutations.
There is no externally exposed invalidation endpoint. Private data never enters this shared cache.
