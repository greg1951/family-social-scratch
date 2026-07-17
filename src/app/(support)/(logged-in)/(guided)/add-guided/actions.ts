"use server";

import { revalidatePath } from "next/cache";

import {
  createGuidedTourReference,
  createGuidedTourStepReference,
  deleteGuidedTourReference,
  deleteGuidedTourStepReference,
  getGuidedTourMaintenanceData,
  updateGuidedTourReference,
  updateGuidedTourStepReference,
  type CreateGuidedTourInput,
  type CreateGuidedTourStepInput,
  type UpdateGuidedTourInput,
  type UpdateGuidedTourStepInput,
} from "@/components/db/sql/queries-guided";
import { getMemberPageDetails } from "@/features/family/services/family-services";

function unauthorizedMessage() {
  return {
    success: false as const,
    message: "You must be an admin to manage guided tour references.",
  };
}

export async function getGuidedTourMaintenanceDataAction() {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn || !memberDetails.isAdmin) {
    return unauthorizedMessage();
  }

  return getGuidedTourMaintenanceData();
}

export async function createGuidedTourReferenceAction(input: CreateGuidedTourInput) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn || !memberDetails.isAdmin) {
    return unauthorizedMessage();
  }

  const result = await createGuidedTourReference(input);

  if (result.success) {
    revalidatePath("/add-guided");
  }

  return result;
}

export async function updateGuidedTourReferenceAction(input: UpdateGuidedTourInput) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn || !memberDetails.isAdmin) {
    return unauthorizedMessage();
  }

  const result = await updateGuidedTourReference(input);

  if (result.success) {
    revalidatePath("/add-guided");
  }

  return result;
}

export async function deleteGuidedTourReferenceAction(tourId: number) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn || !memberDetails.isAdmin) {
    return unauthorizedMessage();
  }

  const result = await deleteGuidedTourReference(tourId);

  if (result.success) {
    revalidatePath("/add-guided");
  }

  return result;
}

export async function createGuidedTourStepReferenceAction(input: CreateGuidedTourStepInput) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn || !memberDetails.isAdmin) {
    return unauthorizedMessage();
  }

  const result = await createGuidedTourStepReference(input);

  if (result.success) {
    revalidatePath("/add-guided");
  }

  return result;
}

export async function updateGuidedTourStepReferenceAction(input: UpdateGuidedTourStepInput) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn || !memberDetails.isAdmin) {
    return unauthorizedMessage();
  }

  const result = await updateGuidedTourStepReference(input);

  if (result.success) {
    revalidatePath("/add-guided");
  }

  return result;
}

export async function deleteGuidedTourStepReferenceAction(stepId: number) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn || !memberDetails.isAdmin) {
    return unauthorizedMessage();
  }

  const result = await deleteGuidedTourStepReference(stepId);

  if (result.success) {
    revalidatePath("/add-guided");
  }

  return result;
}
