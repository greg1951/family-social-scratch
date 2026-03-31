'use server';

import { updateFamilyInviteStatus } from "@/components/db/sql/queries-family-invite";
import { insertMemberNotifications } from "@/components/db/sql/queries-family-notifications";
import { insertMember, insertUser } from "@/components/db/sql/queries-family-user";
import { RegisterMemberInput } from "@/components/db/types/family-member";
import { sendLoginInstructionsEmail } from "@/components/emails/send-signin-email";
import { FounderDetails } from "@/features/family/types/family-members";
import { RegistrationMemberDetails } from "@/features/family/types/family-steps";


export const addRegisteredMember = async(memberDetails:RegisterMemberInput) => {

  memberDetails.isFounder = false;
  const insertMemberResult = await insertMember(memberDetails);
  // console.log("actions->addRegisteredMember->insertResult: ", insertMemberResult);
  if (!insertMemberResult.success) {
    // console.log('Error occurred inserting the new family member');
    return insertMemberResult;
  }

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
