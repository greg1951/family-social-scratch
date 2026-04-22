import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  revalidatePathMock,
  getMemberPageDetailsMock,
  archiveAllReadConversationsForRecipientMock,
  createThreadConversationWithInitialPostMock,
  addThreadReplyMock,
  updateRecipientThreadArchiveStateMock,
  updateRecipientThreadReadStateMock,
} = vi.hoisted(() => ({
  revalidatePathMock: vi.fn(),
  getMemberPageDetailsMock: vi.fn(),
  archiveAllReadConversationsForRecipientMock: vi.fn(),
  createThreadConversationWithInitialPostMock: vi.fn(),
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

vi.mock("@/components/db/sql/queries-thread-convos", () => ({
  archiveAllReadConversationsForRecipient: archiveAllReadConversationsForRecipientMock,
  createThreadConversationWithInitialPost: createThreadConversationWithInitialPostMock,
  addThreadReply: addThreadReplyMock,
  updateRecipientThreadArchiveState: updateRecipientThreadArchiveStateMock,
  updateRecipientThreadReadState: updateRecipientThreadReadStateMock,
}));

import {
  addThreadReplyAction,
  archiveReadThreadsAction,
  createThreadConversationAction,
  updateThreadArchiveStateAction,
  updateThreadReadStateAction,
} from "@/app/(features)/(threads)/threads/actions";

describe("Thread action revalidation behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getMemberPageDetailsMock.mockResolvedValue({
      isLoggedIn: true,
      familyId: 8,
      memberId: 33,
      isFounder: true,
    });
  });

  it("revalidates only threads route when archive all read succeeds", async () => {
    archiveAllReadConversationsForRecipientMock.mockResolvedValue({
      success: true,
      archivedCount: 2,
      message: "Archived 2 read threads.",
    });

    const result = await archiveReadThreadsAction();

    expect(result.success).toBe(true);
    expect(revalidatePathMock).toHaveBeenCalledTimes(1);
    expect(revalidatePathMock).toHaveBeenCalledWith("/threads");
  });

  it("does not revalidate when archive all read fails", async () => {
    archiveAllReadConversationsForRecipientMock.mockResolvedValue({
      success: false,
      message: "Failure",
    });

    const result = await archiveReadThreadsAction();

    expect(result.success).toBe(false);
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("revalidates list and compose routes when create thread succeeds", async () => {
    createThreadConversationWithInitialPostMock.mockResolvedValue({
      success: true,
      conversationId: 90,
      message: "Thread sent successfully.",
    });

    const result = await createThreadConversationAction({
      title: "Trip",
      visibility: "private",
      recipientMemberIds: [44],
      content: "Let us plan",
      contentJson: "{}",
    });

    expect(result.success).toBe(true);
    expect(revalidatePathMock).toHaveBeenCalledWith("/threads");
    expect(revalidatePathMock).toHaveBeenCalledWith("/threads/compose");
  });

  it("does not revalidate when reply fails", async () => {
    addThreadReplyMock.mockResolvedValue({
      success: false,
      message: "Unable to save your reply.",
    });

    const result = await addThreadReplyAction({
      conversationId: 52,
      content: "Reply",
      contentJson: "{}",
    });

    expect(result.success).toBe(false);
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("revalidates list and detail routes for recipient archive update success", async () => {
    updateRecipientThreadArchiveStateMock.mockResolvedValue({
      success: true,
      message: "Thread archived.",
    });

    const result = await updateThreadArchiveStateAction({
      conversationId: 76,
      shouldArchive: true,
    });

    expect(result.success).toBe(true);
    expect(revalidatePathMock).toHaveBeenCalledWith("/threads");
    expect(revalidatePathMock).toHaveBeenCalledWith("/threads/76");
  });

  it("does not revalidate when recipient read update fails", async () => {
    updateRecipientThreadReadStateMock.mockResolvedValue({
      success: false,
      message: "Only recipients can change read status on this thread.",
    });

    const result = await updateThreadReadStateAction({
      conversationId: 19,
      shouldMarkUnread: true,
    });

    expect(result.success).toBe(false);
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });
});
