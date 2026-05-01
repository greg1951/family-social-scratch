"use server";

import { revalidatePath } from "next/cache";

import {
  getSupportIssueDetail,
  getSupportIssueList,
  createSupportResponse,
  updateIssueTeamAssignment,
} from "@/components/db/sql/queries-support";
import {
  type CreateSupportResponseInput,
  type CreateSupportResponseResult,
  type SupportIssueDetail,
  type SupportIssueListItem,
  type UpdateIssueTeamResult,
} from "@/components/db/types/support";
import { getMemberPageDetails } from "@/features/family/services/family-services";

async function assertAdmin() {
  const details = await getMemberPageDetails();

  if (!details.isLoggedIn || !details.isAdmin) {
    throw new Error("Unauthorized");
  }
}

export async function getSupportIssuesAction(): Promise<SupportIssueListItem[]> {
  await assertAdmin();
  return getSupportIssueList();
}

export async function getSupportIssueDetailAction(
  issueId: number,
): Promise<SupportIssueDetail | null> {
  await assertAdmin();
  return getSupportIssueDetail(issueId);
}

export async function updateIssueTeamAction(
  issueId: number,
  targetLevel: "L1" | "L2",
): Promise<UpdateIssueTeamResult> {
  await assertAdmin();
  const result = await updateIssueTeamAssignment(issueId, targetLevel);

  if (result.success) {
    revalidatePath("/issues-list");
  }

  return result;
}

export async function createSupportResponseAction(
  issueId: number,
  input: CreateSupportResponseInput,
): Promise<CreateSupportResponseResult> {
  await assertAdmin();
  const result = await createSupportResponse(issueId, input);

  if (result.success) {
    revalidatePath("/issues-list");
  }

  return result;
}
