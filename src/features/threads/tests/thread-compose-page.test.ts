import { describe, expect, it } from "vitest";

import { getThreadAttachmentSizeWarning } from "@/features/threads/utils/thread-attachment-size";

describe("getThreadAttachmentSizeWarning", () => {
  it("returns null for files at or below the preferred size threshold", () => {
    expect(getThreadAttachmentSizeWarning({
      name: "small-photo.jpg",
      size: 5 * 1024 * 1024,
    })).toBeNull();
  });

  it("warns for files larger than 5MB and smaller than 8MB", () => {
    expect(getThreadAttachmentSizeWarning({
      name: "camera-photo.jpg",
      size: 6 * 1024 * 1024,
    })).toBe("camera-photo.jpg is 6.0 MB. Smaller images are preferred when possible.");
  });

  it("returns null for files at or above the hard cap", () => {
    expect(getThreadAttachmentSizeWarning({
      name: "too-large-photo.jpg",
      size: 8 * 1024 * 1024,
    })).toBeNull();
  });
});