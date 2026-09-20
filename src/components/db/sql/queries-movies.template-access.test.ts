import { vi } from "vitest";

import { runTemplateAccessContract } from "./template-access.test-contract";

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

import { deleteMovieTemplate, getMovieTemplateManagementData, saveMovie, saveMovieTemplate } from "./queries-movies";

runTemplateAccessContract({
  featureName: "Movies",
  dbMock,
  state,
  getManagementData: getMovieTemplateManagementData,
  saveTemplate: saveMovieTemplate,
  deleteTemplate: deleteMovieTemplate,
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

    return saveMovie({
      movieTitle: "Private template attempt",
      movieImageCredit: "",
      movieJson: "",
      status: "draft",
      movieDebutYear: 2026,
      templateId: 900,
      selectedTagIds: [],
    }, { familyId: 10, memberId: 77 });
  },
});
