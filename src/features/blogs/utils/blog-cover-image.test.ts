import { describe, expect, it } from "vitest";

import { resolveBlogCoverImageState } from "@/features/blogs/utils/blog-cover-image";

describe("resolveBlogCoverImageState", () => {
  it("uses the title as the default alt text when a cover image is present", () => {
    const result = resolveBlogCoverImageState({
      coverImageS3Key: "blogs/cover.jpg",
      coverImageAlt: "",
      title: "Summer picnic",
    });

    expect(result.altText).toBe("Summer picnic");
    expect(result.error).toBeNull();
  });

  it("returns an error when a cover image is present but there is no alt text or title", () => {
    const result = resolveBlogCoverImageState({
      coverImageS3Key: "blogs/cover.jpg",
      coverImageAlt: "",
      title: "   ",
    });

    expect(result.altText).toBe("");
    expect(result.error).toBe("Cover image alt text is required when a cover image is selected.");
  });

  it("preserves an explicit alt text", () => {
    const result = resolveBlogCoverImageState({
      coverImageS3Key: "blogs/cover.jpg",
      coverImageAlt: "A cozy table setting",
      title: "Weekend brunch",
    });

    expect(result.altText).toBe("A cozy table setting");
    expect(result.error).toBeNull();
  });
});
