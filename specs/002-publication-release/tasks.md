# Implementation plan
Spec: specs/002-publication-release/spec.md. User approved implementation2026-10-24.
- [ ] A DB unit: migration0008 editorial/search; PostgreSQL regression; own migration/test only.
- [ ] B Reading unit: local progress/size/continue controls, writing page and scoped style/test.
- [ ] C Operations/workflows unit: migration0009 operational events, monitoring, cron, admin health,
      isolated authenticated publication E2E fixture/tests.
- [ ] D Root integration: canonical config/search adapter/highlightUI; local env alignment;
      archive backup export and isolated restore proof; migrations and hosted release.
- [ ] E Gates: tests/type/lint/build, independent review, commit/push/merge/main deployment verify.
Contracts: siteUrl(path='') from lib/site.ts; search_published_writings(query_text,page_number,page_size)
returns JSON{writings:[existing card shape + excerpt:string],total:number}; excerpt plain text.
Operational event recorder signature to be supplied by operations agent before integration.
Shared boundaries: A owns SQL0008; C owns SQL0009 and monitoring/cron; B owns writingpage;
root owns siteconfig, searchdata+results, backups, release. No concurrent edits in shared files.
