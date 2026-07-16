import { describe, expect, it } from "vitest";
import * as Sentry from "@sentry/nextjs";

import { reportGlobalError } from "@/app/global-error";

const hasDsn = Boolean(process.env.SENTRY_DSN);
const liveModeEnabled = process.env.SENTRY_LIVE_TEST === "true";
const runLive = hasDsn && liveModeEnabled;
const liveTest = runLive ? it : it.skip;

describe("global error Sentry live ingest", () => {
  liveTest("sends a real event to Sentry without mocks", async () => {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 0,
      environment: process.env.SENTRY_ENVIRONMENT ?? "vitest-live",
    });

    const error = new Error(`[SENTRY_LIVE_TEST] global-error ${ new Date().toISOString() }`);
    const eventId = Sentry.withScope((scope) => {
      scope.setTag("test.kind", "live-ingest");
      scope.setTag("test.path", "global-error");
      scope.setContext("live_test", {
        source: "vitest",
        file: "src/app/global-error.sentry-live.test.ts",
      });

      reportGlobalError(error);
      return Sentry.captureException(error);
    });

    expect(eventId).toEqual(expect.any(String));

    const didFlush = await Sentry.flush(15000);
    expect(didFlush).toBe(true);
  });
});
