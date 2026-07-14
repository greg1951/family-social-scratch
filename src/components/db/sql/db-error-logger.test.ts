import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { logDbQueryError } from "@/components/db/sql/db-error-logger";
import { getRequestCorrelationId, withRequestCorrelation } from "@/components/db/sql/request-correlation";

describe("DB error logger request correlation", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("logs a backend failed-query error with a generated request id", async () => {
    await withRequestCorrelation(async () => {
      const simulatedQueryError = new Error(
        "Failed query: select \"book_source\" from \"family_schema\".\"book\" where \"fk_family_id\" = $1 params: 28"
      );

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
  });
});
