export interface RecipeCommentPermissionRecipe {
  memberId: number;
  status?: string | null;
}

export function canCommentOnRecipe(
  recipe: RecipeCommentPermissionRecipe | null | undefined,
  viewerMemberId: number | null | undefined
): boolean {
  if (!recipe || viewerMemberId == null) {
    return false;
  }

  return recipe.status !== "template" && recipe.memberId !== viewerMemberId;
}
