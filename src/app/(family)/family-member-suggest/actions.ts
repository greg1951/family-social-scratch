"use server";

import { createThreadConversationWithInitialPost } from "@/components/db/sql/queries-thread-convos";
import { insertInvite } from "@/components/db/sql/queries-family-invite";
import { getFamilyFounderDetails } from "@/components/db/sql/queries-family-member";
import { InsertInviteInput } from "@/components/db/types/family-member";
import { getMemberPageDetails } from "@/features/family/services/family-services";



export const createSuggestedInvite= async ({
  suggestedInvite,
  }:{
    suggestedInvite: InsertInviteInput;
  }) => {
   
  /* Let the logic begin */
  if (suggestedInvite) {
    const senderDetails = await getMemberPageDetails();
    if (!senderDetails.isLoggedIn) {
      return {
        error: true,
        inviteCreated: false,
        threadNotificationRequired: false,
        threadNotificationSent: false,
        message: "You must be signed in to submit a suggestion.",
      };
    }

    if (senderDetails.familyId !== suggestedInvite.familyId) {
      return {
        error: true,
        inviteCreated: false,
        threadNotificationRequired: false,
        threadNotificationSent: false,
        message: "Suggestion family context does not match your signed-in family.",
      };
    }

    const insertInvitesResult = await insertInvite(suggestedInvite);

    console.log('createSuggestedInvite->insertInvitesResult: ', insertInvitesResult);

    if (!insertInvitesResult.success) {
      return {
        error: true,
        inviteCreated: false,
        threadNotificationRequired: false,
        threadNotificationSent: false,
        message: insertInvitesResult.message,
      }
    }

    const founderResult = await getFamilyFounderDetails(suggestedInvite.familyId);
    if (!founderResult.success || !founderResult.memberId) {
      return {
        error: true,
        inviteCreated: true,
        threadNotificationRequired: true,
        threadNotificationSent: false,
        message: "Suggested invite saved, but family founder could not be located for thread notification.",
      };
    }

    // No notification thread needed when the founder submits a self-directed suggestion.
    if (founderResult.memberId === senderDetails.memberId) {
      return {
        error: false,
        inviteCreated: true,
        threadNotificationRequired: false,
        threadNotificationSent: false,
      };
    }

    if (founderResult.memberId !== senderDetails.memberId) {
      const threadContent = [
        "A family member has submitted a suggested invite.",
        "",
        `Suggested Member: ${suggestedInvite.firstName} ${suggestedInvite.lastName}`,
        `Suggested Email: ${suggestedInvite.email}`,
        `Suggested By: ${senderDetails.firstName} ${senderDetails.lastName} (${senderDetails.email})`,
      ].join("\n");

      const threadResult = await createThreadConversationWithInitialPost(
        {
          title: "Suggested Family Member",
          visibility: "private",
          recipientMemberIds: [founderResult.memberId],
          content: threadContent,
          contentJson: JSON.stringify({
            type: "doc",
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: threadContent }],
              },
            ],
          }),
        },
        {
          familyId: senderDetails.familyId,
          senderMemberId: senderDetails.memberId,
          isFounder: senderDetails.isFounder,
        },
      );

      if (!threadResult.success) {
        return {
          error: true,
          inviteCreated: true,
          threadNotificationRequired: true,
          threadNotificationSent: false,
          message: `Suggested invite saved, but founder notification thread failed: ${threadResult.message}`,
        };
      }
    }

    // revalidatePath("/family-member-account");
    return {
      error: false,
      inviteCreated: true,
      threadNotificationRequired: true,
      threadNotificationSent: true,
      }
    }
  }
