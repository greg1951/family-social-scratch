import { redirect } from "next/navigation";
import { getMemberPageDetails } from "@/features/family/services/family-services";
import { getPoemCategoryWithTags } from "@/components/db/sql/queries-poetry-cafe";
import { PoemTermsHomePage } from "@/features/poetry/components/poem-terms-home-page";

export default async function PoemTermsPage() {
  const memberKeyDetails = await getMemberPageDetails();

  if (!memberKeyDetails.isLoggedIn) {
    redirect("/");
  }

  const poemCategoryWithTagsResult = await getPoemCategoryWithTags();

  const poemCategories = poemCategoryWithTagsResult.success ? poemCategoryWithTagsResult.categories : [];
  const canManageTerms = (memberKeyDetails.isAdmin ?? false) && memberKeyDetails.familyId === 1;

  return (
    <PoemTermsHomePage
      poemCategories={ poemCategories }
      isAdmin={ canManageTerms }
    />
  );
}