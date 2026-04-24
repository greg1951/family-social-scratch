import { redirect } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getMemberPageDetails } from "@/features/family/services/family-services";
import {
  getFeaturePostsActivity,
  getMemberPostsActivity,
  getThreadAndGameActivityFamilySummary,
  type FeaturePostsRawRow,
  type MemberPostsRawRow,
} from "@/components/db/sql/queries-family-activity";
import FeaturePostsChart, {
  type FeaturePostsChartData,
} from "@/components/charts/family/feature-posts-chart";
import MemberPostsChart, {
  type MemberPostsChartData,
} from "@/components/charts/family/member-posts-chart";
import ThreadGameChart, {
  type ThreadGameChartData,
} from "@/components/charts/family/thread-game-chart";

const FEATURE_POST_NAMES = [
  "TV Junkies",
  "Movie Maniacs",
  "Family Foodies",
  "Poetry Cafe",
  "Book Besties",
] as const;

function buildFeaturePostsData(rows: FeaturePostsRawRow[]): FeaturePostsChartData {
  return FEATURE_POST_NAMES.map((feature) => {
    const featureRows = rows.filter((r) => r.featureName === feature);
    return {
      feature,
      POST_CREATED: featureRows.find((r) => r.actionType === "POST_CREATED")?.count ?? 0,
      COMMENT_CREATED: featureRows.find((r) => r.actionType === "COMMENT_CREATED")?.count ?? 0,
      LIKE_ADDED: featureRows.find((r) => r.actionType === "LIKE_ADDED")?.count ?? 0,
      LOVE_ADDED: featureRows.find((r) => r.actionType === "LOVE_ADDED")?.count ?? 0,
    };
  });
}

function buildMemberPostsData(rows: MemberPostsRawRow[]): MemberPostsChartData {
  const memberNames = [...new Set(rows.map((r) => `${ r.firstName } ${ r.lastName }`))];
  return memberNames.map((memberName) => {
    const memberRows = rows.filter((r) => `${ r.firstName } ${ r.lastName }` === memberName);
    return {
      member: memberName,
      POST_CREATED: memberRows.find((r) => r.actionType === "POST_CREATED")?.count ?? 0,
      COMMENT_CREATED: memberRows.find((r) => r.actionType === "COMMENT_CREATED")?.count ?? 0,
      LIKE_ADDED: memberRows.find((r) => r.actionType === "LIKE_ADDED")?.count ?? 0,
      LOVE_ADDED: memberRows.find((r) => r.actionType === "LOVE_ADDED")?.count ?? 0,
    };
  });
}

function buildThreadGameData(rows: { actionType: string; count: number }[]): ThreadGameChartData {
  return [
    {
      member: "Family Activity",
      THREAD_CREATED: rows.find((r) => r.actionType === "THREAD_CREATED")?.count ?? 0,
      GAME_STARTED: rows.find((r) => r.actionType === "GAME_STARTED")?.count ?? 0,
    },
  ];
}

function toDateTimeLocalValue(date: Date): string {
  const timezoneOffsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - timezoneOffsetMs).toISOString().slice(0, 16);
}

function parseDate(value: string | undefined, fallback: Date): Date {
  if (!value) {
    return fallback;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return fallback;
  }

  return parsed;
}

export default async function FamilyMemberDashboard({
  searchParams,
}: {
  searchParams: Promise<{ startDate?: string; endDate?: string }>;
}) {
  const memberKeyDetails = await getMemberPageDetails();
  if (!memberKeyDetails.isLoggedIn) {
    redirect("/");
  }

  const now = new Date();
  const defaultStartDate = new Date(now.getTime() - (14 * 24 * 60 * 60 * 1000));
  const params = await searchParams;
  const startDate = parseDate(params.startDate, defaultStartDate);
  const endDate = parseDate(params.endDate, now);
  const startDateValue = toDateTimeLocalValue(startDate);
  const endDateValue = toDateTimeLocalValue(endDate);

  const familyId = memberKeyDetails.familyId;
  const dateRange = { startDate, endDate };

  const [featurePostsRaw, memberPostsRaw, threadGameRaw] = await Promise.all([
    getFeaturePostsActivity(familyId, dateRange),
    getMemberPostsActivity(familyId, dateRange),
    getThreadAndGameActivityFamilySummary(familyId, dateRange),
  ]);

  const featurePostsData = buildFeaturePostsData(featurePostsRaw);
  const memberPostsData = buildMemberPostsData(memberPostsRaw);
  const threadGameData = buildThreadGameData(threadGameRaw);

  return (
    <div className="font-app min-h-screen bg-[radial-gradient(circle_at_top,#ffffff_0%,#f5fbff_34%,#dff6ff_100%)] text-[#10364a]">
      <div className="absolute inset-x-0 top-0 h-72 bg-[linear-gradient(180deg,rgba(89,205,247,0.28),rgba(255,255,255,0))]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-10 pt-4 sm:px-6 lg:px-8">
        <header className="mb-4">
          <Link
            href="/"
            className="inline-flex items-center rounded-xl border border-[#d8eef7] bg-white/75 px-3 py-2 text-sm font-semibold text-[#10364a] transition hover:-translate-y-0.5 hover:bg-[#dff6ff]"
          >
            Back to Main Page
          </Link>
        </header>
        <Card className="p-3">
          <form method="get" className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <div className="space-y-1">
              <label htmlFor="startDate" className="text-xs font-semibold uppercase tracking-wide text-[#2f7a95]">Start Date</label>
              <Input id="startDate" name="startDate" type="datetime-local" defaultValue={ startDateValue } />
            </div>
            <div className="space-y-1">
              <label htmlFor="endDate" className="text-xs font-semibold uppercase tracking-wide text-[#2f7a95]">End Date</label>
              <Input id="endDate" name="endDate" type="datetime-local" defaultValue={ endDateValue } />
            </div>
            <Button type="submit" className="md:w-auto">Apply Range</Button>
          </form>
        </Card>
        <div className="grid w-full grid-cols-1 gap-4 p-4 md:grid-cols-3">
          <Card className="p-3">
            <div className="pt-5">
              <FeaturePostsChart data={ featurePostsData } />
            </div>
          </Card>
          <Card className="p-3">
            <div className="pt-5">
              <MemberPostsChart data={ memberPostsData } />
            </div>
          </Card>
          <Card className="p-3">
            <div className="pt-5">
              <ThreadGameChart data={ threadGameData } />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}