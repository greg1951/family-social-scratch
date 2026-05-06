'use server';

import { updateFamilyInviteStatus } from "@/components/db/sql/queries-family-invite";
import { insertMemberNotifications } from "@/components/db/sql/queries-family-notifications";
import { insertMember, insertUser } from "@/components/db/sql/queries-family-user";
import { RegisterMemberInput } from "@/components/db/types/family-member";
import { sendLoginInstructionsEmail } from "@/components/emails/send-signin-email";
import { FounderDetails } from "@/features/family/types/family-members";
import { RegistrationMemberDetails } from "@/features/family/types/family-steps";
import {
  createFamilyActivityRecord,
  FAMILY_ACTIVITY_ACTION_TYPES,
} from "@/components/db/sql/queries-family-activity";
import { createThreadConversationWithInitialPost } from "@/components/db/sql/queries-thread-convos";


export const addRegisteredMember = async(memberDetails:RegisterMemberInput) => {

  memberDetails.isFounder = false;
  const insertMemberResult = await insertMember(memberDetails);
  // console.log("actions->addRegisteredMember->insertResult: ", insertMemberResult);
  if (!insertMemberResult.success) {
    // console.log('Error occurred inserting the new family member');
    return insertMemberResult;
  }

  await createFamilyActivityRecord({
    actionType: FAMILY_ACTIVITY_ACTION_TYPES.MEMBER_JOINED,
    featureName: 'Family Members',
    postName: `${ memberDetails.firstName } ${ memberDetails.lastName }`,
    familyId: memberDetails.familyId,
    memberId: insertMemberResult.id,
  });

  return insertMemberResult;
}

export const addMemberCreds = async(memberDetails:RegisterMemberInput, newMemberId: number) => {

  const insertUserResult = await insertUser({
    email: memberDetails.email,
    familyId: memberDetails.familyId,
    password: memberDetails.password,
    memberId: newMemberId,
  });
  if (!insertUserResult) {
    // console.log('Error occurred inserting the new user');
    return insertUserResult;
  }

  return {
    success: true,
  }
}

export const addMemberNotifications = async(newMemberId: number) => {

  const insertMemberNotificationsResult = await insertMemberNotifications(newMemberId);

  if (!insertMemberNotificationsResult.success) {
    // console.log('Error occurred inserting the member notifications');
    return insertMemberNotificationsResult;
  }

  return {
    success: true,
  }
}

export const updateInviteStatus = async(id: number, status: string) => {
  // console.log('actions->updateInviteStatus->id: ', id, 'status: ', status);
  const updateInviteStatusResult = await updateFamilyInviteStatus(id, status);
  if (updateInviteStatusResult.error) {
    // console.log('Error occurred updating the invite status');
    return updateInviteStatusResult;
  }

  return {
    error: false,
  } 
}

export const sendLoginInstructions = async(email: string, founderDetails: FounderDetails) => {



  const sendLoginInstructionsResult = await sendLoginInstructionsEmail(email, founderDetails);
  if (!sendLoginInstructionsResult || sendLoginInstructionsResult.error) {
    return { error: true };
  }
  return { error: false };
}

export const notifyFounderOfNewMemberRegistration = async({
  founderDetails,
  newMemberId,
  newMemberFirstName,
  newMemberLastName,
  newMemberEmail,
}: {
  founderDetails: FounderDetails;
  newMemberId: number;
  newMemberFirstName: string;
  newMemberLastName: string;
  newMemberEmail: string;
}) => {
  const threadContent = [
    "A new family member has completed registration.",
    "",
    `Member Name: ${ newMemberFirstName } ${ newMemberLastName }`,
    `Member Email: ${ newMemberEmail }`,
  ].join("\n");

  const threadResult = await createThreadConversationWithInitialPost(
    {
      title: "New Family Member Registered",
      subject: "Member registration completed",
      visibility: "private",
      recipientMemberIds: [founderDetails.memberId],
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
      familyId: founderDetails.familyId,
      senderMemberId: newMemberId,
      isFounder: false,
    },
  );

  if (!threadResult.success) {
    return {
      error: true,
      message: threadResult.message,
    };
  }

  return {
    error: false,
  };
};
