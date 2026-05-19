import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  revalidatePathMock,
  getMemberPageDetailsMock,
  softRetireFamilyMemberMock,
  hardDeleteFamilyMemberMock,
  deleteUserByMemberIdMock,
  updateFamilyInviteStatusByEmailMock,
  deleteInviteByEmailMock,
  deleteOrphanThreadConversationsForFamilyMock,
} = vi.hoisted(() => ({
  revalidatePathMock: vi.fn(),
  getMemberPageDetailsMock: vi.fn(),
  softRetireFamilyMemberMock: vi.fn(),
  hardDeleteFamilyMemberMock: vi.fn(),
  deleteUserByMemberIdMock: vi.fn(),
  updateFamilyInviteStatusByEmailMock: vi.fn(),
  deleteInviteByEmailMock: vi.fn(),
  deleteOrphanThreadConversationsForFamilyMock: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock("@/features/family/services/family-services", () => ({
  getMemberPageDetails: getMemberPageDetailsMock,
}));

vi.mock("@/components/db/sql/queries-family-member", () => ({
  deleteMember: vi.fn(),
  findMemberIdByEmail: vi.fn(),
  hardDeleteFamilyMember: hardDeleteFamilyMemberMock,
  softRetireFamilyMember: softRetireFamilyMemberMock,
}));

vi.mock("@/components/db/sql/queries-user", () => ({
  deleteUserByMemberId: deleteUserByMemberIdMock,
  deleteUserByUserId: vi.fn(),
  getUserByEmail: vi.fn(),
}));

vi.mock("@/components/db/sql/queries-family-invite", () => ({
  deleteInvite: vi.fn(),
  updateFamilyInviteStatus: vi.fn(),
  getInvitebyInviteId: vi.fn(),
  deleteInviteByEmail: deleteInviteByEmailMock,
  updateFamilyInviteStatusByEmail: updateFamilyInviteStatusByEmailMock,
}));

vi.mock("@/components/db/sql/queries-thread-convos", () => ({
  deleteOrphanThreadConversationsForFamily: deleteOrphanThreadConversationsForFamilyMock,
}));

import { removeFamilyMemberAction } from "@/app/(family)/(family-members)/family-current-members/actions";

describe("removeFamilyMemberAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks non-founder callers", async () => {
    getMemberPageDetailsMock.mockResolvedValue({
      isLoggedIn: true,
      isFounder: false,
      familyId: 11,
      memberId: 99,
    });

    const result = await removeFamilyMemberAction({
      targetMemberId: 42,
      deleteType: "soft",
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain("family founder");
  });

  it("soft deletes by retiring member and removing user access", async () => {
    getMemberPageDetailsMock.mockResolvedValue({
      isLoggedIn: true,
      isFounder: true,
      familyId: 7,
      memberId: 1,
    });

    softRetireFamilyMemberMock.mockResolvedValue({
      success: true,
      memberId: 42,
      email: "member@example.com",
    });

    deleteUserByMemberIdMock.mockResolvedValue({ error: false });
    updateFamilyInviteStatusByEmailMock.mockResolvedValue({ success: true });

    const result = await removeFamilyMemberAction({
      targetMemberId: 42,
      deleteType: "soft",
    });

    expect(result.success).toBe(true);
    expect(softRetireFamilyMemberMock).toHaveBeenCalledWith(42, 7);
    expect(deleteUserByMemberIdMock).toHaveBeenCalledWith(42);
    expect(updateFamilyInviteStatusByEmailMock).toHaveBeenCalledWith(7, "member@example.com", "retired");
    expect(revalidatePathMock).toHaveBeenCalledWith("/family-founder-account");
  });

  it("hard deletes member then cleans orphan threads", async () => {
    getMemberPageDetailsMock.mockResolvedValue({
      isLoggedIn: true,
      isFounder: true,
      familyId: 7,
      memberId: 1,
    });

    hardDeleteFamilyMemberMock.mockResolvedValue({
      success: true,
      memberId: 44,
      email: "gone@example.com",
    });

    deleteUserByMemberIdMock.mockResolvedValue({ error: false });
    deleteInviteByEmailMock.mockResolvedValue({ success: true });
    deleteOrphanThreadConversationsForFamilyMock.mockResolvedValue({
      success: true,
      deletedConversationCount: 2,
    });

    const result = await removeFamilyMemberAction({
      targetMemberId: 44,
      deleteType: "hard",
    });

    expect(result.success).toBe(true);
    expect(deleteUserByMemberIdMock.mock.invocationCallOrder[0]).toBeLessThan(
      hardDeleteFamilyMemberMock.mock.invocationCallOrder[0],
    );
    expect(hardDeleteFamilyMemberMock).toHaveBeenCalledWith(44, 7);
    expect(deleteUserByMemberIdMock).toHaveBeenCalledWith(44);
    expect(deleteInviteByEmailMock).toHaveBeenCalledWith(7, "gone@example.com");
    expect(deleteOrphanThreadConversationsForFamilyMock).toHaveBeenCalledWith(7);
    expect(result.message).toContain("orphan thread");
  });
});
