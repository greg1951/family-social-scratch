"use server";

import { getMemberPageDetails } from "@/features/family/services/family-services";
import {
  applyGuidedTourProgressCommand,
  resolveGuidedTourLaunch,
  type ApplyGuidedTourProgressCommandInput,
} from "@/components/db/sql/queries-guided-runtime";

type GuidedProgressActionInput = Omit<
  ApplyGuidedTourProgressCommandInput,
  "memberId" | "familyId"
>;

export async function getNewMemberTourLaunchPlanAction() {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn) {
    return {
      success: true as const,
      launch: false as const,
      reason: "Member is not logged in.",
    };
  }

  return resolveGuidedTourLaunch({
    memberId: memberDetails.memberId,
    familyId: memberDetails.familyId,
    isFounder: memberDetails.isFounder,
    audienceType: "member",
    tourKey: "new_member",
  });
}

export async function applyGuidedTourProgressCommandAction(input: GuidedProgressActionInput) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn) {
    return {
      success: false as const,
      message: "You must be logged in to update tour progress.",
    };
  }

  return applyGuidedTourProgressCommand({
    ...input,
    memberId: memberDetails.memberId,
    familyId: memberDetails.familyId,
  });
}
