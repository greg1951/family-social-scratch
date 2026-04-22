import { describe, expect, it, vi, beforeEach } from "vitest";

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

describe("Thread action auth guards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getMemberPageDetailsMock.mockResolvedValue({
      isLoggedIn: false,
    });
  });

  it("rejects archive when not logged in", async () => {
    const result = await archiveReadThreadsAction();

    expect(result).toEqual({
      success: false,
      message: "You must be signed in to archive threads.",
    });
    expect(archiveAllReadConversationsForRecipientMock).not.toHaveBeenCalled();
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("rejects create thread when not logged in", async () => {
    const result = await createThreadConversationAction({
      title: "Hi",
      visibility: "private",
      recipientMemberIds: [2],
      content: "Body",
      contentJson: "{}",
    });

    expect(result).toEqual({
      success: false,
      message: "You must be signed in to create a thread.",
    });
    expect(createThreadConversationWithInitialPostMock).not.toHaveBeenCalled();
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("rejects reply when not logged in", async () => {
    const result = await addThreadReplyAction({
      conversationId: 10,
      content: "Reply",
      contentJson: "{}",
    });

    expect(result).toEqual({
      success: false,
      message: "You must be signed in to reply.",
    });
    expect(addThreadReplyMock).not.toHaveBeenCalled();
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("rejects archive state updates when not logged in", async () => {
    const result = await updateThreadArchiveStateAction({
      conversationId: 10,
      shouldArchive: true,
    });

    expect(result).toEqual({
      success: false,
      message: "You must be signed in to update archive state.",
    });
    expect(updateRecipientThreadArchiveStateMock).not.toHaveBeenCalled();
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("rejects read state updates when not logged in", async () => {
    const result = await updateThreadReadStateAction({
      conversationId: 10,
      shouldMarkUnread: true,
    });

    expect(result).toEqual({
      success: false,
      message: "You must be signed in to update read status.",
    });
    expect(updateRecipientThreadReadStateMock).not.toHaveBeenCalled();
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });
});
