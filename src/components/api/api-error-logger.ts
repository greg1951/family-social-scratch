import * as Sentry from "@sentry/nextjs";

type ApiErrorMeta = Record<string, unknown>;

function toError(value: unknown): Error {
  if (value instanceof Error) {
    return value;
  }

  return new Error(typeof value === "string" ? value : "Unknown error");
}

export function logApiRouteError(scope: string, error: unknown, meta: ApiErrorMeta = {}) {
  const err = toError(error);
  const payload = {
    scope,
    message: err.message,
    stack: err.stack,
    ...meta,
  };

  Sentry.withScope((sentryScope) => {
    sentryScope.setTag("api.scope", scope);
    if (typeof meta.requestId === "string") {
      sentryScope.setTag("request.id", meta.requestId);
    }
    sentryScope.setContext("api_route_error", payload);
    Sentry.captureException(err);
  });

  console.error("[API_ROUTE_FAILED]", payload);
}
