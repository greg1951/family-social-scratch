import { describe, expect, it, vi, beforeEach } from "vitest";

const {
  getThreadTemplatesMock,
  createThreadConversationWithInitialPostMock,
} = vi.hoisted(() => ({
  getThreadTemplatesMock: vi.fn(),
  createThreadConversationWithInitialPostMock: vi.fn(),
}));

vi.mock("@/components/db/sql/queries-thread-templates", () => ({
  getThreadTemplates: getThreadTemplatesMock,
}));

vi.mock("@/components/db/sql/queries-thread-convos", () => ({
  createThreadConversationWithInitialPost: createThreadConversationWithInitialPostMock,
}));

vi.mock("@/components/db/sql/queries-family-invite", () => ({
  updateFamilyInviteStatus: vi.fn(),
}));

vi.mock("@/components/db/sql/queries-family-notifications", () => ({
  insertMemberNotifications: vi.fn(),
}));

vi.mock("@/components/db/sql/queries-family-user", () => ({
  insertMember: vi.fn(),
  insertUser: vi.fn(),
}));

vi.mock("@/components/emails/send-signin-email", () => ({
  sendLoginInstructionsEmail: vi.fn(),
}));

vi.mock("@/components/db/sql/queries-family-activity", () => ({
  createFamilyActivityRecord: vi.fn(),
  FAMILY_ACTIVITY_ACTION_TYPES: {
    MEMBER_JOINED: "MEMBER_JOINED",
  },
}));

import { notifyFounderOfNewMemberRegistration } from "./actions";

describe("notifyFounderOfNewMemberRegistration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses the global New Member Registration template and substitutes variables", async () => {
    getThreadTemplatesMock.mockResolvedValue({
      success: true,
      templates: [
        {
          id: 1,
          templateName: "New Member Registration",
          templateCategory: "global",
          templateJson: JSON.stringify({
            type: "doc",
            content: [
              {
                type: "paragraph",
                content: [
                  { type: "text", text: "!!member-first!! joined !!family-name!!" },
                ],
              },
              {
                type: "paragraph",
                content: [
                  { type: "text", text: "Founder: !!family-founder-first!!" },
                ],
              },
            ],
          }),
          seqNo: 1,
          status: "active",
          updatedAt: new Date(),
        },
      ],
    });

    createThreadConversationWithInitialPostMock.mockResolvedValue({
      success: true,
      conversationId: 99,
      message: "Thread created.",
    });

    const result = await notifyFounderOfNewMemberRegistration({
      founderDetails: {
        memberId: 12,
        familyId: 44,
        familyName: "Rivera Family",
        firstName: "Taylor",
        lastName: "Founder",
        email: "founder@example.com",
      },
      newMemberId: 77,
      newMemberFirstName: "Jordan",
      newMemberLastName: "Lee",
      newMemberEmail: "jordan@example.com",
    });

    expect(result.error).toBe(false);
    expect(createThreadConversationWithInitialPostMock).toHaveBeenCalledWith(
      {
        title: "New Member Registration",
        subject: "New family member registered",
        visibility: "private",
        recipientMemberIds: [12],
        content: "Jordan joined Rivera Family Founder: Taylor",
        contentJson: JSON.stringify({
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [
                { type: "text", text: "Jordan joined Rivera Family" },
              ],
            },
            {
              type: "paragraph",
              content: [
                { type: "text", text: "Founder: Taylor" },
              ],
            },
          ],
        }),
      },
      {
        familyId: 44,
        senderMemberId: 77,
        isFounder: false,
      },
    );
  });
});
