'use server';

import { revalidatePath } from 'next/cache';

import { deleteInvite, getInvitebyInviteId, updateFamilyInviteMemberDetails } from '@/components/db/sql/queries-family-invite';
import { getAllFamilyMembers, updateMemberProfileByFounder } from '@/components/db/sql/queries-family-member';
import { updateUserEmailByMemberId } from '@/components/db/sql/queries-user';
import { sendEmails } from '@/app/(family)/(family-members)/family-new-members/actions';
import { addNewAccountInvites } from '@/app/(family)/(family-members)/family-new-members/actions';
import { removeFamilyMemberAction } from '@/app/(family)/(family-members)/family-current-members/actions';
import { getMemberPageDetails } from '@/features/family/services/family-services';
import { NewFamilyInvites } from '@/features/family/types/family-members';

type ActionResult = {
  success: boolean;
  message: string;
};

function getFounderGuardError() {
  return {
    success: false,
    message: 'Only the family founder can manage family members.',
  } satisfies ActionResult;
}

export async function addFamilyMemberAction(input: {
  firstName: string;
  lastName: string;
  email: string;
  inviteFounderMessage?: string;
}): Promise<ActionResult> {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn || !memberDetails.isFounder) {
    return getFounderGuardError();
  }

  const normalizedEmail = input.email.trim().toLowerCase();
  const existingMembersResult = await getAllFamilyMembers(memberDetails.familyId);
  if (!existingMembersResult.success) {
    return {
      success: false,
      message: existingMembersResult.message,
    };
  }

  const duplicateExists = existingMembersResult.members.some(
    (member) => member.email.trim().toLowerCase() === normalizedEmail,
  );

  if (duplicateExists) {
    return {
      success: false,
      message: 'That email already belongs to a current or invited family member.',
    };
  }

  const newInvites: NewFamilyInvites = {
    newInvites: [
      {
        id: crypto.randomUUID(),
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        email: normalizedEmail,
        inviteFounderMessage: input.inviteFounderMessage?.trim() || undefined,
      },
    ],
  };

  const addInviteResult = await addNewAccountInvites({
    newInvites,
    familyId: memberDetails.familyId,
    founderMemberId: memberDetails.memberId,
  });

  if (!addInviteResult.success) {
    return {
      success: false,
      message: addInviteResult.message,
    };
  }

  const sendResult = await sendEmails(
    addInviteResult.invites,
    memberDetails.familyName,
    memberDetails.familyId,
    memberDetails,
  );

  if (sendResult.error) {
    return {
      success: false,
      message: sendResult.message,
    };
  }

  revalidatePath('/family-founder-account');

  return {
    success: true,
    message: 'Invitation sent and the member was added with invited status.',
  };
}

export async function updateFamilyMemberAction(input: {
  inviteId: number;
  memberId?: number | null;
  firstName: string;
  lastName: string;
  email: string;
  birthday?: string;
  cellPhone?: string;
  status: 'joined' | 'invited' | 'declined';
  inviteFounderMessage?: string;
}): Promise<ActionResult> {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn || !memberDetails.isFounder) {
    return getFounderGuardError();
  }

  const inviteResult = await getInvitebyInviteId(input.inviteId);
  if (inviteResult.error || inviteResult.familyId !== memberDetails.familyId) {
    return {
      success: false,
      message: 'The selected family member could not be found.',
    };
  }

  const normalizedEmail = input.email.trim().toLowerCase();
  const existingMembersResult = await getAllFamilyMembers(memberDetails.familyId);
  if (!existingMembersResult.success) {
    return {
      success: false,
      message: existingMembersResult.message,
    };
  }

  const duplicateExists = existingMembersResult.members.some(
    (member) => member.id !== input.inviteId && member.email.trim().toLowerCase() === normalizedEmail,
  );

  if (duplicateExists) {
    return {
      success: false,
      message: 'That email already belongs to a current or invited family member.',
    };
  }

  const normalizedStatus = input.memberId ? 'joined' : input.status;
  const inviteUpdateResult = await updateFamilyInviteMemberDetails({
    familyId: memberDetails.familyId,
    inviteId: input.inviteId,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    email: normalizedEmail,
    status: normalizedStatus,
    inviteFounderMessage: input.inviteFounderMessage,
  });

  if (!inviteUpdateResult.success) {
    return inviteUpdateResult;
  }

  if (input.memberId) {
    const memberUpdateResult = await updateMemberProfileByFounder({
      memberId: input.memberId,
      familyId: memberDetails.familyId,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email: normalizedEmail,
      birthday: input.birthday?.trim() || '01/01/1970',
      cellPhone: input.cellPhone?.trim() || '(000) 000-0000',
    });

    if (!memberUpdateResult.success) {
      return memberUpdateResult;
    }

    const userUpdateResult = await updateUserEmailByMemberId(input.memberId, normalizedEmail);
    if (userUpdateResult.error) {
      return {
        success: false,
        message: userUpdateResult.message ?? 'User account email could not be updated.',
      };
    }
  }

  revalidatePath('/family-founder-account');

  return {
    success: true,
    message: 'Family member details updated.',
  };
}

export async function resendFamilyInvitationAction(input: { inviteId: number }): Promise<ActionResult> {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn || !memberDetails.isFounder) {
    return getFounderGuardError();
  }

  const inviteResult = await getInvitebyInviteId(input.inviteId);
  if (inviteResult.error || inviteResult.familyId !== memberDetails.familyId) {
    return {
      success: false,
      message: 'The selected invitation could not be found.',
    };
  }

  const sendResult = await sendEmails(
    [{
      id: inviteResult.inviteId,
      email: inviteResult.email,
      firstName: inviteResult.firstName,
      lastName: inviteResult.lastName,
      inviteFounderMessage: inviteResult.inviteFounderMessage,
      createdAt: new Date(),
    }],
    memberDetails.familyName,
    memberDetails.familyId,
    memberDetails,
  );

  if (sendResult.error) {
    return {
      success: false,
      message: sendResult.message,
    };
  }

  return {
    success: true,
    message: 'Invitation email sent again.',
  };
}

export async function updateAndResendFamilyInvitationAction(input: {
  inviteId: number;
  firstName: string;
  lastName: string;
  email: string;
  inviteFounderMessage?: string;
}): Promise<ActionResult> {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn || !memberDetails.isFounder) {
    return getFounderGuardError();
  }

  const inviteResult = await getInvitebyInviteId(input.inviteId);
  if (inviteResult.error || inviteResult.familyId !== memberDetails.familyId) {
    return {
      success: false,
      message: 'The selected invitation could not be found.',
    };
  }

  const normalizedEmail = input.email.trim().toLowerCase();
  const existingMembersResult = await getAllFamilyMembers(memberDetails.familyId);
  if (!existingMembersResult.success) {
    return {
      success: false,
      message: existingMembersResult.message,
    };
  }

  const duplicateExists = existingMembersResult.members.some(
    (member) => member.id !== input.inviteId && member.email.trim().toLowerCase() === normalizedEmail,
  );

  if (duplicateExists) {
    return {
      success: false,
      message: 'That email already belongs to a current or invited family member.',
    };
  }

  const inviteUpdateResult = await updateFamilyInviteMemberDetails({
    familyId: memberDetails.familyId,
    inviteId: input.inviteId,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    email: normalizedEmail,
    status: 'resend',
    inviteFounderMessage: input.inviteFounderMessage?.trim() || undefined,
  });

  if (!inviteUpdateResult.success) {
    return inviteUpdateResult;
  }

  const sendResult = await sendEmails(
    [{
      id: inviteResult.inviteId,
      email: normalizedEmail,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      inviteFounderMessage: input.inviteFounderMessage?.trim() || undefined,
      createdAt: new Date(),
    }],
    memberDetails.familyName,
    memberDetails.familyId,
    memberDetails,
  );

  if (sendResult.error) {
    return {
      success: false,
      message: sendResult.message,
    };
  }

  revalidatePath('/family-founder-account');

  return {
    success: true,
    message: 'Invitation updated and sent again.',
  };
}

export async function removePendingFamilyMemberAction(input: { inviteId: number }): Promise<ActionResult> {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn || !memberDetails.isFounder) {
    return getFounderGuardError();
  }

  const inviteResult = await getInvitebyInviteId(input.inviteId);
  if (inviteResult.error || inviteResult.familyId !== memberDetails.familyId) {
    return {
      success: false,
      message: 'The selected invitation could not be found.',
    };
  }

  const deleteResult = await deleteInvite(input.inviteId);
  if (!deleteResult.success) {
    return {
      success: false,
      message: deleteResult.message ?? 'Invitation could not be removed.',
    };
  }

  revalidatePath('/family-founder-account');

  return {
    success: true,
    message: 'Invitation removed.',
  };
}

export async function removeJoinedFamilyMemberAction(input: {
  memberId: number;
  deleteType: 'soft' | 'hard';
}): Promise<ActionResult> {
  const result = await removeFamilyMemberAction({
    targetMemberId: input.memberId,
    deleteType: input.deleteType,
  });

  return {
    success: result.success,
    message: result.message,
  };
}