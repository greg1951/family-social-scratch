import { redirect } from "next/navigation";

import { getRecipeTermById } from "@/components/db/sql/queries-foodies";
import { RecipeTermEditorPage } from "@/features/foodies/components/recipe-term-editor-page";
import { getMemberPageDetails } from "@/features/family/services/family-services";

export default async function ManageRecipeTermPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const memberKeyDetails = await getMemberPageDetails();

  if (!memberKeyDetails.isLoggedIn) redirect("/");
  if (!memberKeyDetails.isAdmin) redirect("/foodies");

  const { id } = await searchParams;
  const recipeTermId = id ? Number(id) : undefined;

  if (id && (!recipeTermId || Number.isNaN(recipeTermId))) redirect("/foodies");

  const recipeTermResult = recipeTermId ? await getRecipeTermById(recipeTermId) : null;

  if (recipeTermId && (!recipeTermResult || !recipeTermResult.success)) redirect("/foodies");

  return (
    <RecipeTermEditorPage
      recipeTerm={ recipeTermResult?.success ? recipeTermResult.recipeTerm : null }
    />
  );
}
