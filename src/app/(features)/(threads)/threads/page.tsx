import { redirect } from "next/navigation";
import { getMemberPageDetails } from "@/features/family/services/family-services";
import { getConvoSummaries } from "@/components/db/sql/queries-thread-convos";
import { ThreadsHomePage } from "@/features/threads/components/threads-home-page"

export default async function ThreadsPage() {
  const memberKeyDetails = await getMemberPageDetails();

  if (!memberKeyDetails.isLoggedIn) {
    redirect("/");
  }

  const summariesResult = await getConvoSummaries(
    memberKeyDetails.familyId,
    memberKeyDetails.memberId,
  );

  const summaries = summariesResult.success ? summariesResult.summaries : [];

  return (
    <ThreadsHomePage
      summaries={ summaries }
      memberId={ memberKeyDetails.memberId }
      firstName={ memberKeyDetails.firstName }
    />
  );
}
