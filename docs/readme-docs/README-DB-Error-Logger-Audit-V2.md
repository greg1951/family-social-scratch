# Database Error Logger Audit (V2)

This document records the results of the `logDbQueryError` rollout performed on branch `feature/db-error-logger`, following up on the initial audit in [README-DB-Error-Logger-Audit.md](./README-DB-Error-Logger-Audit.md).

Audit date: September 24, 2026.

## Summary

| Status | Query modules | Percentage |
| --- | ---: | ---: |
| Full implementation | 27 | 100% |
| Partial or inconsistent implementation | 0 | 0% |
| No implementation | 0 | 0% |
| **Total** | **27** | **100%** |

Every `queries-*.ts` module now either calls `logDbQueryError` from every catch block in its exported functions, or has no catch blocks at all (errors intentionally propagate, per the same rule used in the V1 audit).

## Modules Brought to Full Implementation

### Previously partial (existing catch blocks completed)

- [`src/components/db/sql/queries-gallery.ts`](../../src/components/db/sql/queries-gallery.ts)
- [`src/components/db/sql/queries-movies.ts`](../../src/components/db/sql/queries-movies.ts) — also replaced a `console.error` in the archive-toggle path.
- [`src/components/db/sql/queries-music.ts`](../../src/components/db/sql/queries-music.ts) — also replaced a `console.error` in the archive-toggle path.
- [`src/components/db/sql/queries-poetry-cafe.ts`](../../src/components/db/sql/queries-poetry-cafe.ts) — also replaced a `console.error` in the archive-toggle path.
- [`src/components/db/sql/queries-thread-convos.ts`](../../src/components/db/sql/queries-thread-convos.ts) — legacy-column fallback catches now log before rethrowing.
- [`src/components/db/sql/queries-tv.ts`](../../src/components/db/sql/queries-tv.ts) — also replaced a `console.error` in the archive-toggle path.

### Previously no implementation (import added and catch blocks instrumented)

- [`src/components/db/sql/queries-discuss-threads.ts`](../../src/components/db/sql/queries-discuss-threads.ts) — one `catch {}` block instrumented; all other functions intentionally propagate errors.
- [`src/components/db/sql/queries-family-user.ts`](../../src/components/db/sql/queries-family-user.ts) — `insertMember` and `insertUser` catch blocks instrumented.
- [`src/components/db/sql/queries-game-scoreboards.ts`](../../src/components/db/sql/queries-game-scoreboards.ts) — `getGamesPageData` catch block instrumented.
- [`src/components/db/sql/queries-passwordReset.ts`](../../src/components/db/sql/queries-passwordReset.ts) — `insertPasswordToken` catch block instrumented.
- [`src/components/db/sql/queries-support.ts`](../../src/components/db/sql/queries-support.ts) — `createSupportIssue` follow-up-insert failure now uses `logDbQueryError` (best-effort cleanup failure still logs via `console.error`).
- [`src/components/db/sql/queries-thread-templates.ts`](../../src/components/db/sql/queries-thread-templates.ts) — all four exported functions instrumented.
- [`src/components/db/sql/queries-user.ts`](../../src/components/db/sql/queries-user.ts) — `updateUserPassword`, `getFullUserCredsByEmail`, and `upsertUser2faCode` converted from `console.error` to `logDbQueryError`.
- [`src/components/db/sql/queries-videos.ts`](../../src/components/db/sql/queries-videos.ts) — `getVideoMaintenanceData`, `createVideoEntry`, and `deleteVideoEntry` converted from `console.error` to `logDbQueryError`.

### Confirmed as already correct with no action needed

These modules have no `try/catch` blocks in their exported functions (errors intentionally propagate to the caller), or in the case of `queries-galleries.ts`, no exports at all:

- [`src/components/db/sql/queries-family-activity.ts`](../../src/components/db/sql/queries-family-activity.ts)
- [`src/components/db/sql/queries-family-features.ts`](../../src/components/db/sql/queries-family-features.ts)
- [`src/components/db/sql/queries-family-invite.ts`](../../src/components/db/sql/queries-family-invite.ts)
- [`src/components/db/sql/queries-family-notifications.ts`](../../src/components/db/sql/queries-family-notifications.ts)
- [`src/components/db/sql/queries-family-s3.ts`](../../src/components/db/sql/queries-family-s3.ts)
- [`src/components/db/sql/queries-galleries.ts`](../../src/components/db/sql/queries-galleries.ts) — stub file with no exports.

### Unchanged (already fully implemented in V1)

- [`src/components/db/sql/queries-blogs.ts`](../../src/components/db/sql/queries-blogs.ts)
- [`src/components/db/sql/queries-book-besties.ts`](../../src/components/db/sql/queries-book-besties.ts)
- [`src/components/db/sql/queries-clubs.ts`](../../src/components/db/sql/queries-clubs.ts)
- [`src/components/db/sql/queries-family-member.ts`](../../src/components/db/sql/queries-family-member.ts)
- [`src/components/db/sql/queries-foodies.ts`](../../src/components/db/sql/queries-foodies.ts)
- [`src/components/db/sql/queries-guided-runtime.ts`](../../src/components/db/sql/queries-guided-runtime.ts)
- [`src/components/db/sql/queries-guided.ts`](../../src/components/db/sql/queries-guided.ts) — redundant `console.error` in `getGuidedTourMaintenanceData` intentionally left in place; the caught error is still reported through `logDbQueryError`.

## Implementation Pattern Applied

Each instrumented catch block follows the reference pattern from `queries-book-besties.ts`:

```ts
} catch (error) {
  logDbQueryError('<domain>.<functionName>[.subaction]', error, {
    // relevant ids: familyId, memberId, entity id, etc.
  });
  return {
    success: false,
    message: error instanceof Error ? error.message : 'Fallback message',
  };
}
```

### Special cases

- **Legacy-column fallback catches** (`queries-thread-convos.ts`, and similar patterns in `queries-movies.ts`/`queries-music.ts` internal helpers): these catches check for a specific "missing column" error and otherwise rethrow without returning an error result. Where the rethrow path exists in an exported function's error boundary, `logDbQueryError` was added immediately before the `throw` so the underlying failure is captured without changing control flow.
- **Best-effort cleanup catches** (e.g. rollback deletes in `saveBooksHomeBook`-style save flows, `createSupportIssue`, `createVideoEntry`): the primary failure is logged via `logDbQueryError`; the secondary cleanup failure is left as `console.error` to avoid noisy duplicate Sentry reports for what is already a best-effort, non-critical path.
- **Functions with no `try/catch`**: left untouched. Per the audit's original rule, intentionally propagating functions are not considered a gap.

## Validation

- `npx tsc --noEmit` — clean, no type errors introduced.
- `npx eslint <all touched files>` — 0 errors; only 2 pre-existing, unrelated `no-unused-vars` warnings (`ne` in `queries-movies.ts`, `familyInvitation`/`InsertMemberInput` in `queries-family-user.ts`).

## Scope

This document reflects the state of the codebase after the `feature/db-error-logger` implementation pass. No further logger implementation changes are outstanding from the V1 audit list.
