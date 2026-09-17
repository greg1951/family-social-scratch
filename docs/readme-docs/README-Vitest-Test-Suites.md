# Vitest Test Suites

This document inventories the Vitest suites by application feature and provides commands for running them from PowerShell.

Breakdown by test file:

- 21 suites (50%) mock Drizzle or database query/service modules.
- 20 suites (47.6%) are pure logic or UI tests with no database involvement.
- 1 suite (2.4%) is an opt-in live Sentry test. It sends an external Sentry event but does not access the database.

So, specifically regarding database safety:

- No real database access: 100%
- No database state changes: 100%
- Tests requiring an actual database: 0%

## Getting Started

Run commands from the repository root:

```powershell
cd C:\Users\gregh\projects\family-social-scratch
```

Run the complete Vitest suite:

```powershell
npx vitest run
```

## Kitchen / Foodies

Suites:

- [`src/features/foodies/tests/foodies-home-page.state.test.ts`](../../src/features/foodies/tests/foodies-home-page.state.test.ts) - Foodies home-page active detail state.
- [`src/features/foodies/tests/recipe-comment-permissions.test.ts`](../../src/features/foodies/tests/recipe-comment-permissions.test.ts) - Recipe comment permissions.
- [`src/components/db/sql/queries-foodies.template-access.test.ts`](../../src/components/db/sql/queries-foodies.template-access.test.ts) - Kitchen template visibility and authorization.
- [`src/app/(features)/(foodies)/foodies/actions.correlation.test.ts`](../../src/app/(features)/(foodies)/foodies/actions.correlation.test.ts) - Foodies action request correlation.

Run all Kitchen / Foodies suites:

```powershell
npx vitest run "src/features/foodies/tests" "src/components/db/sql/queries-foodies.template-access.test.ts" "src/app/(features)/(foodies)/foodies/actions.correlation.test.ts"
```

Run only the Foodies home-page state suite:

```powershell
npm run test:foodies-state
```

## TV Shows

Suite:

- [`src/components/db/sql/queries-tv.template-access.test.ts`](../../src/components/db/sql/queries-tv.template-access.test.ts) - TV template visibility and authorization.

```powershell
npx vitest run "src/components/db/sql/queries-tv.template-access.test.ts"
```

## Movie Theater

Suite:

- [`src/components/db/sql/queries-movies.template-access.test.ts`](../../src/components/db/sql/queries-movies.template-access.test.ts) - Movie template visibility and authorization.

```powershell
npx vitest run "src/components/db/sql/queries-movies.template-access.test.ts"
```

## Music

Suites:

- [`src/components/db/sql/queries-music.template-access.test.ts`](../../src/components/db/sql/queries-music.template-access.test.ts) - Music template visibility and authorization.
- [`src/components/db/sql/queries-music.test.ts`](../../src/components/db/sql/queries-music.test.ts) - Playlist persistence and Spotify image behavior.
- [`src/features/music/tests/music-home-page.provider-gating.test.ts`](../../src/features/music/tests/music-home-page.provider-gating.test.ts) - Playlist playback provider availability.
- [`src/features/music/tests/music-add-page.music-type-ui.test.tsx`](../../src/features/music/tests/music-add-page.music-type-ui.test.tsx) - Music type UI state and validation.
- [`src/auth/spotify-token.test.ts`](../../src/auth/spotify-token.test.ts) - Spotify token reconciliation and refresh.
- [`src/auth/spotify-connection-context.test.ts`](../../src/auth/spotify-connection-context.test.ts) - Spotify connection context.

Run all Music suites:

```powershell
npx vitest run "src/components/db/sql/queries-music.test.ts" "src/components/db/sql/queries-music.template-access.test.ts" "src/features/music/tests" "src/auth/spotify-token.test.ts" "src/auth/spotify-connection-context.test.ts"
```

## Threads / Discussions

Suites:

- [`src/features/threads/tests/threads-actions-revalidation.test.ts`](../../src/features/threads/tests/threads-actions-revalidation.test.ts) - Thread action revalidation.
- [`src/features/threads/tests/threads-actions-create-and-failure-regression.test.ts`](../../src/features/threads/tests/threads-actions-create-and-failure-regression.test.ts) - Thread creation and failure regressions.
- [`src/features/threads/tests/threads-actions-auth-guards.test.ts`](../../src/features/threads/tests/threads-actions-auth-guards.test.ts) - Thread action authorization guards.
- [`src/features/threads/tests/threads-actions-and-rules.test.ts`](../../src/features/threads/tests/threads-actions-and-rules.test.ts) - Conversation access rules.
- [`src/features/threads/tests/thread-conversation-detail-ui-regression.test.tsx`](../../src/features/threads/tests/thread-conversation-detail-ui-regression.test.tsx) - Conversation detail UI regressions.
- [`src/features/threads/tests/thread-compose-page.test.ts`](../../src/features/threads/tests/thread-compose-page.test.ts) - Compose-page attachment size warnings.
- [`src/features/threads/tests/template-variables.test.ts`](../../src/features/threads/tests/template-variables.test.ts) - Template variable replacement.

Run every Threads / Discussions suite:

```powershell
npm run test:threads
```

Run only the conversation-detail UI regression suite:

```powershell
npm run test:threads-ui
```

## Galleries

Suites:

- [`src/features/galleries/utils/album-cover.test.ts`](../../src/features/galleries/utils/album-cover.test.ts) - Album cover selection.
- [`src/components/db/sql/queries-gallery.test.ts`](../../src/components/db/sql/queries-gallery.test.ts) - Gallery photo deletion.

```powershell
npx vitest run "src/features/galleries/utils/album-cover.test.ts" "src/components/db/sql/queries-gallery.test.ts"
```

## Games

Suites:

- [`src/features/games/tests/scoreboard-ui-helpers.test.ts`](../../src/features/games/tests/scoreboard-ui-helpers.test.ts) - Scoreboard UI helpers.
- [`src/features/games/tests/game-history-insights.test.ts`](../../src/features/games/tests/game-history-insights.test.ts) - Game history insights.
- [`src/features/games/tests/cricket-rules.test.ts`](../../src/features/games/tests/cricket-rules.test.ts) - Cricket rules.

```powershell
npx vitest run "src/features/games/tests"
```

## Books

Suite:

- [`src/app/(features)/(books)/books/actions.correlation.test.ts`](../../src/app/(features)/(books)/books/actions.correlation.test.ts) - Book action request correlation.

```powershell
npx vitest run "src/app/(features)/(books)/books/actions.correlation.test.ts"
```

## Blogs

Suites:

- [`src/features/blogs/utils/youtube-url.test.ts`](../../src/features/blogs/utils/youtube-url.test.ts) - YouTube URL normalization.
- [`src/features/blogs/utils/blog-cover-image.test.ts`](../../src/features/blogs/utils/blog-cover-image.test.ts) - Blog cover image state resolution.

```powershell
npx vitest run "src/features/blogs/utils"
```

## Family, Authentication, and Member Management

Suites:

- [`src/auth.providers-config.test.ts`](../../src/auth.providers-config.test.ts) - Authentication provider configuration guards.
- [`src/features/family/tests/remove-member-dialog-ui.test.tsx`](../../src/features/family/tests/remove-member-dialog-ui.test.tsx) - Remove-member dialog UI.
- [`src/features/family/tests/remove-member-actions.test.ts`](../../src/features/family/tests/remove-member-actions.test.ts) - Family member removal actions.
- [`src/app/(new-setup)/(member-setup)/family-member-registration/actions.test.ts`](../../src/app/(new-setup)/(member-setup)/family-member-registration/actions.test.ts) - Founder notification for new member registration.

```powershell
npx vitest run "src/auth.providers-config.test.ts" "src/features/family/tests" "src/app/(new-setup)/(member-setup)/family-member-registration/actions.test.ts"
```

## Guided Tours

Suites:

- [`src/app/(main)/guided-tour/actions.test.ts`](../../src/app/(main)/guided-tour/actions.test.ts) - Guided-tour actions.
- [`src/components/db/sql/queries-guided-runtime.test.ts`](../../src/components/db/sql/queries-guided-runtime.test.ts) - Guided-tour runtime behavior.

```powershell
npx vitest run "src/app/(main)/guided-tour/actions.test.ts" "src/components/db/sql/queries-guided-runtime.test.ts"
```

## Support

Suites:

- [`src/features/support/tests/queries-support.test.ts`](../../src/features/support/tests/queries-support.test.ts) - Support issue creation.
- [`src/features/support/tests/open-issue-actions.test.ts`](../../src/features/support/tests/open-issue-actions.test.ts) - Open-issue actions.

```powershell
npx vitest run "src/features/support/tests"
```

## Error Monitoring and Sentry

Suites:

- [`src/app/global-error.test.ts`](../../src/app/global-error.test.ts) - Global error Sentry reporting.
- [`src/app/global-error.sentry-live.test.ts`](../../src/app/global-error.sentry-live.test.ts) - Live Sentry ingestion.
- [`src/components/db/sql/db-error-logger.test.ts`](../../src/components/db/sql/db-error-logger.test.ts) - Database error logger request correlation.
- [`src/components/db/sql/db-error-logger.debug.test.ts`](../../src/components/db/sql/db-error-logger.debug.test.ts) - Database error logger debug output.
- [`src/app/api/s3-upload/router.sentry.test.ts`](../../src/app/api/s3-upload/router.sentry.test.ts) - S3 upload API Sentry logging.

Run the local and mocked monitoring suites:

```powershell
npx vitest run "src/app/global-error.test.ts" "src/components/db/sql/db-error-logger.test.ts" "src/components/db/sql/db-error-logger.debug.test.ts" "src/app/api/s3-upload/router.sentry.test.ts"
```

Available shortcuts:

```powershell
npm run test:db-logging
npm run test:db-logging-debug
```

### Live Sentry Test

The live test is opt-in and should be run separately because it may send a real event to Sentry:

```powershell
npm run test:sentry-live
```

## Shared S3 Infrastructure

Suites:

- [`src/lib/s3Credentials.test.ts`](../../src/lib/s3Credentials.test.ts) - S3 credential caching.
- [`src/lib/s3-object-key.test.ts`](../../src/lib/s3-object-key.test.ts) - S3 object-key extraction.

```powershell
npx vitest run "src/lib/s3Credentials.test.ts" "src/lib/s3-object-key.test.ts"
```

## Template Authorization

The Kitchen, Movie Theater, Music, and TV Shows template suites share an authorization contract. Together they verify:

- Family 1 global templates are visible to every family.
- Global-marked templates outside family 1 are hidden.
- Members can see their own custom templates.
- Members cannot see another member's custom templates, including templates in the same family.
- Members cannot see custom templates from another family.
- Another member's draft custom template cannot be selected using a forged ID.
- Members cannot update another member's custom template.
- Only a family 1 administrator can update a global template.

Run all four template-authorization suites:

```powershell
npx vitest run "src/components/db/sql/queries-foodies.template-access.test.ts" "src/components/db/sql/queries-movies.template-access.test.ts" "src/components/db/sql/queries-music.template-access.test.ts" "src/components/db/sql/queries-tv.template-access.test.ts"
```

## Package Script Reference

The test shortcuts currently defined in `package.json` are:

| Script | Purpose |
| --- | --- |
| `npm run test:db-logging` | Run the structured database error logger suite. |
| `npm run test:db-logging-debug` | Run the database error debug-output suite. |
| `npm run test:foodies-state` | Run the Foodies home-page state suite. |
| `npm run test:sentry-live` | Run the opt-in live Sentry ingestion suite. |
| `npm run test:threads` | Run all suites under the Threads test directory. |
| `npm run test:threads-ui` | Run the thread conversation-detail UI regression suite. |
