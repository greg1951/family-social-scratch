import { redirect } from "next/navigation";

import { getThreadRecipientOptions } from "@/components/db/sql/queries-thread-convos";
import { ThreadComposePage } from "@/features/threads/components/thread-compose-page";
import { getMemberPageDetails } from "@/features/family/services/family-services";

export default async function ThreadsComposeRoutePage() {
  const memberKeyDetails = await getMemberPageDetails();

  if (!memberKeyDetails.isLoggedIn) {
    redirect("/");
  }

  const recipientResult = await getThreadRecipientOptions(
    memberKeyDetails.familyId,
    memberKeyDetails.memberId,
  );

  const recipients = recipientResult.success ? recipientResult.recipients : [];

  return (
    <ThreadComposePage
      memberId={ memberKeyDetails.memberId }
      firstName={ memberKeyDetails.firstName }
      isFounder={ memberKeyDetails.isFounder }
      recipients={ recipients }
    />
  );
}
