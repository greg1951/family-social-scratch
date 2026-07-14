type DbErrorMeta = Record<string, unknown>;
import { getRequestCorrelationId } from "./request-correlation";

function toError(value: unknown): Error {
  if (value instanceof Error) {
    return value;
  }

  return new Error(typeof value === "string" ? value : "Unknown error");
}

export function logDbQueryError(scope: string, error: unknown, meta: DbErrorMeta = {}) {
  const err = toError(error);
  const requestId = getRequestCorrelationId() ?? "unknown";

  console.error("[DB_QUERY_FAILED]", {
    requestId,
    scope,
    message: err.message,
    stack: err.stack,
    ...meta,
  });
}
