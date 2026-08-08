import { describe, expect, it } from "vitest";

import { normalizeYouTubeUrl } from "./youtube-url";

describe("normalizeYouTubeUrl", () => {
  it("accepts standard and shortened HTTPS YouTube URLs", () => {
    expect(normalizeYouTubeUrl("https://www.youtube.com/watch?v=uBvJ3D8Pydg"))
      .toBe("https://www.youtube.com/watch?v=uBvJ3D8Pydg");
    expect(normalizeYouTubeUrl("youtu.be/uBvJ3D8Pydg"))
      .toBe("https://youtu.be/uBvJ3D8Pydg");
  });

  it("rejects insecure and non-YouTube URLs", () => {
    expect(normalizeYouTubeUrl("http://youtube.com/watch?v=uBvJ3D8Pydg")).toBeNull();
    expect(normalizeYouTubeUrl("https://example.com/watch?v=uBvJ3D8Pydg")).toBeNull();
    expect(normalizeYouTubeUrl("https://youtube.com.example.com/watch?v=uBvJ3D8Pydg")).toBeNull();
  });

  it("treats an empty value as no video", () => {
    expect(normalizeYouTubeUrl("   ")).toBeNull();
  });
});