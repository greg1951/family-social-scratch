# Error Notification Tools Recap

## Recommended Starting Point
- Start with a monitoring/logging tool, not direct notifications from every `logDbQueryError` call.
- Keep `logDbQueryError` as the normalization point for structured error data.
- Let the monitoring tool handle deduplication, thresholds, and notification routing.

## Good Getting-Started Options

### 1. Sentry
- Best default choice for server/app exceptions.
- Captures stack traces, request context, release info, and breadcrumbs.
- Good fit if you want more than `console.error` with minimal setup.
- Supports alerting to email or Slack.

### 2. Axiom
- Good for structured log search and analysis.
- Strong if you want to search by fields like `requestId`, `scope`, `familyId`, and `memberId`.
- Better when the main goal is operational debugging from logs.

### 3. Better Stack / Logtail
- Lightweight centralized logging plus alerting.
- Easier to adopt than a large observability suite.
- Good if you mainly want log shipping and simple alerts.

### 4. Datadog
- Powerful but heavier and more expensive.
- Good if you want logs, traces, metrics, dashboards, and alerting in one platform.
- Usually more appropriate once traffic or operational needs grow.

## Notification Channels
- Slack: best primary alert channel for active incidents.
- Email: fine as a backup, but weaker as a primary alert path.
- Since the repo already uses Resend, email is easy to add later if needed.

## Recommended Architecture
1. Keep `logDbQueryError` writing structured error data.
2. Add a second sink there later if needed:
   - `console.error(...)`
   - plus an external collector such as Sentry or Axiom
3. Configure alert rules in the external tool based on:
   - `scope`
   - repeated failures per minute
   - production-only events
4. Route notifications to Slack first.

## Important Guidance
- Do not send a direct notification from every `logDbQueryError` call at first.
- A bad query path can spam alerts instantly if notifications are emitted directly in code.
- Prefer sending structured events to a monitoring tool and let it decide when to alert.

## Suggested Maturity Path
- Phase 1: `console.error` + structured `logDbQueryError`
- Phase 2: add Sentry or Better Stack/Axiom ingestion
- Phase 3: add Slack alerts with thresholds
- Phase 4: add dashboards, environment filtering, and issue ownership

## Practical Recommendation For This Repo
- Start with Sentry if you want exception tracking plus alerts.
- Start with Better Stack or Axiom if you want structured log monitoring around `[DB_QUERY_FAILED]`.
- Use Slack as the primary alert destination.
