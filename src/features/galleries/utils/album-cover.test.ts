import { describe, expect, it } from "vitest";
import { pickAlbumCoverPhotoUrl } from "./album-cover";

describe("pickAlbumCoverPhotoUrl", () => {
  it("returns the first selected photo image when creating an album", () => {
    const selectedPhotoIds = [12, 34, 56];
    const photos = [
      {
        id: 12,
        caption: "First",
        photoYear: 2022,
        photoImageUrl: "https://example.com/first.jpg",
        photoPosition: "portrait" as const,
        fileName: "first.jpg",
        createdAt: new Date("2024-01-01"),
        isInAlbum: false,
      },
      {
        id: 34,
        caption: "Second",
        photoYear: 2023,
        photoImageUrl: "https://example.com/second.jpg",
        photoPosition: "landscape" as const,
        fileName: "second.jpg",
        createdAt: new Date("2024-01-02"),
        isInAlbum: false,
      },
    ];

    expect(pickAlbumCoverPhotoUrl(selectedPhotoIds, photos)).toBe("https://example.com/first.jpg");
  });

  it("returns null when no selected photos are available", () => {
    expect(pickAlbumCoverPhotoUrl([12], [])).toBeNull();
  });
});
