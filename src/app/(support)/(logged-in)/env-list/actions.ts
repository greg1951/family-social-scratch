"use server";

import { revalidatePath } from "next/cache";

import {
  getSupportEnvironmentList,
  upsertSupportEnvironment,
} from "@/components/db/sql/queries-support";
import {
  type SupportEnvironmentListItem,
  type UpsertSupportEnvironmentInput,
  type UpsertSupportEnvironmentResult,
} from "@/components/db/types/support";
import { getMemberPageDetails } from "@/features/family/services/family-services";

async function assertAdmin() {
  const details = await getMemberPageDetails();

  if (!details.isLoggedIn || !details.isAdmin) {
    throw new Error("Unauthorized");
  }
}

export async function getSupportEnvironmentsAction(): Promise<SupportEnvironmentListItem[]> {
  await assertAdmin();
  return getSupportEnvironmentList();
}

export async function upsertSupportEnvironmentAction(
  input: UpsertSupportEnvironmentInput,
): Promise<UpsertSupportEnvironmentResult> {
  await assertAdmin();

  const result = await upsertSupportEnvironment(input);

  if (result.success) {
    revalidatePath("/env-list");
  }

  return result;
}
