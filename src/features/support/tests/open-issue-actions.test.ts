import { beforeEach, describe, expect, it, vi } from "vitest";

import { createEmptyTipTapDocument, serializeTipTapDocument } from "@/components/db/types/poem-term-validation";

const {
  revalidatePathMock,
  getMemberPageDetailsMock,
  createSupportIssueMock,
} = vi.hoisted(() => ({
  revalidatePathMock: vi.fn(),
  getMemberPageDetailsMock: vi.fn(),
  createSupportIssueMock: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock("@/features/family/services/family-services", () => ({
  getMemberPageDetails: getMemberPageDetailsMock,
}));

vi.mock("@/components/db/sql/queries-support", () => ({
  createSupportIssue: createSupportIssueMock,
}));

import { createSupportIssueAction } from "@/app/(support)/(logged-in)/open-issue/actions";

const validInput = {
  title: "Cannot save support ticket",
  category: "Technical Issue" as const,
  priority: "High" as const,
  descriptionJson: serializeTipTapDocument(createEmptyTipTapDocument()),
  attachment: null,
};

describe("Open issue action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getMemberPageDetailsMock.mockResolvedValue({
      isLoggedIn: true,
      memberId: 41,
      familyId: 12,
      familyName: "Rivera Family",
      firstName: "Ana",
      lastName: "Rivera",
    });
  });

  it("rejects submission when the member is not signed in", async () => {
    getMemberPageDetailsMock.mockResolvedValue({
      isLoggedIn: false,
    });

    const result = await createSupportIssueAction(validInput);

    expect(result).toEqual({
      success: false,
      message: "You must be signed in to submit a support issue.",
    });
    expect(createSupportIssueMock).not.toHaveBeenCalled();
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("passes input and member context to the query layer", async () => {
    createSupportIssueMock.mockResolvedValue({
      success: true,
      issueId: 88,
      message: "Your issue has been created and will be reviewed by the support team.",
      assignedSupportPersonName: "Morgan Lee",
    });

    const result = await createSupportIssueAction(validInput);

    expect(result.success).toBe(true);
    expect(createSupportIssueMock).toHaveBeenCalledWith(validInput, {
      memberId: 41,
      familyId: 12,
      familyName: "Rivera Family",
      memberName: "Ana Rivera",
    });
    expect(revalidatePathMock).toHaveBeenCalledTimes(1);
    expect(revalidatePathMock).toHaveBeenCalledWith("/open-issue");
  });

  it("returns query failures without revalidating", async () => {
    createSupportIssueMock.mockResolvedValue({
      success: false,
      message: "Support family record not found for Rivera Family.",
    });

    const result = await createSupportIssueAction(validInput);

    expect(result).toEqual({
      success: false,
      message: "Support family record not found for Rivera Family.",
    });
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });
});