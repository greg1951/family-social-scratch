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
  | { success: true; templates: Array<{ id: number; canEdit: boolean }> };

type SaveResult = { success: boolean; message: string };

interface TemplateAccessContractOptions {
  featureName: string;
  dbMock: TemplateTestDb;
  state: TemplateTestState;
  getManagementData: (familyId: number, memberId: number, isAdmin: boolean, isFounder?: boolean) => Promise<QueryResult>;
  saveTemplate: (
    input: { id: number; templateName: string; status: string; templateJson: string },
    actor: { familyId: number; memberId: number; isAdmin: boolean; isFounder?: boolean }
  ) => Promise<SaveResult>;
  deleteTemplate: (
    templateId: number,
    actor: { familyId: number; memberId: number; isFounder?: boolean }
  ) => Promise<{ success: boolean; message: string }>;
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
    deleteTemplate,
    attemptForgedDraftSelection,
  } = options;

  async function visibleTemplateIds(row: TemplateRecord) {
    state.selectQueue.push([row]);
    if (!row.isGlobalTemplate && row.familyId === 10) {
      state.selectQueue.push([{ id: row.memberId, firstName: "Family", lastName: "Member", memberImageUrl: null }]);
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

    it("shows another member's custom templates within the same family", async () => {
      await expect(visibleTemplateIds(templateRow({ id: 104, memberId: 88, familyId: 10 })))
        .resolves.toContain(104);
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

    it("marks another member's family template editable for the family founder", async () => {
      state.selectQueue.push([templateRow({ id: 108, memberId: 88, familyId: 10 })]);
      state.selectQueue.push([{ id: 88, firstName: "Other", lastName: "Member", memberImageUrl: null }]);

      const result = await getManagementData(10, 77, false, true);
      expect(result.success).toBe(true);
      const record = result.success ? result.templates.find((template) => template.id === 108) : undefined;
      expect(record?.canEdit).toBe(true);
    });

    it("keeps another member's family template read-only for non-founders", async () => {
      state.selectQueue.push([templateRow({ id: 118, memberId: 88, familyId: 10 })]);
      state.selectQueue.push([{ id: 88, firstName: "Other", lastName: "Member", memberImageUrl: null }]);

      const result = await getManagementData(10, 77, false, false);
      expect(result.success).toBe(true);
      const record = result.success ? result.templates.find((template) => template.id === 118) : undefined;
      expect(record?.canEdit).toBe(false);
    });

    it("allows the family founder to update another member's custom template", async () => {
      state.selectQueue.push([templateRow({ id: 109, memberId: 88, familyId: 10 })], []);
      dbMock.update.mockImplementationOnce(() => {
        throw new Error("authorized-update-reached");
      });

      await saveTemplate(
        { id: 109, templateName: "Changed", status: "published", templateJson: VALID_TEMPLATE_JSON },
        { familyId: 10, memberId: 77, isAdmin: false, isFounder: true }
      );

      expect(dbMock.update).toHaveBeenCalledTimes(1);
    });

    it("rejects updates from a founder of a different family", async () => {
      state.selectQueue.push([templateRow({ id: 111, memberId: 88, familyId: 10 })]);

      const result = await saveTemplate(
        { id: 111, templateName: "Changed", status: "published", templateJson: VALID_TEMPLATE_JSON },
        { familyId: 20, memberId: 99, isAdmin: false, isFounder: true }
      );

      expect(result.success).toBe(false);
      expect(dbMock.update).not.toHaveBeenCalled();
    });

    function mockDeleteChains() {
      dbMock.update.mockReturnValue({
        set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }),
      } as never);
      dbMock.delete.mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) } as never);
    }

    it("allows the owner to delete their own custom template", async () => {
      mockDeleteChains();
      state.selectQueue.push([templateRow({ id: 112, memberId: 77, familyId: 10 })]);

      const result = await deleteTemplate(112, { familyId: 10, memberId: 77 });

      expect(result.success).toBe(true);
      expect(dbMock.delete).toHaveBeenCalledTimes(1);
    });

    it("allows the family founder to delete another member's custom template", async () => {
      mockDeleteChains();
      state.selectQueue.push([templateRow({ id: 113, memberId: 88, familyId: 10 })]);

      const result = await deleteTemplate(113, { familyId: 10, memberId: 77, isFounder: true });

      expect(result.success).toBe(true);
      expect(dbMock.delete).toHaveBeenCalledTimes(1);
    });

    it("rejects deletes from a non-owner non-founder member", async () => {
      mockDeleteChains();
      state.selectQueue.push([templateRow({ id: 114, memberId: 88, familyId: 10 })]);

      const result = await deleteTemplate(114, { familyId: 10, memberId: 77, isFounder: false });

      expect(result.success).toBe(false);
      expect(dbMock.delete).not.toHaveBeenCalled();
    });

    it("rejects deleting a global template", async () => {
      mockDeleteChains();
      state.selectQueue.push([templateRow({ id: 115, isGlobalTemplate: true, familyId: 1, memberId: 1 })]);

      const result = await deleteTemplate(115, { familyId: 1, memberId: 1, isFounder: true });

      expect(result.success).toBe(false);
      expect(dbMock.delete).not.toHaveBeenCalled();
    });
  });
}
