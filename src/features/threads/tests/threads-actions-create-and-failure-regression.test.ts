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

describe("Thread action create/failure regression", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getMemberPageDetailsMock.mockResolvedValue({
      isLoggedIn: true,
      familyId: 41,
      memberId: 5,
      isFounder: false,
    });
  });

  it("passes create payload and member context to query layer", async () => {
    createThreadConversationWithInitialPostMock.mockResolvedValue({
      success: true,
      conversationId: 700,
      message: "Thread sent successfully.",
    });

    const input = {
      title: "Concert Plan",
      subject: "Seats",
      visibility: "private" as const,
      recipientMemberIds: [6, 7],
      content: "Buy tickets",
      contentJson: "{}",
      attachments: [
        {
          attachmentType: "image",
          s3ObjectKey: "threads/img-1.jpg",
        },
      ],
    };

    await createThreadConversationAction(input);

    expect(createThreadConversationWithInitialPostMock).toHaveBeenCalledWith(input, {
      familyId: 41,
      senderMemberId: 5,
      isFounder: false,
    });
  });

  it("returns create failure message and does not revalidate", async () => {
    createThreadConversationWithInitialPostMock.mockResolvedValue({
      success: false,
      message: "Select at least one recipient for a private thread.",
    });

    const result = await createThreadConversationAction({
      title: "Concert Plan",
      visibility: "private",
      recipientMemberIds: [],
      content: "Buy tickets",
      contentJson: "{}",
    });

    expect(result).toEqual({
      success: false,
      message: "Select at least one recipient for a private thread.",
    });
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("returns archive query failure and skips revalidation", async () => {
    archiveAllReadConversationsForRecipientMock.mockResolvedValue({
      success: false,
      message: "No read threads were available to archive.",
    });

    const result = await archiveReadThreadsAction();

    expect(result).toEqual({
      success: false,
      message: "No read threads were available to archive.",
    });
    expect(archiveAllReadConversationsForRecipientMock).toHaveBeenCalledWith(5);
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("returns reply failure and skips revalidation", async () => {
    addThreadReplyMock.mockResolvedValue({
      success: false,
      message: "Replies can only be added to active threads.",
    });

    const result = await addThreadReplyAction({
      conversationId: 22,
      content: "hello",
      contentJson: "{}",
    });

    expect(result).toEqual({
      success: false,
      message: "Replies can only be added to active threads.",
    });
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("returns archive-state failure and skips revalidation", async () => {
    updateRecipientThreadArchiveStateMock.mockResolvedValue({
      success: false,
      message: "Only recipients can archive or unarchive this thread.",
    });

    const result = await updateThreadArchiveStateAction({
      conversationId: 22,
      shouldArchive: true,
    });

    expect(result).toEqual({
      success: false,
      message: "Only recipients can archive or unarchive this thread.",
    });
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("returns read-state failure and skips revalidation", async () => {
    updateRecipientThreadReadStateMock.mockResolvedValue({
      success: false,
      message: "Only recipients can change read status on this thread.",
    });

    const result = await updateThreadReadStateAction({
      conversationId: 22,
      shouldMarkUnread: true,
    });

    expect(result).toEqual({
      success: false,
      message: "Only recipients can change read status on this thread.",
    });
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });
});
