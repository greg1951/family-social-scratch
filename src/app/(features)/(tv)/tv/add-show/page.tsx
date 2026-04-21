import { redirect } from "next/navigation";

import { getTvHomePageData } from "@/components/db/sql/queries-tv";
import { TvAddShowPage } from "@/features/tv/components/tv-add-show-page";
import { getMemberPageDetails } from "@/features/family/services/family-services";

export default async function AddShowPage() {
  const memberKeyDetails = await getMemberPageDetails();

  if (!memberKeyDetails.isLoggedIn) {
    redirect("/");
  }

  const tvData = await getTvHomePageData(
    memberKeyDetails.familyId,
    memberKeyDetails.memberId,
    memberKeyDetails.isAdmin ?? false
  );

  const showTags = tvData.success ? tvData.showTags : [];
  const showTemplates = tvData.success ? tvData.showTemplates : [];

  return (
    <TvAddShowPage
      showTags={ showTags }
      showTemplates={ showTemplates }
      member={ memberKeyDetails }
    />
  );
}
