import { beforeEach, describe, expect, it, vi } from "vitest";

import { createSupportIssue } from "@/components/db/sql/queries-support";
import { supportAttachment, supportIssue, supportPersonIssue } from "@/components/db/schema/family-social-schema-tables";
import { createEmptyTipTapDocument, serializeTipTapDocument } from "@/components/db/types/poem-term-validation";

type InsertPlan = {
  valuesError?: Error;
  returningResponse?: unknown;
  resolvedValue?: unknown;
};

const {
  dbMock,
  dbState,
} = vi.hoisted(() => {
  const state = {
    selectResponses: [] as unknown[],
    insertPlans: [] as InsertPlan[],
    insertCalls: [] as Array<{ table: unknown; values: unknown }>,
    deleteCalls: [] as Array<{ table: unknown }>,
    deleteWhereCalls: [] as unknown[],
  };

  function createThenableSelectBuilder(response: unknown) {
    const builder = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue(response),
      orderBy: vi.fn().mockReturnThis(),
      then(onFulfilled: (value: unknown) => unknown, onRejected?: (reason: unknown) => unknown) {
        return Promise.resolve(response).then(onFulfilled, onRejected);
      },
    };

    return builder;
  }

  function createInsertBuilder(table: unknown, plan: InsertPlan) {
    const builder = {
      values: vi.fn((value: unknown) => {
        state.insertCalls.push({ table, values: value });

        if (plan.valuesError) {
          throw plan.valuesError;
        }

        return builder;
      }),
      returning: vi.fn().mockResolvedValue(plan.returningResponse),
      then(onFulfilled: (value: unknown) => unknown, onRejected?: (reason: unknown) => unknown) {
        return Promise.resolve(plan.resolvedValue).then(onFulfilled, onRejected);
      },
    };

    return builder;
  }

  const mockDb = {
    select: vi.fn(() => createThenableSelectBuilder(state.selectResponses.shift())),
    insert: vi.fn((table: unknown) => createInsertBuilder(table, state.insertPlans.shift() ?? {})),
    delete: vi.fn((table: unknown) => ({
      where: vi.fn((value: unknown) => {
        state.deleteCalls.push({ table });
        state.deleteWhereCalls.push(value);
        return Promise.resolve();
      }),
    })),
  };

  return {
    dbMock: mockDb,
    dbState: state,
  };
});

vi.mock("@/components/db/drizzle", () => ({
  default: dbMock,
}));

const validInput = {
  title: "Unable to update profile",
  category: "Technical Issue" as const,
  priority: "Medium" as const,
  descriptionJson: serializeTipTapDocument({
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text: "First paragraph" }],
      },
      {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: "Second item" }],
              },
            ],
          },
        ],
      },
    ],
  }),
  attachment: {
    name: "screenshot.png",
    size: 2048,
    type: "image/png",
    lastModified: 123456,
  },
};

const validContext = {
  memberId: 7,
  familyId: 19,
  familyName: "  Rivera Family  ",
  memberName: "Ana Rivera",
};

describe("createSupportIssue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbState.selectResponses.length = 0;
    dbState.insertPlans.length = 0;
    dbState.insertCalls.length = 0;
    dbState.deleteCalls.length = 0;
    dbState.deleteWhereCalls.length = 0;
  });

  it("returns a family lookup error when no matching support family exists", async () => {
    dbState.selectResponses.push([]);

    const result = await createSupportIssue(validInput, validContext);

    expect(result).toEqual({
      success: false,
      message: "Support family record not found for Rivera Family.",
    });
    expect(dbMock.insert).not.toHaveBeenCalled();
  });

  it("returns an L1 team error when no active L1 team is available", async () => {
    dbState.selectResponses.push([{ id: 5, familyName: "Rivera Family" }], []);

    const result = await createSupportIssue(validInput, validContext);

    expect(result).toEqual({
      success: false,
      message: "No active L1 support team is available to receive this issue.",
    });
    expect(dbMock.insert).not.toHaveBeenCalled();
  });

  it("creates the issue, assigns an L1 support person, and stores attachment metadata", async () => {
    dbState.selectResponses.push(
      [{ id: 5, familyName: "Rivera Family" }],
      [{ id: 2 }],
      [{ id: 9, firstName: "Morgan", lastName: "Lee" }],
    );
    dbState.insertPlans.push(
      { returningResponse: [{ id: 44 }] },
      { resolvedValue: undefined },
      { resolvedValue: undefined },
    );

    const result = await createSupportIssue(validInput, validContext);

    expect(result).toEqual({
      success: true,
      issueId: 44,
      message: "Your issue has been created and will be reviewed by the support team.",
      assignedSupportPersonName: "Morgan Lee",
    });
    expect(dbState.insertCalls).toHaveLength(3);
    expect(dbState.insertCalls[0].table).toBe(supportIssue);
    expect(dbState.insertCalls[1].table).toBe(supportPersonIssue);
    expect(dbState.insertCalls[2].table).toBe(supportAttachment);

    expect(dbState.insertCalls[0].values).toMatchObject({
      issueType: "Technical Issue",
      issueTitle: "Unable to update profile",
      priority: "medium",
      status: "open",
      memberId: 7,
      supportFamilyId: 5,
    });

    const issueJson = JSON.parse((dbState.insertCalls[0].values as { issueJson: string }).issueJson);
    expect(issueJson.descriptionPlainText).toBe("First paragraph Second item");
    expect(issueJson.createdBy).toEqual({
      memberId: 7,
      familyId: 19,
      familyName: "Rivera Family",
      memberName: "Ana Rivera",
    });

    expect(dbState.insertCalls[1].values).toMatchObject({
      supportIssueId: 44,
      supportPersonId: 9,
    });

    const attachmentJson = JSON.parse((dbState.insertCalls[2].values as { attachmentJson: string }).attachmentJson);
    expect(dbState.insertCalls[2].values).toMatchObject({
      attachmentType: "image",
      supportIssueId: 44,
    });
    expect(attachmentJson).toEqual({
      fileName: "screenshot.png",
      mimeType: "image/png",
      fileSizeBytes: 2048,
      lastModified: 123456,
      storageStatus: "pending-support-s3-bucket",
      storageLocation: null,
    });
  });

  it("deletes the created issue if assignment persistence fails", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    dbState.selectResponses.push(
      [{ id: 5, familyName: "Rivera Family" }],
      [{ id: 2 }],
      [{ id: 9, firstName: "Morgan", lastName: "Lee" }],
    );
    dbState.insertPlans.push(
      { returningResponse: [{ id: 44 }] },
      { valuesError: new Error("assignment failed") },
    );

    const result = await createSupportIssue({
      ...validInput,
      attachment: null,
    }, validContext);

    expect(result).toEqual({
      success: false,
      message: "The support issue could not be finalized. Please try again.",
    });
    expect(dbState.deleteCalls).toHaveLength(1);
    expect(dbState.deleteCalls[0].table).toBe(supportIssue);
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it("returns the first validation message for invalid input", async () => {
    const result = await createSupportIssue({
      ...validInput,
      title: "",
      descriptionJson: serializeTipTapDocument(createEmptyTipTapDocument()),
    }, validContext);

    expect(result).toEqual({
      success: false,
      message: "Title is required.",
    });
    expect(dbMock.select).not.toHaveBeenCalled();
  });
});