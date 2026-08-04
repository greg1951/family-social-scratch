import { describe, expect, it } from "vitest";

import type { FoodiesRecipe, FoodiesRecipeDetail } from "@/components/db/types/recipes";
import { getActiveFoodiesRecipeDetail } from "@/features/foodies/lib/active-recipe-detail";
import { getRecipeReactionMemberNames } from "@/features/foodies/lib/reaction-member-names";

function createRecipeDetail(id: number): FoodiesRecipeDetail {
  return {
    id,
    recipeTitle: "Sample Recipe",
    recipeShortSummary: "Summary",
    recipeJson: "{}",
    status: "published",
    recipeImageUrl: null,
    prepTimeMins: 10,
    cookTimeMins: 20,
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    memberId: 22,
    familyId: 7,
    submitterName: "Member Name",
    submitterLikenessDegree: null,
    commentCount: 0,
    noRatingCount: 0,
    thumbsUpCount: 0,
    loveCount: 0,
    likedByMember: false,
    likenessDegree: null,
    selectedTagIds: [],
    tagNamesByType: {},
    templateId: null,
    thumbsUpMemberNames: [],
    loveMemberNames: [],
    recipeProTips: [
      {
        id: 901,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        commenterName: "Tip Author",
        memberId: 22,
        proTipJson: "{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\",\"text\":\"Always rest the dough.\"}]}]}",
      },
    ],
    recipeComments: [],
    discussionThreads: [],
    hasDiscussionThread: false,
  };
}

describe("Foodies Home Page active detail state", () => {
  it("returns null when detail belongs to a different selected recipe", () => {
    const staleDetail = createRecipeDetail(100);

    const activeDetail = getActiveFoodiesRecipeDetail(101, staleDetail);

    expect(activeDetail).toBeNull();
  });

  it("returns recipe detail when detail matches the selected recipe", () => {
    const matchingDetail = createRecipeDetail(250);

    const activeDetail = getActiveFoodiesRecipeDetail(250, matchingDetail);

    expect(activeDetail).toEqual(matchingDetail);
    expect(activeDetail?.recipeProTips).toHaveLength(1);
  });

  it("uses fallback member names when the count is positive but the detail member list is empty", () => {
    const memberNames = getRecipeReactionMemberNames(2, [], ["Alyssa", "Ben"]);

    expect(memberNames).toEqual(["Alyssa", "Ben"]);
  });

  it("returns an empty list when there are no reactions and no names", () => {
    const memberNames = getRecipeReactionMemberNames(0, null, []);

    expect(memberNames).toEqual([]);
  });
});
