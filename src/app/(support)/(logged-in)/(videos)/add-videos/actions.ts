"use server";

import { revalidatePath } from "next/cache";

import {
  createVideoEntry,
  deleteVideoEntry,
  getVideoMaintenanceData,
  updateVideoEntry,
  type CreateVideoInput,
  type UpdateVideoInput,
} from "@/components/db/sql/queries-videos";
import { getMemberPageDetails } from "@/features/family/services/family-services";

function unauthorizedMessage() {
  return {
    success: false as const,
    message: "You must be an admin to manage support videos.",
  };
}

export async function getVideoMaintenanceDataAction() {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn || !memberDetails.isAdmin) {
    return unauthorizedMessage();
  }

  return getVideoMaintenanceData();
}

export async function createVideoEntryAction(input: CreateVideoInput) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn || !memberDetails.isAdmin) {
    return unauthorizedMessage();
  }

  const result = await createVideoEntry(input);

  if (result.success) {
    revalidatePath("/add-videos");
  }

  return result;
}

export async function updateVideoEntryAction(input: UpdateVideoInput) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn || !memberDetails.isAdmin) {
    return unauthorizedMessage();
  }

  const result = await updateVideoEntry(input);

  if (result.success) {
    revalidatePath("/add-videos");
  }

  return result;
}

export async function deleteVideoEntryAction(videoId: number) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn || !memberDetails.isAdmin) {
    return unauthorizedMessage();
  }

  const result = await deleteVideoEntry(videoId);

  if (result.success) {
    revalidatePath("/add-videos");
  }

  return result;
}