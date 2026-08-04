import { describe, expect, it } from "vitest";

import { canCommentOnRecipe } from "@/features/foodies/lib/recipe-comment-permissions";

describe("recipe comment permissions", () => {
  it("allows comments for non-submitters", () => {
    expect(canCommentOnRecipe({ memberId: 11, status: "published" }, 22)).toBe(true);
  });

  it("blocks comments for the recipe submitter", () => {
    expect(canCommentOnRecipe({ memberId: 11, status: "published" }, 11)).toBe(false);
  });

  it("blocks comments for templates", () => {
    expect(canCommentOnRecipe({ memberId: 11, status: "template" }, 22)).toBe(false);
  });
});
