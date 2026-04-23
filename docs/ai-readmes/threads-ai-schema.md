## Plan: Family Threads Schema

This pass defines a production-ready PostgreSQL schema for Family Threads using the existing Drizzle conventions in this codebase. The recommended v1 model uses a conversation table, post table, recipient snapshot/state table, and tag reference/junction pair. It favors immutable audience snapshots, strict private-thread authorization, and per-recipient read/archive state. It also keeps archive metadata fields ready without requiring S3 export in v1.

**Steps**
1. Phase 1 - Add thread enums aligned to existing enum style: visibility (`private`, `all`), lifecycle status (`open`, `closed`, `archived`), and delivery type (`direct`, `all_snapshot`).
2. Phase 1 - Create `thread_conversation` with: `id` PK, `familyId` FK, `senderMemberId` FK, `visibility`, `lifecycleStatus`, optional `subject`, optional primary `category`, `createdAt`, `updatedAt`, optional `closedAt`, optional `archivedAt`, optional `archiveBatchId`, optional `archiveObjectKey`.
3. Phase 1 - Create `thread_post` with: `id` PK, `conversationId` FK, `authorMemberId` FK, optional `parentPostId` self FK, optional `rootPostId` self FK, `sequenceNo` (per conversation ordering), `body`, optional `softDeletedAt`, `createdAt`.
4. Phase 1 - Create `thread_recipient` with: `id` PK, `conversationId` FK, `recipientMemberId` FK, `deliveryType`, optional `readAt`, optional `answeredAt`, optional `archivedAt`, optional `lastViewedPostId` FK, `createdAt`.
5. Phase 1 - Create tag tables: `thread_tag_reference` (`id`, `tagName`, optional `tagDesc`, `createdAt`) and `thread_conversation_tag` (`id`, `conversationId`, `tagId`).
6. Phase 1 - Enforce uniqueness and relationship integrity: unique `(conversationId, recipientMemberId)` in `thread_recipient`, unique `(conversationId, sequenceNo)` in `thread_post`, unique `(conversationId, tagId)` in `thread_conversation_tag`.
7. Phase 1 - Add indexes for query paths: conversations by family and recency, conversations by sender and recency, recipient inbox/unread/archive lookups, posts by conversation sequence, posts by parent, conversation tags by tag id.
8. Phase 1 - Apply authorization implications at query/service layer: private conversation access allowed only for sender or rows present in `thread_recipient`; founder has no override.
9. Phase 2 - Add integration query module and result types using existing patterns: inbox, sent, unread count, thread detail, archive list, tag filter, create thread, add reply, mark read, mark archived.
10. Phase 3 - Enable archive lifecycle later: use `lifecycleStatus='archived'` and existing archive metadata columns to support eventual S3 export/restore without schema redesign.

**Relevant files**
- `c:/Users/ghughlett/Projects/my-projects/family-social-scratch/src/components/db/schema/family-social-schema-tables.ts` — schema conventions to mirror for enums, FKs, and index declarations.
- `c:/Users/ghughlett/Projects/my-projects/family-social-scratch/src/components/db/schema/family-social-schema.ts` — export barrel that will need to export new thread tables.
- `c:/Users/ghughlett/Projects/my-projects/family-social-scratch/src/components/db/sql/queries-family-notifications.ts` — reference pattern for query module structure and per-member state updates.
- `c:/Users/ghughlett/Projects/my-projects/family-social-scratch/src/components/db/types/family-member.ts` — discriminated-union result style to mirror for thread query/type contracts.
- `c:/Users/ghughlett/Projects/my-projects/family-social-scratch/docs/insert-option-reference-records.csv` — existing Family Threads notification options already present for later integration.

**Verification**
1. Validate schema supports direct private conversation, all-family snapshot conversation, and multiple replies to one parent post.
2. Validate unique constraints by attempting duplicate recipient rows for the same conversation and duplicate sequence numbers in one conversation.
3. Validate index coverage with expected v1 query intents: inbox, sent, unread count, archive list, and thread detail.
4. Validate authorization assumptions with representative tests: founder attempting unauthorized private read, non-recipient member attempting private read, recipient access after sender resignation.
5. Validate lifecycle handling in app logic: expired family can read but cannot create conversation or reply.

**Decisions**
- Use surrogate primary keys for all thread tables; do not use a composite PK of thread ID plus sequence number.
- Keep sequence ordering as a unique per-conversation field (`conversationId + sequenceNo`).
- Store read/archive/answered state in `thread_recipient`, not in the conversation table.
- Use `memberId` as identity for sender/recipient/author relations; never use email for data ownership.
- Keep archive metadata columns in v1 schema even if S3 archival is deferred.

**Further Considerations**
1. If reply depth remains one-level only in v1, still keep `parentPostId` so deeper threading can be enabled later without migration.
2. If unread semantics later require re-open-on-reply, add a separate unread marker model rather than mutating first-read timestamps.
3. If public-thread historical visibility across resignations must be exact, materialize recipient rows for public threads as well, not only private threads.