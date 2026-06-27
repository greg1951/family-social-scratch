## Discussion Threads Schema Evaluation & Implementation Plan

### Background

The discussion threads schema is designed to support threaded discussions across all family social features (TV, movies, music, books, poems, recipes, etc.) using a unified set of tables with a "discuss" prefix.

### Schema Evaluation

#### 1. `seqNo` in `discussPostReply`
- **Purpose:** Ensures deterministic, unique ordering of posts/replies within a thread.
- **Recommendation:** Keep `seqNo`. It prevents issues with timestamp collisions and supports future features like moderation or reordering.

#### 2. `parentPostId` and `rootPostId`
- **parentPostId:** Immediate parent (for nested replies).
- **rootPostId:** Top-level ancestor (for efficient root-level thread queries).
- **Recommendation:** Keep both for performance and flexibility. If only parent-child nesting is needed, `rootPostId` could be dropped, but this would make some queries less efficient.

### Phased Implementation Approach

#### Phase 1: Core Threading
- Implement `discussThread` and `discussPostReply` tables.
- Basic create/read for threads and replies.
- UI: Add "Discussion" tab to item detail pages, support nested replies.

#### Phase 2: Interactivity
- Implement upvoting/downvoting (`discussLike`).
- UI: Show vote counts, allow voting.

#### Phase 3: Moderation & Performance
- Add moderation tools (edit/delete, pin, lock).
- Optimize queries and indexes for large threads.
- Add pagination and reply depth limits if needed.

#### Phase 4: Analytics & Advanced Features
- Analytics on thread activity.
- Advanced filtering/sorting (e.g., most active, most liked).
- Archiving/pruning old threads.

### Performance Considerations

- **Indexes:** Already present on key columns.
- **No enforced FK on `targetId`:** Acceptable for polymorphic association; document for maintainers.
- **Scalability:** Use pagination and depth limits for large threads.

### Relevant Files

- `src/components/db/schema/family-social-schema-tables.ts` — Schema definitions.
- `docs/ai-reqs/discuss-threads-AI.txt` — Requirements and open questions.
- `docs/erd-diagrams/discussion-entities.drawio` — ERD for discussion entities.
- `src/components/db/sql/queries-thread-convos.ts` — Query patterns for similar features.

### Verification Steps

1. Review and test schema migrations.
2. Implement and test thread/reply creation and retrieval.
3. Validate UI for nested replies and ordering.
4. Benchmark queries for large threads.
5. Confirm upvote/downvote and moderation flows.

### Decisions

- **Keep `seqNo`** for ordering and integrity.
- **Retain both `parentPostId` and `rootPostId`** for efficient queries.
- **Phased rollout**: Start with core features, then add interactivity, performance, and analytics.

### Further Considerations

- Dropping `rootPostId` is possible but may hurt performance for deep threads.
- Consider soft-deletion flags for moderation.
- Document the lack of enforced FK on `targetId`.
