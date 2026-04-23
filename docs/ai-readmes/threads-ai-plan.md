## Plan: Family Threads Data Model

Use PostgreSQL in the existing RDS-style relational pattern for the first implementation. Family Threads needs transactional integrity, family/member authorization, per-recipient read/archive state, and flexible filtering more than it needs document-style storage. Recommend a normalized schema centered on a root conversation table, a post/reply table, an audience snapshot table, and a tag reference/junction pair. Keep active and recently closed threads in PostgreSQL; archive old closed threads to S3 with lifecycle transition to Glacier.

**Steps**
1. Confirm the core product rules and encode them in the schema design: private threads are visible only to sender plus named recipient; founder has no override; an "All" message snapshots recipients at send time rather than dynamically recalculating membership.
2. Phase 1 - Core relational model: create a `thread_conversation` table for root thread metadata scoped to `familyId`, including sender, visibility (`public` or `private`), category summary fields, lifecycle status (`open`, `closed`, `archived`), timestamps, and optional subject. Do not use a composite primary key of thread id plus sequence number; use a surrogate primary key and add a unique sequence index only if display ordering must be persisted.
3. Phase 1 - Posts/replies: create a `thread_post` table for each message body. Store `conversationId`, `authorMemberId`, `parentPostId` for reply relationships, `rootPostId` or derived conversation root, `sequenceNo`, body text, created timestamp, optional edited timestamp, and optional soft-delete flag. This handles one-level or multi-level replies without making the primary key brittle.
4. Phase 1 - Audience and per-recipient state: create a `thread_recipient` table with one row per recipient snapshot at send time. For an "All" thread, materialize rows for all active family members except optionally the sender, depending on UX. Store `conversationId`, `recipientMemberId`, `deliveryType` (`all_snapshot` or `direct`), `readAt`, `answeredAt`, `archivedAt`, and optional `lastViewedPostId`. This moves `Read`, `Unread`, `Answered`, and `Archive` out of the root thread and into per-member state where they belong.
5. Phase 1 - Classification: create a `thread_tag_reference` table plus `thread_conversation_tag` junction table. This matches the existing option/reference-table style and supports one or many tags such as `Suggestion`, `TV`, `Movies`, or feature-specific labels. Keep one optional primary category column on `thread_conversation` only if the UI requires a single featured category.
6. Phase 1 - Indexing: add indexes for `(familyId, createdAt desc)`, `(familyId, lifecycleStatus, createdAt desc)`, `(senderMemberId, createdAt desc)`, `(recipientMemberId, archivedAt, readAt)`, `(conversationId, sequenceNo)`, `(parentPostId)`, and unique constraints for audience deduplication such as `(conversationId, recipientMemberId)`.
7. Phase 2 - Application integration: add Drizzle schema/types and SQL query modules using the existing patterns. Place schema in `src/components/db/schema/family-social-schema-tables.ts`, thread queries in new `src/components/db/sql/queries-family-threads.ts`, and return types in `src/components/db/types/`. Reuse the success/error discriminated union style already used by notifications.
8. Phase 2 - Route and feature integration: build the Family Threads route in `src/app/(features)/(threads)/` and connect it from the existing navigation. Reuse authenticated member/family context from current family services rather than introducing a separate access model.
9. Phase 2 - Notification integration: reuse the existing notification preference records already present for `Family Threads` and `Threads Only`. Treat email or SMS as a thin alert channel containing a short summary and deep link to the thread, not as the canonical content store.
10. Phase 3 - Archiving on AWS: keep active data in PostgreSQL, then periodically export closed or expired conversations plus posts plus recipient state to S3 in JSON or Parquet. Apply S3 lifecycle rules to move objects to Glacier Flexible Retrieval for occasional access, or Glacier Deep Archive for very rare access. Track archive metadata in PostgreSQL with fields such as `archivedAt`, `archiveBatchId`, and `archiveObjectKey` so archived conversations remain discoverable without leaving the app blind.
11. Phase 3 - Archive orchestration: implement the archive job with EventBridge Scheduler plus Lambda for lightweight periodic batches, or Step Functions if export/verification/delete becomes multi-step. Only delete hot-row content from PostgreSQL after the export is verified and the conversation is already marked closed/expired.
12. Explicit non-goals for the first cut: full-text search engine, real-time websockets, moderation/admin override for private threads, binary attachments, and cross-family sharing.

**Relevant files**
- `c:/Users/ghughlett/Projects/my-projects/family-social-scratch/src/components/db/schema/family-social-schema-tables.ts` — existing Drizzle table and enum conventions; add thread tables here or split into a related schema file following the same style.
- `c:/Users/ghughlett/Projects/my-projects/family-social-scratch/src/components/db/sql/queries-family-notifications.ts` — reference pattern for query module structure, option-reference joins, and update flows.
- `c:/Users/ghughlett/Projects/my-projects/family-social-scratch/src/components/db/types/family-member.ts` — discriminated union return-type pattern to mirror for thread services.
- `c:/Users/ghughlett/Projects/my-projects/family-social-scratch/src/app/(features)/(threads)` — empty route area intended for the Threads feature.
- `c:/Users/ghughlett/Projects/my-projects/family-social-scratch/src/app/(main)/main-page.tsx` — existing Family Threads card and route entry point.
- `c:/Users/ghughlett/Projects/my-projects/family-social-scratch/src/app/(main)/main-header.tsx` — existing navigation link for Family Threads.

**Verification**
1. Validate schema rules with sample scenarios: direct private thread, all-family thread, multiple replies to the same parent, recipient archives thread while others keep it active, and new member joining after an all-family thread was sent.
2. Confirm query coverage for inbox, sent items, unread counts, thread detail, archive list, and tag/category filtering before implementation starts.
3. Review indexes with expected access paths and ensure per-recipient state queries do not require scanning all posts.
4. For AWS archiving, test export plus restore of a closed conversation from S3 and verify the app can still list an archived thread from retained archive metadata.

**Decisions**
- PostgreSQL is the recommended primary store. The workload is relational and stateful, not a strong fit for a pure NoSQL-first design.
- Use surrogate primary keys rather than a composite key of `threadId` plus `sequence#`; keep `sequenceNo` as a sortable field with a unique constraint if needed.
- Store thread status per recipient, not just per thread, because read/archive/answered semantics differ by member.
- Snapshot recipients for `All` at send time.
- Founder/admin does not have implicit access to private conversations.

**Further Considerations**
1. If search across years of archived posts becomes important, add OpenSearch later as a secondary index, not as the source of truth.
2. If legal retention is simple and the archive volume stays small, S3 Standard-IA may be enough initially; Glacier tiers matter once retrieval is rare and retention periods are long.
3. If the UI only needs one level of reply nesting, `parentPostId` still works and the app can enforce one-level depth without changing the schema.