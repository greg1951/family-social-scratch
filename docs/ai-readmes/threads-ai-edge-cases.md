## Plan: Threads Edge Cases

This follow-up plan pressure-tests the Family Threads design against member lifecycle changes, family expiration, private-thread authorization, recipient-specific state, and future archive behavior. The recommended v1 approach is to keep the model transactional and simple: immutable recipient snapshots, per-recipient read/archive state, private-thread authorization enforced strictly by sender plus recipient membership, and read-only behavior for expired families. Defer destructive or high-risk capabilities such as hard member deletion, post deletion, and S3 archival writes until the core behavior is stable.

**Steps**
1. Phase 1 - Lock core authorization rules before schema finalization: private threads are visible only to `senderMemberId` and rows materialized in `thread_recipient`; founder has no override; post visibility inherits from the parent conversation and cannot vary per post in v1.
2. Phase 1 - Define member lifecycle semantics: use `memberId` as the only recipient/author key; do not use email for thread identity. Treat resignation as a status transition, not a hard delete. Recipients keep access to conversations they received while active because `thread_recipient` is a historical snapshot.
3. Phase 1 - Handle rejoin and tenure boundaries explicitly: if a member leaves and later rejoins, treat the new membership tenure as a new `memberId` identity for thread access unless old conversations are explicitly re-shared. This prevents leakage when the same email address appears across time.
4. Phase 1 - Add family expiration behavior to the design: if `family.status = 'expired'`, allow reading existing threads but block new conversations and replies. This is the safest v1 guard because the current auth path does not appear to enforce family expiration at login time.
5. Phase 1 - Model public-thread visibility with snapshots when access history matters: if resigned members should retain access to conversations sent while they were active, public threads also need effective audience capture semantics, either explicitly through `thread_recipient` rows or through a membership-tenure access rule. Prefer `thread_recipient` rows for all thread types so unread/archive state and visibility use the same mechanism.
6. Phase 1 - Keep per-recipient state independent: `readAt`, `answeredAt`, and `archivedAt` belong only to the requesting member's row in `thread_recipient`. Sender actions never mutate recipient read/archive state.
7. Phase 1 - Define open/read behavior: opening a thread for the first time sets `readAt` if it is null. A reply in the same conversation does not rewrite historical read state for other recipients unless a later unread marker is intentionally added.
8. Phase 1 - Explicitly exclude destructive content editing: do not support hard deletes or post edits in v1. If later needed, implement soft-delete and edited timestamps or a separate audit/event model rather than mutating history invisibly.
9. Phase 2 - Build route/query behavior around these rules: inbox queries use the current member's `thread_recipient` rows; sent queries use `senderMemberId`; archive views filter by the requester's `archivedAt`; tag/category filters apply after authorization, not before.
10. Phase 2 - Reuse notification preferences carefully: short email/SMS alerts can link to a thread, but opening the thread is what sets `readAt`. `Threads Only` should suppress transport notifications later without changing in-app thread state.
11. Phase 3 - Add archive/export only after the core rules are stable: once threads can be closed safely, export closed conversations plus posts plus recipient state to S3, retain archive metadata in PostgreSQL, and block replies to archived conversations.
12. Leave explicit non-goals in place for the first cut: founder moderation override for private threads, per-post visibility overrides, hard member deletion, edit history, real-time delivery, and full text archive search.

**Relevant files**
- `c:/Users/ghughlett/Projects/my-projects/family-social-scratch/src/components/db/schema/family-social-schema-tables.ts` — existing `familyStatus`, `memberStatus`, `family.expirationDate`, and `member` table shape drive expiration and membership-lifecycle edge cases.
- `c:/Users/ghughlett/Projects/my-projects/family-social-scratch/src/features/auth/services/auth-utils.ts` — current auth validation path appears to validate credentials without clearly enforcing family/member status, which is why thread write guards should not rely only on sign-in checks.
- `c:/Users/ghughlett/Projects/my-projects/family-social-scratch/src/auth.ts` — session callback shape likely does not carry family/member lifecycle state, which affects where expiration enforcement should happen.
- `c:/Users/ghughlett/Projects/my-projects/family-social-scratch/src/components/db/sql/queries-family-notifications.ts` — reference pattern for per-member state updates and query module structure.
- `c:/Users/ghughlett/Projects/my-projects/family-social-scratch/docs/insert-option-reference-records.csv` — existing `Family Threads` and `Threads Only` option records can be reused for notification behavior later.

**Verification**
1. Validate authorization with concrete scenarios: founder attempting to open a private thread they are not part of, resigned member opening a thread received before resignation, rejoined member attempting to access prior-tenure threads, and a member outside the snapshot audience trying to fetch an `All` thread.
2. Validate lifecycle rules: expired family can open but not post; renewed family can resume posting; a removed recipient still sees historical conversations received while active if that is the chosen rule.
3. Validate query behavior: inbox, sent, unread, archive, and tag filters must all produce results based on the current member's `thread_recipient` row rather than global conversation state.
4. Validate schema assumptions before implementation: decide whether every public thread gets `thread_recipient` rows for all visible members, since that choice controls resigned-member visibility and unread tracking consistency.

**Decisions**
- Use `memberId`, not email, as the durable identity in all thread tables.
- Prefer soft member lifecycle handling (`status` transition) over hard delete for thread integrity.
- Expired families should be read-only for threads in v1.
- Recipients keep access to threads captured during their active tenure unless the product later introduces explicit revocation.
- Rejoined members do not automatically regain access to prior-tenure threads.
- Public/private visibility should be enforced through the same audience model where practical, ideally `thread_recipient` for both.

**Further Considerations**
1. The biggest unresolved implementation choice is whether every public thread should materialize `thread_recipient` rows for all current members. Recommendation: yes, because it keeps visibility, unread state, and future archive export consistent.
2. If the product later requires sender revocation or legal deletion, add soft-delete plus audit records rather than rewriting or hard-deleting historical posts.
3. If archive restore becomes important, keep a PostgreSQL metadata record per archived conversation so archive discovery does not depend on scanning S3.