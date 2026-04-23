import { redirect } from "next/navigation";

import { getFoodiesHomePageData, getFoodiesRecipeById, getFoodiesRecipeDetail } from "@/components/db/sql/queries-foodies";
import { FoodiesAddRecipePage } from "@/features/foodies/components/foodies-add-recipe-page";
import { getMemberPageDetails } from "@/features/family/services/family-services";

export default async function EditRecipePage({
  params,
}: {
  params: Promise<{ recipeId: string }>;
}) {
  const { recipeId } = await params;
  const parsedRecipeId = Number(recipeId);
  const memberKeyDetails = await getMemberPageDetails();

  if (!memberKeyDetails.isLoggedIn) {
    redirect("/");
  }

  if (!Number.isInteger(parsedRecipeId) || parsedRecipeId <= 0) {
    redirect("/foodies");
  }

  const [foodiesData, recipeResult, recipeDetailResult] = await Promise.all([
    getFoodiesHomePageData(
      memberKeyDetails.familyId,
      memberKeyDetails.memberId,
      memberKeyDetails.isAdmin ?? false
    ),
    getFoodiesRecipeById(memberKeyDetails.familyId, parsedRecipeId),
    getFoodiesRecipeDetail(memberKeyDetails.familyId, parsedRecipeId, memberKeyDetails.memberId),
  ]);

  if (!recipeResult.success || recipeResult.recipe.memberId !== memberKeyDetails.memberId) {
    redirect("/foodies");
  }

  const recipeTags = foodiesData.success ? foodiesData.recipeTags : [];
  const recipeTemplates = foodiesData.success ? foodiesData.recipeTemplates : [];
  const initialRecipeProTipsJson = recipeDetailResult.success
    ? recipeDetailResult.recipe.recipeProTips.find((proTip) => proTip.memberId === memberKeyDetails.memberId)?.proTipJson
    : undefined;

  return (
    <FoodiesAddRecipePage
      recipeTags={ recipeTags }
      recipeTemplates={ recipeTemplates }
      member={ memberKeyDetails }
      initialRecipe={ recipeResult.recipe }
      initialRecipeProTipsJson={ initialRecipeProTipsJson }
      initialSubmitterLikenessDegree={ recipeDetailResult.success ? recipeDetailResult.recipe.likenessDegree : null }
      mode="edit"
    />
  );
}
