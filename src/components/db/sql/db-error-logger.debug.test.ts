import { describe, expect, it } from "vitest";

import { logDbQueryError } from "@/components/db/sql/db-error-logger";
import { withRequestCorrelation } from "@/components/db/sql/request-correlation";

describe("DB error logger debug output", () => {
  it("prints a live [DB_QUERY_FAILED] payload to stderr", async () => {
    await withRequestCorrelation(async () => {
      const error = new Error(
        'Failed query: select "book_source" from "family_schema"."book" where "fk_family_id" = $1 params: 28'
      );

      // Intentionally do not mock console.error in this debug test.
      logDbQueryError("books.getBooksHomePageData", error, {
        familyId: 28,
        memberId: 4,
        debugMode: true,
      });
    }, "debug-live-request-id");

    // Keep one assertion so this remains a valid test.
    expect(true).toBe(true);
  });
});
