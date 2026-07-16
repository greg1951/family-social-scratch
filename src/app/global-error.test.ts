import { describe, expect, it, vi } from "vitest";

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
}));

import * as Sentry from "@sentry/nextjs";
import { reportGlobalError } from "@/app/global-error";

describe("global error Sentry reporting", () => {
  it("captures global errors with Sentry", () => {
    const error = new Error("global boundary failure");

    reportGlobalError(error);

    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    expect(Sentry.captureException).toHaveBeenCalledWith(error);
  });
});
