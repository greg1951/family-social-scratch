# Database Error Logger Audit

This document records the implementation status of `logDbQueryError` from `src/components/db/sql/db-error-logger.ts` across every production `queries-*.ts` module.

Audit date: September 16, 2026.

## Summary

| Status | Query modules | Percentage |
| --- | ---: | ---: |
| Full implementation | 7 | 25.9% |
| Partial or inconsistent implementation | 6 | 22.2% |
| No implementation | 14 | 51.9% |
| **Total** | **27** | **100%** |

For this audit, **full implementation** means every existing `catch` block in exported database-facing functions calls `logDbQueryError`. Functions that intentionally allow errors to propagate are not considered missing solely because they do not contain a `catch` block.

## Full Implementation

Every existing exported-function `catch` block in these modules calls `logDbQueryError`:

- [`src/components/db/sql/queries-blogs.ts`](../../src/components/db/sql/queries-blogs.ts)
- [`src/components/db/sql/queries-book-besties.ts`](../../src/components/db/sql/queries-book-besties.ts)
- [`src/components/db/sql/queries-clubs.ts`](../../src/components/db/sql/queries-clubs.ts)
- [`src/components/db/sql/queries-family-member.ts`](../../src/components/db/sql/queries-family-member.ts)
- [`src/components/db/sql/queries-foodies.ts`](../../src/components/db/sql/queries-foodies.ts)
- [`src/components/db/sql/queries-guided-runtime.ts`](../../src/components/db/sql/queries-guided-runtime.ts)
- [`src/components/db/sql/queries-guided.ts`](../../src/components/db/sql/queries-guided.ts)

`queries-guided.ts` also has a redundant `console.error` call in `getGuidedTourMaintenanceData`. Its caught error is still reported through `logDbQueryError`, so the module is categorized as fully implemented with a cleanup opportunity.

## No Implementation

The following query modules neither import nor call `logDbQueryError`:

- [`src/components/db/sql/queries-discuss-threads.ts`](../../src/components/db/sql/queries-discuss-threads.ts)
- [`src/components/db/sql/queries-family-activity.ts`](../../src/components/db/sql/queries-family-activity.ts)
- [`src/components/db/sql/queries-family-features.ts`](../../src/components/db/sql/queries-family-features.ts)
- [`src/components/db/sql/queries-family-invite.ts`](../../src/components/db/sql/queries-family-invite.ts)
- [`src/components/db/sql/queries-family-notifications.ts`](../../src/components/db/sql/queries-family-notifications.ts)
- [`src/components/db/sql/queries-family-s3.ts`](../../src/components/db/sql/queries-family-s3.ts)
- [`src/components/db/sql/queries-family-user.ts`](../../src/components/db/sql/queries-family-user.ts)
- [`src/components/db/sql/queries-galleries.ts`](../../src/components/db/sql/queries-galleries.ts)
- [`src/components/db/sql/queries-game-scoreboards.ts`](../../src/components/db/sql/queries-game-scoreboards.ts)
- [`src/components/db/sql/queries-passwordReset.ts`](../../src/components/db/sql/queries-passwordReset.ts)
- [`src/components/db/sql/queries-support.ts`](../../src/components/db/sql/queries-support.ts)
- [`src/components/db/sql/queries-thread-templates.ts`](../../src/components/db/sql/queries-thread-templates.ts)
- [`src/components/db/sql/queries-user.ts`](../../src/components/db/sql/queries-user.ts)
- [`src/components/db/sql/queries-videos.ts`](../../src/components/db/sql/queries-videos.ts)

### Existing Error Handling to Replace or Supplement

- `queries-support.ts` uses `console.error` instead of `logDbQueryError`.
- `queries-thread-templates.ts` contains multiple `try/catch` paths without structured database error logging.
- `queries-family-user.ts` catches database errors without structured database error logging.
- `queries-user.ts` uses `console.error` in database error paths.
- `queries-videos.ts` uses `console.error` in database error paths.
- `queries-galleries.ts` appears to be an incomplete or stub query module and should be reviewed before instrumentation.

## Partial or Inconsistent Implementation

These modules import and call `logDbQueryError`, but at least one existing exported-function `catch` block does not call it:

- [`src/components/db/sql/queries-gallery.ts`](../../src/components/db/sql/queries-gallery.ts)
  - `getFamilyGalleryData` is instrumented, but the remaining caught gallery query and mutation failures are not.
- [`src/components/db/sql/queries-movies.ts`](../../src/components/db/sql/queries-movies.ts)
  - `getMoviesHomePageData` is instrumented. Other caught paths, including `deleteMovie`, template management, template saving, detail, reaction, comment, and archive handling, are not consistently instrumented.
- [`src/components/db/sql/queries-music.ts`](../../src/components/db/sql/queries-music.ts)
  - `getMusicHomePageData` is instrumented. Other caught paths, including deletion, template management, template saving, detail, reaction, comment, lyrics, playlist helpers, and archive handling, are not consistently instrumented.
- [`src/components/db/sql/queries-poetry-cafe.ts`](../../src/components/db/sql/queries-poetry-cafe.ts)
  - `getPoetryHomePageData` is instrumented, but other caught detail, mutation, reaction, comment, term, and archive paths are not consistently instrumented.
- [`src/components/db/sql/queries-thread-convos.ts`](../../src/components/db/sql/queries-thread-convos.ts)
  - Conversation summary loading and member deletion are instrumented, but several other caught conversation and reply paths are not.
- [`src/components/db/sql/queries-tv.ts`](../../src/components/db/sql/queries-tv.ts)
  - `getTvHomePageData` is instrumented. Other caught paths, including deletion, template management, template saving, detail, reaction, comment, and archive handling, are not consistently instrumented.

## Reference Implementation

[`src/components/db/sql/queries-book-besties.ts`](../../src/components/db/sql/queries-book-besties.ts) is an example of a fully implemented query module using the shared database error logger.

`logDbQueryError` provides:

- A stable error scope.
- Request correlation through `requestId`.
- Structured metadata for relevant IDs and operation context.
- Sentry exception capture.
- A structured `[DB_QUERY_FAILED]` console payload.

## Scope

This is an audit list only. No logger implementation changes are included in this document.
