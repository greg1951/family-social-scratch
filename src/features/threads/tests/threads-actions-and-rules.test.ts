import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  revalidatePathMock,
  getMemberPageDetailsMock,
  addThreadReplyMock,
  updateRecipientThreadArchiveStateMock,
  updateRecipientThreadReadStateMock,
} = vi.hoisted(() => ({
  revalidatePathMock: vi.fn(),
  getMemberPageDetailsMock: vi.fn(),
  addThreadReplyMock: vi.fn(),
  updateRecipientThreadArchiveStateMock: vi.fn(),
  updateRecipientThreadReadStateMock: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock("@/features/family/services/family-services", () => ({
  getMemberPageDetails: getMemberPageDetailsMock,
}));

vi.mock("@/components/db/sql/queries-thread-convos", async () => {
  const actual = await vi.importActual<typeof import("@/components/db/sql/queries-thread-convos")>(
    "@/components/db/sql/queries-thread-convos",
  );

  return {
    ...actual,
    addThreadReply: addThreadReplyMock,
    updateRecipientThreadArchiveState: updateRecipientThreadArchiveStateMock,
    updateRecipientThreadReadState: updateRecipientThreadReadStateMock,
  };
});

import {
  addThreadReplyAction,
  updateThreadArchiveStateAction,
  updateThreadReadStateAction,
} from "@/app/(features)/(threads)/threads/actions";
import { canMemberAccessThreadConversation } from "@/components/db/sql/queries-thread-convos";

describe("Thread conversation access rules", () => {
  it("allows sender access to private conversations", async () => {
    const result = await canMemberAccessThreadConversation({
      senderMemberId: 12,
      memberId: 12,
      visibility: "private",
      recipientStateId: null,
    });

    expect(result).toBe(true);
  });

  it("blocks non-recipient access to private conversations", async () => {
    const result = await canMemberAccessThreadConversation({
      senderMemberId: 12,
      memberId: 44,
      visibility: "private",
      recipientStateId: null,
    });

    expect(result).toBe(false);
  });

  it("allows recipient access to private conversations", async () => {
    const result = await canMemberAccessThreadConversation({
      senderMemberId: 12,
      memberId: 44,
      visibility: "private",
      recipientStateId: 99,
    });

    expect(result).toBe(true);
  });

  it("allows public conversation access", async () => {
    const result = await canMemberAccessThreadConversation({
      senderMemberId: 12,
      memberId: 44,
      visibility: "public",
      recipientStateId: null,
    });

    expect(result).toBe(true);
  });
});

describe("Thread actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("adds reply and revalidates thread pages", async () => {
    getMemberPageDetailsMock.mockResolvedValue({
      isLoggedIn: true,
      familyId: 1,
      memberId: 77,
    });

    addThreadReplyMock.mockResolvedValue({
      success: true,
      postId: 321,
      message: "Reply posted.",
    });

    const result = await addThreadReplyAction({
      conversationId: 88,
      content: "Reply text",
      contentJson: "{}",
    });

    expect(result.success).toBe(true);
    expect(addThreadReplyMock).toHaveBeenCalledWith(
      {
        conversationId: 88,
        content: "Reply text",
        contentJson: "{}",
      },
      {
        familyId: 1,
        memberId: 77,
      },
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/threads");
    expect(revalidatePathMock).toHaveBeenCalledWith("/threads/88");
  });

  it("updates archive state for recipients and revalidates", async () => {
    getMemberPageDetailsMock.mockResolvedValue({
      isLoggedIn: true,
      memberId: 77,
    });

    updateRecipientThreadArchiveStateMock.mockResolvedValue({
      success: true,
      message: "Thread archived.",
    });

    const result = await updateThreadArchiveStateAction({
      conversationId: 88,
      shouldArchive: true,
    });

    expect(result.success).toBe(true);
    expect(updateRecipientThreadArchiveStateMock).toHaveBeenCalledWith(88, 77, true);
    expect(revalidatePathMock).toHaveBeenCalledWith("/threads");
    expect(revalidatePathMock).toHaveBeenCalledWith("/threads/88");
  });

  it("updates read state for recipients and revalidates", async () => {
    getMemberPageDetailsMock.mockResolvedValue({
      isLoggedIn: true,
      memberId: 77,
    });

    updateRecipientThreadReadStateMock.mockResolvedValue({
      success: true,
      message: "Marked as unread.",
    });

    const result = await updateThreadReadStateAction({
      conversationId: 88,
      shouldMarkUnread: true,
    });

    expect(result.success).toBe(true);
    expect(updateRecipientThreadReadStateMock).toHaveBeenCalledWith(88, 77, true);
    expect(revalidatePathMock).toHaveBeenCalledWith("/threads");
    expect(revalidatePathMock).toHaveBeenCalledWith("/threads/88");
  });
});
