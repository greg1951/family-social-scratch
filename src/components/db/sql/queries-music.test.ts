import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  dbMock,
  createFamilyActivityRecordMock,
  createFamilyReactionActivityRecordMock,
  logDbQueryErrorMock,
} = vi.hoisted(() => ({
  dbMock: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  createFamilyActivityRecordMock: vi.fn(),
  createFamilyReactionActivityRecordMock: vi.fn(),
  logDbQueryErrorMock: vi.fn(),
}));

vi.mock("@/components/db/drizzle", () => ({
  default: dbMock,
}));

vi.mock("./queries-family-activity", () => ({
  createFamilyActivityRecord: createFamilyActivityRecordMock,
  createFamilyReactionActivityRecord: createFamilyReactionActivityRecordMock,
  FAMILY_ACTIVITY_ACTION_TYPES: {
    POST_CREATED: "POST_CREATED",
  },
}));

vi.mock("./db-error-logger", () => ({
  logDbQueryError: logDbQueryErrorMock,
}));

import { saveMusic } from "./queries-music";

describe("saveMusic playlist behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires at least one playlist media URL for playlist music type", async () => {
    const result = await saveMusic(
      {
        musicTitle: "Weekend Discovery",
        artistName: "",
        musicJson: "{}",
        status: "published",
        musicType: "playlist",
        musicDebutYear: 2026,
        selectedTagIds: [],
        playlistMedia: [],
      },
      {
        familyId: 10,
        memberId: 77,
      },
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.message).toContain("At least one playlist media entry is required");
    }
    expect(dbMock.insert).not.toHaveBeenCalled();
  });

  it("persists playlist media entries when saving a playlist post", async () => {
    const deleteWhereMock = vi.fn().mockResolvedValue(undefined);
    dbMock.delete.mockReturnValue({ where: deleteWhereMock });

    const insertMusicValuesMock = vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([
        {
          id: 501,
          musicTitle: "Road Trip Mix",
          artistName: "",
          musicJson: "{}",
          status: "published",
          musicType: "playlist",
          musicImageUrl: null,
          musicDebutYear: 2026,
          updatedAt: new Date(),
          memberId: 77,
          familyId: 10,
        },
      ]),
    });

    const insertPlaylistMediaValuesMock = vi.fn().mockResolvedValue(undefined);
    const insertReviewerCommentValuesMock = vi
      .fn()
      .mockRejectedValue(new Error("stop-after-playlist-media"));

    dbMock.insert
      .mockReturnValueOnce({ values: insertMusicValuesMock })
      .mockReturnValueOnce({ values: insertPlaylistMediaValuesMock })
      .mockReturnValueOnce({ values: insertReviewerCommentValuesMock });

    const result = await saveMusic(
      {
        musicTitle: "Road Trip Mix",
        artistName: "",
        musicJson: "{}",
        status: "published",
        musicType: "playlist",
        musicDebutYear: 2026,
        selectedTagIds: [],
        playlistMedia: [
          {
            mediaSource: "spotify",
            mediaType: "song",
            mediaUrl: "https://open.spotify.com/track/abc123",
            mediaArtist: "Aster Lake",
            mediaCaption: "Sunset highway song",
          },
        ],
      },
      {
        familyId: 10,
        memberId: 77,
      },
    );

    expect(insertPlaylistMediaValuesMock).toHaveBeenCalledTimes(1);
    expect(insertPlaylistMediaValuesMock).toHaveBeenCalledWith([
      {
        mediaSource: "spotify",
        mediaSeqNo: 1,
        mediaType: "song",
        mediaUrl: "https://open.spotify.com/track/abc123",
        mediaArtist: "Aster Lake",
        mediaCaption: "Sunset highway song",
        musicId: 501,
      },
    ]);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.message).toContain("stop-after-playlist-media");
    }
  });
});
