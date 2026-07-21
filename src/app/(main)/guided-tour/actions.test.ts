import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getMemberPageDetailsMock,
  resolveGuidedTourLaunchMock,
  applyGuidedTourProgressCommandMock,
} = vi.hoisted(() => ({
  getMemberPageDetailsMock: vi.fn(),
  resolveGuidedTourLaunchMock: vi.fn(),
  applyGuidedTourProgressCommandMock: vi.fn(),
}));

vi.mock("@/features/family/services/family-services", () => ({
  getMemberPageDetails: getMemberPageDetailsMock,
}));

vi.mock("@/components/db/sql/queries-guided-runtime", () => ({
  resolveGuidedTourLaunch: resolveGuidedTourLaunchMock,
  applyGuidedTourProgressCommand: applyGuidedTourProgressCommandMock,
}));

import {
  applyGuidedTourProgressCommandAction,
  getGuidedTourLaunchPlanAction,
  getNewMemberTourLaunchPlanAction,
} from "@/app/(main)/guided-tour/actions";

describe("guided tour actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns no-launch plan when member is not logged in", async () => {
    getMemberPageDetailsMock.mockResolvedValue({
      isLoggedIn: false,
    });

    const result = await getNewMemberTourLaunchPlanAction();

    expect(result).toEqual({
      success: true,
      launch: false,
      reason: "Member is not logged in.",
    });
    expect(resolveGuidedTourLaunchMock).not.toHaveBeenCalled();
  });

  it("forwards resolved member context to launch resolver", async () => {
    getMemberPageDetailsMock.mockResolvedValue({
      isLoggedIn: true,
      memberId: 42,
      familyId: 7,
      isFounder: false,
    });

    resolveGuidedTourLaunchMock.mockResolvedValue({
      success: true,
      launch: false,
      reason: "No active tour.",
    });

    await getNewMemberTourLaunchPlanAction();

    expect(resolveGuidedTourLaunchMock).toHaveBeenCalledWith({
      memberId: 42,
      familyId: 7,
      isFounder: false,
      audienceType: "member",
      tourKey: "new_member",
    });
  });

  it("forwards the requested tour key to the generic launch resolver", async () => {
    getMemberPageDetailsMock.mockResolvedValue({
      isLoggedIn: true,
      memberId: 42,
      familyId: 7,
      isFounder: false,
    });

    resolveGuidedTourLaunchMock.mockResolvedValue({
      success: true,
      launch: false,
      reason: "No active tour.",
    });

    await getGuidedTourLaunchPlanAction("movie_tour");

    expect(resolveGuidedTourLaunchMock).toHaveBeenCalledWith({
      memberId: 42,
      familyId: 7,
      isFounder: false,
      audienceType: "member",
      tourKey: "movie_tour",
    });
  });

  it("returns auth error for progress command when member is not logged in", async () => {
    getMemberPageDetailsMock.mockResolvedValue({
      isLoggedIn: false,
    });

    const result = await applyGuidedTourProgressCommandAction({
      progressId: 9,
      command: "start_tour",
    });

    expect(result).toEqual({
      success: false,
      message: "You must be logged in to update tour progress.",
    });
    expect(applyGuidedTourProgressCommandMock).not.toHaveBeenCalled();
  });

  it("forwards input and member context to progress command handler", async () => {
    getMemberPageDetailsMock.mockResolvedValue({
      isLoggedIn: true,
      memberId: 42,
      familyId: 7,
    });

    applyGuidedTourProgressCommandMock.mockResolvedValue({
      success: true,
      completed: false,
    });

    await applyGuidedTourProgressCommandAction({
      progressId: 9,
      command: "complete_step",
      stepNo: 2,
    });

    expect(applyGuidedTourProgressCommandMock).toHaveBeenCalledWith({
      progressId: 9,
      command: "complete_step",
      stepNo: 2,
      memberId: 42,
      familyId: 7,
    });
  });
});
