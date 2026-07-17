import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  dbMock,
  state,
  logDbQueryErrorMock,
} = vi.hoisted(() => {
  const sharedState = {
    dbSelectQueue: [] as unknown[],
    dbInsertCalls: [] as Array<{ values: unknown }>,
    dbUpdateCalls: [] as Array<{ values: unknown }>,
    throwOnDbSelect: null as Error | null,
  };

  function createSelectBuilder(response: unknown) {
    return {
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue(response),
      then(onFulfilled: (value: unknown) => unknown, onRejected?: (reason: unknown) => unknown) {
        return Promise.resolve(response).then(onFulfilled, onRejected);
      },
    };
  }

  function createInsertBuilder() {
    return {
      values: vi.fn((values: unknown) => {
        sharedState.dbInsertCalls.push({ values });
        return {
          onConflictDoNothing: vi.fn().mockResolvedValue(undefined),
        };
      }),
    };
  }

  function createUpdateBuilder() {
    return {
      set: vi.fn((values: unknown) => {
        sharedState.dbUpdateCalls.push({ values });
        return {
          where: vi.fn().mockResolvedValue(undefined),
        };
      }),
    };
  }

  const db = {
    select: vi.fn(() => {
      if (sharedState.throwOnDbSelect) {
        throw sharedState.throwOnDbSelect;
      }

      return createSelectBuilder(sharedState.dbSelectQueue.shift());
    }),
    insert: vi.fn(() => createInsertBuilder()),
    update: vi.fn(() => createUpdateBuilder()),
  };

  return {
    dbMock: db,
    state: sharedState,
    logDbQueryErrorMock: vi.fn(),
  };
});

vi.mock("@/components/db/drizzle", () => ({
  default: dbMock,
}));

vi.mock("@/components/db/sql/db-error-logger", () => ({
  logDbQueryError: logDbQueryErrorMock,
}));

import {
  applyGuidedTourProgressCommand,
  resolveGuidedTourLaunch,
} from "@/components/db/sql/queries-guided-runtime";

function seedEligibleNewMemberTour() {
  state.dbSelectQueue.push(
    [{ isSelected: true }],
    [
      {
        id: 1,
        tourKey: "new_member",
        tourName: "Getting Started",
        versionMajor: 1,
        versionMinor: 0,
        versionPatch: 0,
      },
    ],
    [
      {
        id: 101,
        stepNo: 1,
        stepKey: "member_welcome",
        targetSelector: "welcome-card",
        targetSelectorPath: null,
        snippetTitle: "Welcome",
        snippetBody: "Tour intro",
        placement: "centered",
        routePattern: "controlled",
      },
      {
        id: 102,
        stepNo: 2,
        stepKey: "member_start",
        targetSelector: "#main-profile-icon",
        targetSelectorPath: null,
        snippetTitle: "Profile",
        snippetBody: "Update your profile",
        placement: "left",
        routePattern: "controlled",
      },
    ]
  );
}

describe("queries-guided-runtime", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.dbSelectQueue.length = 0;
    state.dbInsertCalls.length = 0;
    state.dbUpdateCalls.length = 0;
    state.throwOnDbSelect = null;
  });

  it("does not launch for founders", async () => {
    const result = await resolveGuidedTourLaunch({
      memberId: 3,
      familyId: 28,
      isFounder: true,
      tourKey: "new_member",
      audienceType: "member",
    });

    expect(result).toEqual({
      success: true,
      launch: false,
      reason: "Founder account is not eligible for this tour.",
    });
    expect(dbMock.select).not.toHaveBeenCalled();
  });

  it("does not launch when Tour Guide option is disabled", async () => {
    state.dbSelectQueue.push([]);

    const result = await resolveGuidedTourLaunch({
      memberId: 3,
      familyId: 28,
      isFounder: false,
      tourKey: "new_member",
      audienceType: "member",
    });

    expect(result).toEqual({
      success: true,
      launch: false,
      reason: "Tour Guide option is disabled.",
    });
    expect(state.dbInsertCalls).toHaveLength(0);
  });

  it("launches and resumes at the first unfinished step", async () => {
    seedEligibleNewMemberTour();
    state.dbSelectQueue.push(
      [
        {
          id: 700,
          status: "not_started",
          currentStepNo: 1,
          startedAt: null,
          neverShowAgain: false,
        },
      ],
      [
        {
          stepId: 101,
          stepNo: 1,
          stepKey: "member_welcome",
          targetSelector: "welcome-card",
          targetSelectorPath: null,
          snippetTitle: "Welcome",
          snippetBody: "Tour intro",
          placement: "centered",
          routePattern: "controlled",
          status: "completed",
        },
        {
          stepId: 102,
          stepNo: 2,
          stepKey: "member_start",
          targetSelector: "#main-profile-icon",
          targetSelectorPath: "src/features/main/components/main-page.tsx",
          snippetTitle: "Profile",
          snippetBody: "Update your profile",
          placement: "left",
          routePattern: "controlled",
          status: "not_started",
        },
      ]
    );

    const result = await resolveGuidedTourLaunch({
      memberId: 3,
      familyId: 28,
      isFounder: false,
      tourKey: "new_member",
      audienceType: "member",
    });

    expect(result.success).toBe(true);
    expect(result.launch).toBe(true);
    if (result.success && result.launch) {
      expect(result.payload.currentStepNo).toBe(2);
      expect(result.payload.steps).toHaveLength(1);
      expect(result.payload.steps[0]?.target).toBe("#main-profile-icon");
    }

    expect(state.dbInsertCalls).toHaveLength(3);
    expect(state.dbUpdateCalls).toEqual(
      expect.arrayContaining([
        {
          values: expect.objectContaining({
            status: "in_progress",
            currentStepNo: 2,
          }),
        },
      ])
    );
  });

  it("does not launch when all steps are already finished", async () => {
    seedEligibleNewMemberTour();
    state.dbSelectQueue.push(
      [
        {
          id: 700,
          status: "in_progress",
          currentStepNo: 2,
          startedAt: new Date(),
          neverShowAgain: false,
        },
      ],
      [
        {
          stepId: 101,
          stepNo: 1,
          stepKey: "member_welcome",
          targetSelector: "welcome-card",
          targetSelectorPath: null,
          snippetTitle: "Welcome",
          snippetBody: "Tour intro",
          placement: "centered",
          routePattern: "controlled",
          status: "completed",
        },
        {
          stepId: 102,
          stepNo: 2,
          stepKey: "member_start",
          targetSelector: "#main-profile-icon",
          targetSelectorPath: null,
          snippetTitle: "Profile",
          snippetBody: "Update your profile",
          placement: "left",
          routePattern: "controlled",
          status: "skipped",
        },
      ]
    );

    const result = await resolveGuidedTourLaunch({
      memberId: 3,
      familyId: 28,
      isFounder: false,
      tourKey: "new_member",
      audienceType: "member",
    });

    expect(result).toEqual({
      success: true,
      launch: false,
      reason: "Tour already completed.",
    });
    expect(state.dbUpdateCalls).toEqual(
      expect.arrayContaining([
        {
          values: expect.objectContaining({
            status: "completed",
            currentStepNo: 2,
          }),
        },
      ])
    );
  });

  it("updates step progress and advances to the next remaining step", async () => {
    state.dbSelectQueue.push(
      [
        {
          id: 700,
          status: "in_progress",
          currentStepNo: 2,
        },
      ],
      [{ stepNo: 3 }]
    );

    const result = await applyGuidedTourProgressCommand({
      memberId: 3,
      familyId: 28,
      memberTourProgressId: 700,
      command: "complete_step",
      stepNo: 2,
    });

    expect(result).toEqual({
      success: true,
      message: "Step progress updated.",
    });

    expect(state.dbUpdateCalls).toEqual(
      expect.arrayContaining([
        {
          values: expect.objectContaining({ status: "completed" }),
        },
        {
          values: expect.objectContaining({
            status: "in_progress",
            currentStepNo: 3,
          }),
        },
      ])
    );
  });

  it("marks tour complete when the final step is completed", async () => {
    state.dbSelectQueue.push(
      [
        {
          id: 700,
          status: "in_progress",
          currentStepNo: 2,
        },
      ],
      []
    );

    const result = await applyGuidedTourProgressCommand({
      memberId: 3,
      familyId: 28,
      memberTourProgressId: 700,
      command: "complete_step",
      stepNo: 2,
    });

    expect(result).toEqual({
      success: true,
      message: "Tour marked complete.",
    });

    expect(state.dbUpdateCalls).toEqual(
      expect.arrayContaining([
        {
          values: expect.objectContaining({
            status: "completed",
            currentStepNo: 2,
          }),
        },
      ])
    );
  });

  it("logs and returns a safe error payload when launch resolution throws", async () => {
    state.throwOnDbSelect = new Error("db unavailable");

    const result = await resolveGuidedTourLaunch({
      memberId: 3,
      familyId: 28,
      isFounder: false,
      tourKey: "new_member",
      audienceType: "member",
    });

    expect(result).toEqual({
      success: false,
      message: "Unable to resolve guided tour launch state.",
    });
    expect(logDbQueryErrorMock).toHaveBeenCalledWith(
      "guided.resolveGuidedTourLaunch",
      expect.any(Error),
      expect.objectContaining({ memberId: 3, familyId: 28, tourKey: "new_member" })
    );
  });
});
