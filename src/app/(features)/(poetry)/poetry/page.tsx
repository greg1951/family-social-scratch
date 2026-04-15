import PoetryHomePage from "@/features/poetry/components/poetry-home-page";

import { redirect } from "next/navigation";
import { getMemberPageDetails } from "@/features/family/services/family-services";
import { getPoetryHomePageData } from "@/components/db/sql/queries-poetry-cafe";

export default async function PoetryPage() {
  const memberKeyDetails = await getMemberPageDetails();

  if (!memberKeyDetails.isLoggedIn) {
    redirect("/");
  }

  const poetryHomeData = await getPoetryHomePageData(memberKeyDetails.familyId, memberKeyDetails.memberId);

  const poems = poetryHomeData.success ? poetryHomeData.poems : [];
  const poemTags = poetryHomeData.success ? poetryHomeData.poemTags : [];

  return (
    <PoetryHomePage
      poems={ poems }
      poemTags={ poemTags }
      member={ memberKeyDetails }
    />
  );
}