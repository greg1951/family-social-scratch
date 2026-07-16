import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/api/api-error-logger", () => ({
  logApiRouteError: vi.fn(),
}));

vi.mock("@/features/family/services/family-services", () => ({
  getMemberPageDetails: vi.fn(),
}));

vi.mock("@/lib/s3-client-factory", () => ({
  getS3ClientForFamily: vi.fn(),
}));

vi.mock("@/lib/s3-object-key", () => ({
  extractS3KeyFromValue: vi.fn(),
}));

import { logApiRouteError } from "@/components/api/api-error-logger";
import { getMemberPageDetails } from "@/features/family/services/family-services";
import { getS3ClientForFamily } from "@/lib/s3-client-factory";
import { extractS3KeyFromValue } from "@/lib/s3-object-key";
import { GET } from "@/app/api/s3-upload/router";

describe("s3-upload API Sentry logging", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("captures failed stream errors through the API error logger", async () => {
    vi.mocked(getMemberPageDetails).mockResolvedValue({
      isLoggedIn: true,
      familyId: 28,
      memberId: 4,
    });

    vi.mocked(extractS3KeyFromValue).mockReturnValue("members/avatar.png");

    const send = vi.fn().mockRejectedValue(new Error("download failed"));
    vi.mocked(getS3ClientForFamily).mockResolvedValue({
      client: { send },
      bucketName: "family-bucket",
      region: "us-east-1",
    });

    const response = await GET(new Request("http://localhost/api/s3-upload?key=members/avatar.png"));
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload).toEqual({ error: "Failed to load image" });
    expect(logApiRouteError).toHaveBeenCalledTimes(1);
    expect(logApiRouteError).toHaveBeenCalledWith(
      "api.s3-upload.GET.streamObject",
      expect.any(Error),
      expect.objectContaining({
        requestId: expect.any(String),
        familyId: 28,
        objectKey: "members/avatar.png",
        route: "s3-upload",
      })
    );
  });
});
