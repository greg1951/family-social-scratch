import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const { useEditorMock, routerRefreshMock } = vi.hoisted(() => ({
  useEditorMock: vi.fn(),
  routerRefreshMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: routerRefreshMock,
  }),
}));

vi.mock("@/app/(features)/(threads)/threads/actions", () => ({
  addThreadReplyAction: vi.fn(),
  updateThreadReplyAction: vi.fn(),
  updateThreadArchiveStateAction: vi.fn(),
  updateThreadReadStateAction: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@tiptap/react", () => ({
  useEditor: useEditorMock,
  EditorContent: () => null,
}));

import { ThreadConversationDetailPage } from "@/features/threads/components/thread-conversation-detail-page";

function hasTaskListAndTaskItemExtensions(extensions: unknown): boolean {
  if (!Array.isArray(extensions)) {
    return false;
  }

  const names = extensions
    .map((extension) => (extension && typeof extension === "object" ? (extension as { name?: string }).name : undefined))
    .filter((name): name is string => typeof name === "string");

  return names.includes("taskList") && names.includes("taskItem");
}

describe("Thread conversation detail UI regression", () => {
  beforeEach(() => {
    useEditorMock.mockReset();
    routerRefreshMock.mockReset();

    useEditorMock.mockImplementation(() => ({
      commands: {
        setContent: vi.fn(),
      },
    }));
  });

  it("wires task-list template content and extensions into the detail view editors", () => {
    const contentJson = JSON.stringify({
      type: "doc",
      content: [
        {
          type: "taskList",
          content: [
            {
              type: "taskItem",
              attrs: { checked: false },
              content: [
                {
                  type: "paragraph",
                  content: [
                    {
                      type: "text",
                      text: "Please remove me from the family account.",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    renderToStaticMarkup(
      <ThreadConversationDetailPage
        currentMemberId={ 17 }
        conversation={ {
          id: 1001,
          title: "Leave the Family Notice",
          subject: null,
          visibility: "private",
          status: "active",
          createdAt: new Date(),
          senderMemberId: 17,
          recipientStateId: 201,
          readAt: null,
          archivedAt: null,
          posts: [
            {
              id: 5001,
              conversationId: 1001,
              authorMemberId: 17,
              authorFirstName: "Alex",
              authorLastName: "Sender",
              type: "post",
              content: "Please remove me from the family account.",
              contentJson,
              seqNo: 1,
              createdAt: new Date(),
              attachments: [],
            },
          ],
        } }
      />,
    );

    const editorConfigs = useEditorMock.mock.calls.map((call) => call[0]);
    const editorConfigsWithTaskExtensions = editorConfigs.filter((config) =>
      hasTaskListAndTaskItemExtensions((config as { extensions?: unknown }).extensions),
    );

    expect(editorConfigsWithTaskExtensions.length).toBeGreaterThanOrEqual(3);

    const viewerConfig = editorConfigs.find((config) => (config as { editable?: boolean }).editable === false) as
      | { content?: unknown; extensions?: unknown }
      | undefined;

    expect(viewerConfig).toBeDefined();
    expect(hasTaskListAndTaskItemExtensions(viewerConfig?.extensions)).toBe(true);

    const viewerContent = viewerConfig?.content as {
      type?: string;
      content?: Array<{ type?: string; content?: Array<{ type?: string; content?: Array<{ text?: string }> }> }>;
    };

    expect(viewerContent.type).toBe("doc");
    expect(viewerContent.content?.[0]?.type).toBe("taskList");
    expect(viewerContent.content?.[0]?.content?.[0]?.type).toBe("taskItem");
    expect(viewerContent.content?.[0]?.content?.[0]?.content?.[0]?.content?.[0]?.text).toContain("remove me");
  });
});
