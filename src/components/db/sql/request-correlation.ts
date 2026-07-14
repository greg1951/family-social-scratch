import { AsyncLocalStorage } from "node:async_hooks";

type RequestCorrelationStore = {
  requestId: string;
};

const requestCorrelationStorage = new AsyncLocalStorage<RequestCorrelationStore>();

function createRequestId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeRequestId(requestId?: string | null) {
  const normalized = requestId?.trim();
  return normalized && normalized.length > 0 ? normalized : createRequestId();
}

export function withRequestCorrelation<T>(
  run: () => Promise<T> | T,
  requestId?: string | null
): Promise<T> | T {
  const correlationId = normalizeRequestId(requestId);

  return requestCorrelationStorage.run({ requestId: correlationId }, run);
}

export function getRequestCorrelationId() {
  return requestCorrelationStorage.getStore()?.requestId;
}
