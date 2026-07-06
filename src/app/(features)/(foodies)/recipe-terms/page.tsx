import { redirect } from "next/navigation";

import { getRecipeTerms } from "@/components/db/sql/queries-foodies";
import { RecipeTermsHomePage } from "@/features/foodies/components/recipe-terms-home-page";
import { getMemberPageDetails } from "@/features/family/services/family-services";

export default async function RecipeTermsPage() {
  const memberKeyDetails = await getMemberPageDetails();

  if (!memberKeyDetails.isLoggedIn) {
    redirect("/");
  }

  const recipeTermsResult = await getRecipeTerms();
  const recipeTerms = recipeTermsResult.success ? recipeTermsResult.recipeTerms : [];
  const canManageTerms = (memberKeyDetails.isAdmin ?? false) && memberKeyDetails.familyId === 1;

  return (
    <RecipeTermsHomePage
      recipeTerms={ recipeTerms }
      isAdmin={ canManageTerms }
    />
  );
}
