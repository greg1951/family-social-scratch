import { redirect } from "next/navigation";

import { getThreadConversationDetail, getThreadRecipientOptions } from "@/components/db/sql/queries-thread-convos";
import { getThreadTemplates } from "@/components/db/sql/queries-thread-templates";
import { getFounderDetails } from "@/features/family/services/get-founder-details";
import { ThreadComposePage } from "@/features/threads/components/thread-compose-page";
import { getMemberPageDetails } from "@/features/family/services/family-services";

export default async function ThreadsComposeRoutePage({
  searchParams,
}: {
  searchParams?: Promise<{ forwardConversationId?: string }>;
}) {
  const memberKeyDetails = await getMemberPageDetails();
  const resolvedSearchParams = await searchParams;

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

  const forwardConversationId = Number(resolvedSearchParams?.forwardConversationId);
  let forwardTitle: string | undefined;
  let forwardContentJson: string | undefined;

  if (Number.isInteger(forwardConversationId) && forwardConversationId > 0) {
    const forwardResult = await getThreadConversationDetail(
      forwardConversationId,
      memberKeyDetails.familyId,
      memberKeyDetails.memberId,
    );

    if (forwardResult.success) {
      const firstPost = forwardResult.conversation.posts[0];
      forwardTitle = forwardResult.conversation.title;
      forwardContentJson = firstPost?.contentJson;
    }
  }

  return (
    <ThreadComposePage
      memberId={ memberKeyDetails.memberId }
      firstName={ memberKeyDetails.firstName }
      isFounder={ memberKeyDetails.isFounder }
      recipients={ recipients }
      templates={ templates }
      founderData={ founder }
      initialTitle={ forwardTitle }
      initialContentJson={ forwardContentJson }
    />
  );
}
