'use server';

import { revalidatePath } from "next/cache";

import {
  deleteSupportFaq,
  saveSupportFaq,
} from "@/components/db/sql/queries-support";
import {
  DeleteSupportFaqReturn,
  SaveSupportFaqInput,
  SaveSupportFaqReturn,
} from "@/components/db/types/support";
import { getMemberPageDetails } from "@/features/family/services/family-services";

async function ensureSupportAdminAccess(): Promise<null | { success: false; message: string }> {
  const memberKeyDetails = await getMemberPageDetails();

  if (!memberKeyDetails.isLoggedIn || !memberKeyDetails.isAdmin) {
    return {
      success: false,
      message: "Only support admins can manage FAQs.",
    };
  }

  return null;
}

export async function createSupportFaqAction(input: SaveSupportFaqInput): Promise<SaveSupportFaqReturn> {
  const accessError = await ensureSupportAdminAccess();

  if (accessError) {
    return accessError;
  }

  const result = await saveSupportFaq(input);

  if (result.success) {
    revalidatePath('/faq-maintenance');
    revalidatePath('/faq');
  }

  return result;
}

export async function updateSupportFaqAction(input: SaveSupportFaqInput): Promise<SaveSupportFaqReturn> {
  const accessError = await ensureSupportAdminAccess();

  if (accessError) {
    return accessError;
  }

  const result = await saveSupportFaq(input);

  if (result.success) {
    revalidatePath('/faq-maintenance');
    revalidatePath('/faq');
  }

  return result;
}

export async function deleteSupportFaqAction(id: number): Promise<DeleteSupportFaqReturn> {
  const accessError = await ensureSupportAdminAccess();

  if (accessError) {
    return accessError;
  }

  const result = await deleteSupportFaq(id);

  if (result.success) {
    revalidatePath('/faq-maintenance');
    revalidatePath('/faq');
  }

  return result;
}