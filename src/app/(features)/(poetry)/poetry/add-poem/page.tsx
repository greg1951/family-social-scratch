import { redirect } from "next/navigation";

import { getPoemById, getPoetryHomePageData } from "@/components/db/sql/queries-poetry-cafe";
import { PoemAddPage } from "@/features/poetry/components/poem-add-page";
import { getMemberPageDetails } from "@/features/family/services/family-services";

export default async function AddPoemPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const memberKeyDetails = await getMemberPageDetails();

  if (!memberKeyDetails.isLoggedIn) {
    redirect("/");
  }

  const { id } = await searchParams;
  const poemId = id ? parseInt(id, 10) : null;

  const [poetryData, editPoemResult] = await Promise.all([
    getPoetryHomePageData(memberKeyDetails.familyId, memberKeyDetails.memberId),
    poemId && !isNaN(poemId)
      ? getPoemById(memberKeyDetails.familyId, poemId, memberKeyDetails.memberId)
      : Promise.resolve(null),
  ]);

  const poemTags = poetryData.success ? poetryData.poemTags : [];

  // Only allow editing if the logged-in member is the submitter or an admin
  const initialPoem =
    editPoemResult?.success &&
      (editPoemResult.poem.memberId === memberKeyDetails.memberId || memberKeyDetails.isAdmin)
      ? editPoemResult.poem
      : null;

  // If an id was requested but the poem wasn't found or not editable, redirect to the list
  if (poemId && !initialPoem) {
    redirect("/poetry");
  }

  return (
    <PoemAddPage
      poemTags={ poemTags }
      member={ memberKeyDetails }
      initialPoem={ initialPoem }
    />
  );
}
