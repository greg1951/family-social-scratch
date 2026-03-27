'use client';

import { CurrentFamilyMember, CurrentMembersValues } from "@/features/family/types/family-members";
import { StatusUpdateCounts, StatusUpdateProcessing } from "@/components/db/types/family-member";
import { CurrentMembersFormSchema } from "@/features/family/components/validation/schema";
import { MemberKeyDetails } from "../types/family-steps";

type CurrentFamilyMembers = CurrentFamilyMember[];

export function initializeFormProcessingArray({formCurrentMembers, originalMembers, founderKeyDetails} 
  : { formCurrentMembers: CurrentFamilyMembers, originalMembers: CurrentFamilyMembers, founderKeyDetails: MemberKeyDetails }  )
  : StatusUpdateProcessing[] {

    const currentMemberValues: CurrentMembersValues = {
      currentMembers: formCurrentMembers.map((member) => ({
        id: member.id,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        status: member.status,
      })),
    };

    const originalMemberValues: CurrentMembersValues = {
      currentMembers: originalMembers.map((member) => ({
        id: member.id,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        status: member.status,
      })),
    };

    let updatedInvites: StatusUpdateProcessing[] = [];
    for (let i = 0; i < originalMemberValues.currentMembers.length; i++) {
      const currentMember = currentMemberValues.currentMembers[i];
      const originalMember = originalMemberValues.currentMembers[i];
      if (currentMember.status !== originalMember.status) {
        updatedInvites.push({
          inviteId: currentMember.id,
          newStatus: currentMember.status,
          originalStatus: originalMember.status,
          email: currentMember.email,
          deleteMember:
            originalMember.status === 'joined'
              && currentMember.status === 'remove' ? true : false,
        });
      }
    };

    return updatedInvites;

  }

export function initializeProcessUpdateCounts() : StatusUpdateCounts {

  let statusUpdateCounts: StatusUpdateCounts = {
    totalUpdateCount: 0,
    totalInviteRecordsCount: 0,
    inviteAddCount: 0,
    totalDeleteRecordsCount: 0,
    userDeleteCount: 0,
    memberDeleteCount: 0,
    inviteDeleteCount: 0,
    totalResendRecordsCount: 0,
    resendCount: 0,
    resendEmailsSentCount: 0,
  };

  return statusUpdateCounts;
}

export function initializeRecordCounts(updatedInvites: StatusUpdateProcessing[], statusUpdateCounts: StatusUpdateCounts)
: StatusUpdateCounts {

  for (let ix=0; ix < updatedInvites.length; ix++) {
    if (updatedInvites[ix].newStatus === 'resend') 
      statusUpdateCounts.totalResendRecordsCount++;
    else if (updatedInvites[ix].newStatus === 'remove' ) 
      statusUpdateCounts.totalDeleteRecordsCount++;
    else if (updatedInvites[ix].newStatus === 'invite' ) 
      statusUpdateCounts.totalInviteRecordsCount++;
  }

  return statusUpdateCounts;
}
