import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  revalidatePathMock,
  getMemberPageDetailsMock,
  saveBooksHomeBookMock,
} = vi.hoisted(() => ({
  revalidatePathMock: vi.fn(),
  getMemberPageDetailsMock: vi.fn(),
  saveBooksHomeBookMock: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock("@/features/family/services/family-services", () => ({
  getMemberPageDetails: getMemberPageDetailsMock,
}));

vi.mock("@/components/db/sql/queries-book-besties", () => ({
  saveBooksHomeBook: saveBooksHomeBookMock,
  toggleBookReaction: vi.fn(),
  addBookComment: vi.fn(),
  deleteBook: vi.fn(),
}));

import { logDbQueryError } from "@/components/db/sql/db-error-logger";
import { saveBooksHomeBookAction } from "@/app/(features)/(books)/books/actions";

describe("Books action request correlation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    getMemberPageDetailsMock.mockResolvedValue({
      isLoggedIn: true,
      familyId: 28,
      memberId: 4,
      isAdmin: false,
      isFounder: false,
    });
  });

  it("preserves one requestId across nested DB error logs in saveBooksHomeBookAction", async () => {
    saveBooksHomeBookMock.mockImplementation(async () => {
      logDbQueryError("books.saveBooksHomeBook", new Error("column book_source does not exist"), {
        familyId: 28,
        memberId: 4,
      });

      logDbQueryError(
        "books.getBooksHomePageData",
        new Error("Failed query: select \"book_source\" from \"family_schema\".\"book\" where \"fk_family_id\" = $1 params: 28"),
        {
          familyId: 28,
          memberId: 4,
        }
      );

      return {
        success: false as const,
        message: "Failed to save book changes.",
      };
    });

    const result = await saveBooksHomeBookAction({
      bookTitle: "Dune",
      authorName: "Frank Herbert",
      bookLanguage: "english",
      bookSource: "bookstore",
      bookYear: 1965,
      status: "published",
      analysisJson: "{}",
      selectedTagIds: [],
    });

    expect(result).toEqual({
      success: false,
      message: "Failed to save book changes.",
    });

    expect(revalidatePathMock).not.toHaveBeenCalled();

    const errorSpy = vi.mocked(console.error);
    expect(errorSpy).toHaveBeenCalledTimes(2);

    const firstPayload = errorSpy.mock.calls[0]?.[1] as Record<string, unknown>;
    const secondPayload = errorSpy.mock.calls[1]?.[1] as Record<string, unknown>;

    expect(firstPayload.requestId).toEqual(expect.any(String));
    expect(secondPayload.requestId).toEqual(expect.any(String));
    expect(firstPayload.requestId).toBe(secondPayload.requestId);

    expect(firstPayload.scope).toBe("books.saveBooksHomeBook");
    expect(secondPayload.scope).toBe("books.getBooksHomePageData");
  });
});
