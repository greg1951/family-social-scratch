import { describe, expect, it } from "vitest";
import { extractS3KeyFromValue } from "@/lib/s3-object-key";

describe("extractS3KeyFromValue", () => {
  it("returns key for plain key input", () => {
    expect(extractS3KeyFromValue("members/avatar.jpg")).toBe("members/avatar.jpg");
  });

  it("normalizes plain bucket-prefixed key", () => {
    expect(extractS3KeyFromValue("my-bucket/members/avatar.jpg")).toBe("members/avatar.jpg");
  });

  it("returns key for virtual-hosted-style S3 URL", () => {
    const value = "https://my-bucket.s3.us-east-2.amazonaws.com/members/avatar.jpg";
    expect(extractS3KeyFromValue(value)).toBe("members/avatar.jpg");
  });

  it("returns key for path-style S3 URL", () => {
    const value = "https://s3.us-east-2.amazonaws.com/my-bucket/members/avatar.jpg";
    expect(extractS3KeyFromValue(value)).toBe("members/avatar.jpg");
  });

  it("returns key for non-aws custom domain URL when path contains known folder", () => {
    const value = "https://cdn.family-social.app/assets/movies/poster.jpg";
    expect(extractS3KeyFromValue(value)).toBe("movies/poster.jpg");
  });

  it("returns null for non-aws URL without known folder path", () => {
    const value = "https://cdn.family-social.app/assets/poster.jpg";
    expect(extractS3KeyFromValue(value)).toBeNull();
  });

  it("strips query params and hash", () => {
    const value = "https://my-bucket.s3.us-east-2.amazonaws.com/members/avatar.jpg?X-Amz-Signature=abc#test";
    expect(extractS3KeyFromValue(value)).toBe("members/avatar.jpg");
  });

  it("returns key for non-aws URL when path contains known folder", () => {
    expect(extractS3KeyFromValue("https://example.com/members/avatar.jpg")).toBe("members/avatar.jpg");
  });
});
