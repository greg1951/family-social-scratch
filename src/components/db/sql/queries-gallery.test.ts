import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  dbMock,
  logDbQueryErrorMock,
} = vi.hoisted(() => ({
  dbMock: {
    select: vi.fn(),
    delete: vi.fn(),
  },
  logDbQueryErrorMock: vi.fn(),
}));

vi.mock("@/components/db/drizzle", () => ({
  default: dbMock,
}));

vi.mock("./db-error-logger", () => ({
  logDbQueryError: logDbQueryErrorMock,
}));

vi.mock("./queries-family-activity", () => ({
  createFamilyActivityRecord: vi.fn(),
  createFamilyReactionActivityRecord: vi.fn(),
  FAMILY_ACTIVITY_ACTION_TYPES: {},
}));

import { deleteGalleryPhoto } from "./queries-gallery";

describe("deleteGalleryPhoto", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("removes a member photo when it is not associated with an album", async () => {
    const whereSpy = vi
      .fn()
      .mockResolvedValueOnce([{ id: 42 }])
      .mockResolvedValueOnce([]);
    const fromSpy = vi.fn().mockReturnValue({ where: whereSpy });
    const selectBuilder = { from: fromSpy };
    const deleteBuilder = { where: whereSpy };

    dbMock.select.mockReturnValue(selectBuilder);
    dbMock.delete.mockReturnValue(deleteBuilder);

    const result = await deleteGalleryPhoto(42, { memberId: 7, familyId: 3 });

    expect(result).toEqual({ success: true, removedCount: 1 });
    expect(dbMock.select).toHaveBeenCalledTimes(2);
    expect(dbMock.delete).toHaveBeenCalledTimes(1);
    expect(whereSpy).toHaveBeenCalledTimes(3);
    expect(logDbQueryErrorMock).not.toHaveBeenCalled();
  });
});
