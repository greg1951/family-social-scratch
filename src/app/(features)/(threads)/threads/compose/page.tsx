import { redirect } from "next/navigation";

import { getThreadRecipientOptions } from "@/components/db/sql/queries-thread-convos";
import { getThreadTemplates } from "@/components/db/sql/queries-thread-templates";
import { getFounderDetails } from "@/features/family/services/get-founder-details";
import { ThreadComposePage } from "@/features/threads/components/thread-compose-page";
import { getMemberPageDetails } from "@/features/family/services/family-services";

export default async function ThreadsComposeRoutePage() {
  const memberKeyDetails = await getMemberPageDetails();

  if (!memberKeyDetails.isLoggedIn) {
    redirect("/");
  }

  const [recipientResult, templatesResult, founderResult] = await Promise.all([
    getThreadRecipientOptions(memberKeyDetails.familyId, memberKeyDetails.memberId),
    getThreadTemplates("thread"),
    getFounderDetails(memberKeyDetails.familyId),
  ]);

  const recipients = recipientResult.success ? recipientResult.recipients : [];
  const templates = templatesResult.success ? templatesResult.templates : [];
  const founder =
    founderResult.success && founderResult.founderDetails
      ? { firstName: founderResult.founderDetails.firstName, lastName: founderResult.founderDetails.lastName }
      : { firstName: "", lastName: "" };

  return (
    <ThreadComposePage
      memberId={ memberKeyDetails.memberId }
      firstName={ memberKeyDetails.firstName }
      isFounder={ memberKeyDetails.isFounder }
      recipients={ recipients }
      templates={ templates }
      founderData={ founder }
    />
  );
}
