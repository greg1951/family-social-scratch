import { vi } from "vitest";

import { createTemplateTestDb, runTemplateAccessContract } from "./template-access.test-contract";

const { dbMock, state } = vi.hoisted(() => {
  const selectQueue: unknown[] = [];

  function createSelectBuilder(response: unknown) {
    const builder = {
      from: vi.fn(),
      where: vi.fn(),
      orderBy: vi.fn().mockResolvedValue(response),
      then(onFulfilled: (value: unknown) => unknown, onRejected?: (reason: unknown) => unknown) {
        return Promise.resolve(response).then(onFulfilled, onRejected);
      },
    };
    builder.from.mockReturnValue(builder);
    builder.where.mockReturnValue(builder);
    return builder;
  }

  return {
    state: { selectQueue },
    dbMock: {
      select: vi.fn(() => createSelectBuilder(selectQueue.shift() ?? [])),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  };
});

vi.mock("@/components/db/drizzle", () => ({ default: dbMock }));
vi.mock("./queries-family-activity", () => ({
  createFamilyActivityRecord: vi.fn(),
  createFamilyReactionActivityRecord: vi.fn(),
  FAMILY_ACTIVITY_ACTION_TYPES: {},
}));
vi.mock("./db-error-logger", () => ({ logDbQueryError: vi.fn() }));

import {
  deleteFoodiesTemplate,
  getFoodiesTemplateManagementData,
  saveFoodiesRecipe,
  saveFoodiesTemplate,
} from "./queries-foodies";

void createTemplateTestDb;

runTemplateAccessContract({
  featureName: "Kitchen",
  dbMock,
  state,
  getManagementData: getFoodiesTemplateManagementData,
  saveTemplate: saveFoodiesTemplate,
  deleteTemplate: deleteFoodiesTemplate,
  attemptForgedDraftSelection: async () => {
    state.selectQueue.push(
      [],
      [{
        id: 900,
        templateName: "Other member draft",
        status: "draft",
        isGlobalTemplate: false,
        templateJson: JSON.stringify({ type: "doc", content: [] }),
        memberId: 88,
        familyId: 10,
      }]
    );

    return saveFoodiesRecipe({
      recipeTitle: "Private template attempt",
      recipeShortSummary: "Should fail",
      prepTimeMins: 5,
      cookTimeMins: 10,
      status: "draft",
      recipeJson: JSON.stringify({ type: "doc", content: [] }),
      templateId: 900,
      selectedTagIds: [],
    }, { familyId: 10, memberId: 77 });
  },
});
