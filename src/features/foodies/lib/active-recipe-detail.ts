import type { FoodiesRecipeDetail } from "@/components/db/types/recipes";

export function getActiveFoodiesRecipeDetail(
  selectedRecipeId: number,
  selectedRecipeDetail: FoodiesRecipeDetail | null
) {
  return selectedRecipeDetail?.id === selectedRecipeId ? selectedRecipeDetail : null;
}
