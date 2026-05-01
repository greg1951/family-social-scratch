"use server";

import { revalidatePath } from "next/cache";

import {
  createMemberSupportResponse,
  createSupportIssue,
  getMemberSupportIssueResponseContext,
} from "@/components/db/sql/queries-support";
import type { CreateSupportIssueInput, CreateSupportResponseInput } from "@/components/db/types/support";
import { getMemberPageDetails } from "@/features/family/services/family-services";

export async function createSupportIssueAction(input: CreateSupportIssueInput) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn) {
    return {
      success: false as const,
      message: "You must be signed in to submit a support issue.",
    };
  }

  const result = await createSupportIssue(input, {
    memberId: memberDetails.memberId,
    familyId: memberDetails.familyId,
    familyName: memberDetails.familyName,
    memberName: `${ memberDetails.firstName } ${ memberDetails.lastName }`.trim(),
  });

  if (result.success) {
    revalidatePath("/open-issue");
  }

  return result;
}

export async function getMemberSupportIssueResponseContextAction(
  supportIssueId: number,
  issueResponseId: number,
) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn) {
    return {
      success: false as const,
      message: "You must be signed in to view support replies.",
    };
  }

  return getMemberSupportIssueResponseContext(supportIssueId, issueResponseId, memberDetails.memberId);
}

export async function createMemberSupportResponseAction(
  supportIssueId: number,
  input: CreateSupportResponseInput,
) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn) {
    return {
      success: false as const,
      message: "You must be signed in to submit a support reply.",
    };
  }

  const result = await createMemberSupportResponse(supportIssueId, input, memberDetails.memberId);

  if (result.success) {
    revalidatePath("/open-issue/reply");
    revalidatePath("/issues-list");
  }

  return result;
}