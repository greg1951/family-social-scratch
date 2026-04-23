## Plan: Family Threads Schema + UI Alignment

Implement Family Threads in two delivery phases, with a Phase 1 that completes conversation composition/list/recipient-state/image-attachment behavior and a Phase 2 that layers in send-as-email. Reuse existing Threads listing patterns, TipTap patterns from other features, and S3 upload utilities while tightening thread schema constraints/indexes for correctness and query performance.

**Steps**
1. Phase 0 - Baseline audit and safety checks
2. Confirm current thread tables and migrations align to the schema source in src/components/db/schema/family-social-schema-tables.ts and identify whether thread names are currently mapped as camelCase DB tables or snake_case.
3. Run data-quality checks before adding constraints (duplicates in conversation+recipient, invalid enum-like status values).
4. Record migration preconditions and fallback strategy for production-safe rollout (indexes concurrently, deferred constraint validation where needed).
5. Phase 1A - Schema changes for required behavior (blocking)
6. Add/confirm recipient snapshot semantics for broadcast threads in query/action layer assumptions: create recipient-state rows for all active family members at send time, excluding sender.
7. Add rich text persistence fields on thread posts (structured JSON + plain text fallback), keeping existing content usable for backward compatibility.
8. Add image attachment persistence model linked to thread posts (attachment metadata + object key + mime type + size + timestamps).
9. Add missing uniqueness and integrity constraints for thread recipient and post ordering semantics, plus supporting indexes for inbox/unread/archive queries.
10. Keep send-as-email schema-ready but deferred for Phase 2 implementation; no Phase 1 breaking changes tied to email delivery pipeline.
11. Phase 1B - Thread compose and list UI (depends on Phase 1A)
12. Extend threads home experience in src/features/threads/components/threads-home-page.tsx to support entry points for compose/reply/archive-all-read while preserving current filter/search/sort interactions.
13. Add composition flow under src/features/threads/components using existing rich-text editor conventions already used in other feature areas, with recipient selection, privacy selection, and multi-image selection.
14. Implement privacy behavior in compose flow for private vs broadcast thread creation, matching snapshot rule (broadcast snapshots all active members except sender).
15. Add message/image rendering for thread detail/list previews so recipients can open attached images safely via existing S3 URL/access patterns.
16. Implement bulk archive-all-read action for the current member (initial archive scope), and ensure archived state updates list counts and unread indicators.
17. Add notification red-dot support in existing navigation/header surface based on unread thread count query.
18. Phase 1C - Query/actions integration (parallel with UI work once schema contract is stable)
19. Extend thread SQL/query layer used by Threads feature to support create conversation, create reply, fetch recipient snapshots, mark read, bulk archive-all-read, and fetch attachment metadata.
20. Update/introduce server actions in Threads feature area to orchestrate compose/reply/archive operations with auth checks and family-status checks.
21. Ensure authorization invariants: private visibility restricted to sender+explicit recipients, founder does not bypass private access.
22. Enforce expired-family read-only guard for thread writes at action/query boundary.
23. Phase 1D - Verification and hardening
24. Add/update tests for recipient snapshot behavior, private access boundaries, unread/read transitions, and bulk archive behavior.
25. Add/update tests for attachment metadata persistence and image open flows (including invalid mime/rejected upload cases).
26. Validate list counters (total/unread/private) and notification badge behavior under mixed thread states.
27. Run lint/typecheck/tests and perform a manual UX pass on mobile + desktop thread compose/list/detail interactions.
28. Phase 2 - Send-as-email (explicitly deferred)
29. Add compose delivery option wiring for send-as-email.
30. Integrate existing email infrastructure for thread message dispatch and persist per-recipient delivery type/status.
31. Add operational safeguards (retry/failure states) and user-visible delivery feedback.

**Relevant files**
- src/components/db/schema/family-social-schema-tables.ts - primary thread table definitions to update for rich text fields, attachments table, constraints, and indexes.
- src/components/db/types/thread-convos.ts - shared Threads data contracts that need extension for attachments, recipient selection mode, and counts.
- src/features/threads/components/threads-home-page.tsx - existing list/filter/sort/counter surface to extend with compose entry and bulk archive action.
- src/features/threads - feature root for composition/detail/action components and server action wiring.
- src/lib/s3-client-factory.ts - S3 upload client pattern to reuse for thread image attachment handling.
- src/lib/s3-object-key.ts - object key conventions to extend/reuse for thread attachment paths.
- src/components/emails - deferred Phase 2 integration point for email templates and thread email rendering.
- src/app - navigation/layout location for unread-thread notification badge wiring.

**Verification**
1. Schema verification: run migrations in a non-prod environment and confirm new constraints/indexes apply without data violations.
2. Recipient snapshot verification: create a broadcast thread and confirm recipient-state rows are created for all active members except sender.
3. Private visibility verification: confirm non-recipient members (including founder when not recipient) cannot view private thread content.
4. Rich text verification: create and reply with formatting, confirm structured JSON and plain text fallback are both persisted and rendered correctly.
5. Attachment verification: upload multiple images, verify metadata rows and object keys are stored, and confirm recipients can open images.
6. Archive verification: execute archive-all-read and confirm only read threads are archived for current member.
7. Counter/badge verification: validate total/unread/private counts and navbar notification red-dot changes as read/archive state changes.
8. Regression verification: run lint, typecheck, and test suite; manually verify Threads list sorting/filtering remains intact.

**Decisions**
- Broadcast recipient model: snapshot all active family members at send time.
- Sender recipient row: exclude sender from recipient-state snapshot rows.
- Rich text storage: persist structured JSON plus plain text fallback.
- Phase 1 scope: include image attachments; defer send-as-email to Phase 2.
- Archive UX for initial release: bulk archive-all-read only.

**Further Considerations**
1. Clarify whether private-thread count in UI should mean visibility=private only, or private + direct-delivery subtype if delivery taxonomy evolves.
2. Confirm max image count/size and allowed mime types for Phase 1 to avoid storage/UX ambiguity.
3. Decide whether thread list should expose a dedicated detail page route or an in-place drawer/modal in the first release.