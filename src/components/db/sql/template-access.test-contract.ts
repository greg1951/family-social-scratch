import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

const VALID_TEMPLATE_JSON = JSON.stringify({ type: "doc", content: [] });

export interface TemplateTestDb {
  select: Mock;
  insert: Mock;
  update: Mock;
  delete: Mock;
}

export interface TemplateTestState {
  selectQueue: unknown[];
}

interface TemplateRecord {
  id: number;
  templateName: string;
  status: string;
  isGlobalTemplate: boolean;
  templateJson: string;
  memberId: number | null;
  familyId: number | null;
  updatedAt: Date;
}

type QueryResult =
  | { success: false; message: string }
  | { success: true; templates: Array<{ id: number }> };

type SaveResult = { success: boolean; message: string };

interface TemplateAccessContractOptions {
  featureName: string;
  dbMock: TemplateTestDb;
  state: TemplateTestState;
  getManagementData: (familyId: number, memberId: number, isAdmin: boolean) => Promise<QueryResult>;
  saveTemplate: (
    input: { id: number; templateName: string; status: string; templateJson: string },
    actor: { familyId: number; memberId: number; isAdmin: boolean }
  ) => Promise<SaveResult>;
  attemptForgedDraftSelection: () => Promise<{ success: boolean; message: string }>;
}

export function createTemplateTestDb() {
  const state: TemplateTestState = { selectQueue: [] };

  function createSelectBuilder(response: unknown) {
    const builder = {
      from: vi.fn(),
      where: vi.fn(),
      orderBy: vi.fn().mockResolvedValue(response),
      limit: vi.fn().mockResolvedValue(response),
      then(onFulfilled: (value: unknown) => unknown, onRejected?: (reason: unknown) => unknown) {
        return Promise.resolve(response).then(onFulfilled, onRejected);
      },
    };
    builder.from.mockReturnValue(builder);
    builder.where.mockReturnValue(builder);
    return builder;
  }

  const dbMock: TemplateTestDb = {
    select: vi.fn(() => createSelectBuilder(state.selectQueue.shift() ?? [])),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };

  return { dbMock, state };
}

function templateRow(overrides: Partial<TemplateRecord>): TemplateRecord {
  return {
    id: 1,
    templateName: "Template",
    status: "published",
    isGlobalTemplate: false,
    templateJson: VALID_TEMPLATE_JSON,
    memberId: 77,
    familyId: 10,
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

export function runTemplateAccessContract(options: TemplateAccessContractOptions) {
  const {
    featureName,
    dbMock,
    state,
    getManagementData,
    saveTemplate,
    attemptForgedDraftSelection,
  } = options;

  async function visibleTemplateIds(row: TemplateRecord) {
    state.selectQueue.push([row]);
    if (!row.isGlobalTemplate && row.memberId === 77 && row.familyId === 10) {
      state.selectQueue.push([{ id: 77, firstName: "Current", lastName: "Member", memberImageUrl: null }]);
    }

    const result = await getManagementData(10, 77, false);
    expect(result.success).toBe(true);
    return result.success ? result.templates.map((template) => template.id) : [];
  }

  describe(`${featureName} template access`, () => {
    beforeEach(() => {
      vi.clearAllMocks();
      state.selectQueue.length = 0;
    });

    it("shows family 1 global templates to other families", async () => {
      await expect(visibleTemplateIds(templateRow({ id: 101, isGlobalTemplate: true, familyId: 1, memberId: 1 })))
        .resolves.toContain(101);
    });

    it("hides global-marked templates outside family 1", async () => {
      await expect(visibleTemplateIds(templateRow({ id: 102, isGlobalTemplate: true, familyId: 9, memberId: 9 })))
        .resolves.not.toContain(102);
    });

    it("shows a member their own custom templates", async () => {
      await expect(visibleTemplateIds(templateRow({ id: 103, memberId: 77, familyId: 10 })))
        .resolves.toContain(103);
    });

    it("hides another member's custom templates in the same family", async () => {
      await expect(visibleTemplateIds(templateRow({ id: 104, memberId: 88, familyId: 10 })))
        .resolves.not.toContain(104);
    });

    it("hides custom templates from another family", async () => {
      await expect(visibleTemplateIds(templateRow({ id: 105, memberId: 77, familyId: 20 })))
        .resolves.not.toContain(105);
    });

    it("rejects another member's draft template when its ID is forged", async () => {
      const result = await attemptForgedDraftSelection();
      expect(result.success).toBe(false);
      expect(dbMock.insert).not.toHaveBeenCalled();
      expect(dbMock.update).not.toHaveBeenCalled();
    });

    it("rejects updates to another member's custom template", async () => {
      state.selectQueue.push([templateRow({ id: 106, memberId: 88, familyId: 10 })]);

      const result = await saveTemplate(
        { id: 106, templateName: "Changed", status: "published", templateJson: VALID_TEMPLATE_JSON },
        { familyId: 10, memberId: 77, isAdmin: false }
      );

      expect(result.success).toBe(false);
      expect(dbMock.update).not.toHaveBeenCalled();
    });

    it("allows only a family 1 administrator to update a global template", async () => {
      const globalTemplate = templateRow({ id: 107, isGlobalTemplate: true, familyId: 1, memberId: 1 });
      const input = { id: 107, templateName: "Changed", status: "published", templateJson: VALID_TEMPLATE_JSON };

      state.selectQueue.push([globalTemplate]);
      await saveTemplate(input, { familyId: 1, memberId: 77, isAdmin: false });
      expect(dbMock.update).not.toHaveBeenCalled();

      state.selectQueue.push([globalTemplate]);
      await saveTemplate(input, { familyId: 10, memberId: 77, isAdmin: true });
      expect(dbMock.update).not.toHaveBeenCalled();

      state.selectQueue.push([globalTemplate], []);
      dbMock.update.mockImplementationOnce(() => {
        throw new Error("authorized-update-reached");
      });
      await saveTemplate(input, { familyId: 1, memberId: 77, isAdmin: true });
      expect(dbMock.update).toHaveBeenCalledTimes(1);
    });
  });
}
