import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const sentryMocks = vi.hoisted(() => ({
  captureException: vi.fn(),
  setContext: vi.fn(),
  setTag: vi.fn(),
}));

vi.mock("@sentry/nextjs", () => ({
  captureException: sentryMocks.captureException,
  withScope: (callback: (scope: { setTag: typeof sentryMocks.setTag; setContext: typeof sentryMocks.setContext }) => void) =>
    callback({
      setTag: sentryMocks.setTag,
      setContext: sentryMocks.setContext,
    }),
}));

import { logDbQueryError } from "@/components/db/sql/db-error-logger";
import { getRequestCorrelationId, withRequestCorrelation } from "@/components/db/sql/request-correlation";

describe("DB error logger request correlation", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    sentryMocks.captureException.mockClear();
    sentryMocks.setContext.mockClear();
    sentryMocks.setTag.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("logs a backend failed-query error with a generated request id", async () => {
    const simulatedQueryError = new Error(
      "Failed query: select \"book_source\" from \"family_schema\".\"book\" where \"fk_family_id\" = $1 params: 28"
    );

    await withRequestCorrelation(async () => {
      try {
        throw simulatedQueryError;
      } catch (error) {
        logDbQueryError("books.getBooksHomePageData", error, { familyId: 28, memberId: 4 });
      }

      expect(getRequestCorrelationId()).toEqual(expect.any(String));
    });

    const errorSpy = vi.mocked(console.error);
    expect(errorSpy).toHaveBeenCalledTimes(1);

    const [prefix, payload] = errorSpy.mock.calls[0] as [string, Record<string, unknown>];

    expect(prefix).toBe("[DB_QUERY_FAILED]");
    expect(payload).toMatchObject({
      scope: "books.getBooksHomePageData",
      familyId: 28,
      memberId: 4,
      requestId: expect.any(String),
    });
    expect(String(payload.message)).toContain("Failed query");
    expect(String(payload.message)).toContain("book_source");
    expect(sentryMocks.captureException).toHaveBeenCalledTimes(1);
    expect(sentryMocks.captureException).toHaveBeenCalledWith(simulatedQueryError);
    expect(sentryMocks.setTag).toHaveBeenCalledWith("db.scope", "books.getBooksHomePageData");
    expect(sentryMocks.setTag).toHaveBeenCalledWith("request.id", expect.any(String));
    expect(sentryMocks.setContext).toHaveBeenCalledWith(
      "db_query_error",
      expect.objectContaining({
        scope: "books.getBooksHomePageData",
        familyId: 28,
        memberId: 4,
        requestId: expect.any(String),
      })
    );
  });

  it("reuses a provided request correlation id", async () => {
    const knownRequestId = "req-booksource-regression";

    await withRequestCorrelation(async () => {
      logDbQueryError("foodies.getFoodiesHomePageData", new Error("Column does not exist"), { familyId: 28 });
    }, knownRequestId);

    const errorSpy = vi.mocked(console.error);
    expect(errorSpy).toHaveBeenCalledTimes(1);

    const [, payload] = errorSpy.mock.calls[0] as [string, Record<string, unknown>];
    expect(payload.requestId).toBe(knownRequestId);
    expect(sentryMocks.setTag).toHaveBeenCalledWith("request.id", knownRequestId);
  });
});
