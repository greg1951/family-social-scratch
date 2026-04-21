import { redirect } from "next/navigation";

import { getTvHomePageData, getTvShowById } from "@/components/db/sql/queries-tv";
import { TvAddShowPage } from "@/features/tv/components/tv-add-show-page";
import { getMemberPageDetails } from "@/features/family/services/family-services";

export default async function EditShowPage({
  params,
}: {
  params: Promise<{ showId: string }>;
}) {
  const { showId } = await params;
  const parsedShowId = Number(showId);
  const memberKeyDetails = await getMemberPageDetails();

  if (!memberKeyDetails.isLoggedIn) {
    redirect("/");
  }

  if (!Number.isInteger(parsedShowId) || parsedShowId <= 0) {
    redirect("/tv");
  }

  const [tvData, showResult] = await Promise.all([
    getTvHomePageData(
      memberKeyDetails.familyId,
      memberKeyDetails.memberId,
      memberKeyDetails.isAdmin ?? false
    ),
    getTvShowById(memberKeyDetails.familyId, parsedShowId, memberKeyDetails.memberId),
  ]);

  if (!showResult.success || showResult.show.memberId !== memberKeyDetails.memberId) {
    redirect("/tv");
  }

  const showTags = tvData.success ? tvData.showTags : [];
  const showTemplates = tvData.success ? tvData.showTemplates : [];

  return (
    <TvAddShowPage
      showTags={ showTags }
      showTemplates={ showTemplates }
      member={ memberKeyDetails }
      initialShow={ showResult.show }
      mode="edit"
    />
  );
}
