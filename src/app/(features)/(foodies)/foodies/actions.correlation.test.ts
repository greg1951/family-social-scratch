import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  revalidatePathMock,
  getMemberPageDetailsMock,
  saveFoodiesRecipeMock,
} = vi.hoisted(() => ({
  revalidatePathMock: vi.fn(),
  getMemberPageDetailsMock: vi.fn(),
  saveFoodiesRecipeMock: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock("@/features/family/services/family-services", () => ({
  getMemberPageDetails: getMemberPageDetailsMock,
}));

vi.mock("@/components/db/sql/queries-foodies", () => ({
  saveFoodiesRecipe: saveFoodiesRecipeMock,
  saveFoodiesTemplate: vi.fn(),
  toggleRecipeLike: vi.fn(),
  addRecipeComment: vi.fn(),
  getFoodiesRecipeDetail: vi.fn(),
  deleteRecipe: vi.fn(),
}));

import { logDbQueryError } from "@/components/db/sql/db-error-logger";
import { saveFoodiesRecipeAction } from "@/app/(features)/(foodies)/foodies/actions";

describe("Foodies action request correlation", () => {
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

  it("preserves one requestId across nested DB error logs in saveFoodiesRecipeAction", async () => {
    saveFoodiesRecipeMock.mockImplementation(async () => {
      logDbQueryError("foodies.saveFoodiesRecipe", new Error("column recipe_image_url does not exist"), {
        familyId: 28,
        memberId: 4,
      });

      logDbQueryError(
        "foodies.getFoodiesHomePageData",
        new Error("Failed query: select \"recipe_image_url\" from \"family_schema\".\"recipe\" where \"fk_family_id\" = $1 params: 28"),
        {
          familyId: 28,
          memberId: 4,
        }
      );

      return {
        success: false as const,
        message: "Failed to save recipe changes.",
      };
    });

    const result = await saveFoodiesRecipeAction({
      recipeTitle: "Lemon Pasta",
      recipeShortSummary: "Bright and fast weeknight pasta",
      prepTimeMins: 10,
      cookTimeMins: 15,
      status: "published",
      recipeImageUrl: "https://example.com/pasta.jpg",
      recipeJson: "{}",
      recipeProTipsJson: "{}",
      templateId: 1,
      selectedTagIds: [],
    });

    expect(result).toEqual({
      success: false,
      message: "Failed to save recipe changes.",
    });

    expect(revalidatePathMock).not.toHaveBeenCalled();

    const errorSpy = vi.mocked(console.error);
    expect(errorSpy).toHaveBeenCalledTimes(2);

    const firstPayload = errorSpy.mock.calls[0]?.[1] as Record<string, unknown>;
    const secondPayload = errorSpy.mock.calls[1]?.[1] as Record<string, unknown>;

    expect(firstPayload.requestId).toEqual(expect.any(String));
    expect(secondPayload.requestId).toEqual(expect.any(String));
    expect(firstPayload.requestId).toBe(secondPayload.requestId);

    expect(firstPayload.scope).toBe("foodies.saveFoodiesRecipe");
    expect(secondPayload.scope).toBe("foodies.getFoodiesHomePageData");
  });
});
