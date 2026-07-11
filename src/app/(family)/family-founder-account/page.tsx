import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAllFamilyMembers } from "@/components/db/sql/queries-family-member";
import { getMemberNotifications } from "@/components/db/sql/queries-family-notifications";
import { getMemberPageDetails } from "@/features/family/services/family-services";
import { CurrentFamilyMember, FounderDetails } from "@/features/family/types/family-members";
import FounderAccountTabs from "./founder-tabs";
import { toast } from "sonner";
import { getFounderDetails } from "@/features/family/services/get-founder-details";
import FounderFaqHelp from "@/components/common/founder-faq-help";
import { getFamilyFeatureConfig } from "@/components/db/sql/queries-family-features";
import { getMemberDashboardActivitySummary, type MemberDashboardActivitySummary } from "@/components/db/sql/queries-family-activity";

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

export default async function FamilyMyAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; startDate?: string; endDate?: string }>;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const memberKeyDetails = await getMemberPageDetails();
  if (memberKeyDetails.isLoggedIn === false || memberKeyDetails.isFounder === false) {
    console.warn('Unauthorized access attempt to family founder account page. Redirecting to home page.');
    redirect("/");
  }

  const now = new Date();
  const params = await searchParams;
  const endDate = parseDate(params.endDate, now);
  const defaultStartDate = new Date(endDate);
  defaultStartDate.setMonth(defaultStartDate.getMonth() - 3);
  const startDate = parseDate(params.startDate, defaultStartDate);
  const startDateValue = toDateTimeLocalValue(startDate);
  const endDateValue = toDateTimeLocalValue(endDate);
  const activeTab = params.tab ?? "profile";

  const memberActivitySummary: MemberDashboardActivitySummary = await getMemberDashboardActivitySummary(
    memberKeyDetails.familyId,
    memberKeyDetails.memberId,
    { startDate, endDate },
  );

  const [
    memberNotificationsResult,
    featureConfigResult,
    currentMembersResult,
  ] = await Promise.all([
    activeTab === "notifications"
      ? getMemberNotifications(memberKeyDetails.memberId)
      : Promise.resolve({ success: true as const, memberId: memberKeyDetails.memberId, notifications: [] }),
    getFamilyFeatureConfig(memberKeyDetails.familyId),
    getAllFamilyMembers(memberKeyDetails.familyId),
  ]);


  const notifications = memberNotificationsResult.success
    ? memberNotificationsResult.notifications
    : [];

  const featureConfig = featureConfigResult.success
    ? {
      familyStatus: featureConfigResult.familyStatus,
      features: featureConfigResult.features,
    }
    : {
      familyStatus: "active",
      features: [],
    };

  let currentFamilyMembers: CurrentFamilyMember[] = [];


  const founderDetailsResult = await getFounderDetails(memberKeyDetails.familyId);
  let founderDetails: FounderDetails | null = null;
  if (founderDetailsResult.success && founderDetailsResult.founderDetails) {
    founderDetails = founderDetailsResult.founderDetails;
  } else {
    console.error(`Error fetching founder details for familyId ${ memberKeyDetails.familyId }`);
    toast.error('Error fetching family founder details. Please try again later.');
    redirect("/");
  }

  if (currentMembersResult.success && currentMembersResult.members) {
    currentFamilyMembers = currentMembersResult.members
      .filter((member) => member.memberId !== founderDetails.memberId && member.email !== founderDetails.email)
      .map((member) => ({
        id: member.id,
        memberId: member.memberId ?? null,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        status: member.status,
        memberStatus: member.memberStatus ?? null,
        birthday: member.birthday,
        cellPhone: member.cellPhone,
        inviteFounderMessage: member.inviteFounderMessage,
        memberImageUrl: member.memberImageUrl ?? null,
      })) as CurrentFamilyMember[];
  }

  return (
    <main className="font-app min-h-[90vh] max-w-screen bg-linear-to-b from-white to-slate-50 px-4 py-2 sm:px-6 md:px-8">
      <div className="mx-auto w-full max-w-4xl">
        <Card className="w-full overflow-hidden border-white/70 bg-white/82 pt-0 shadow-[0_28px_90px_-50px_rgba(16,54,74,0.75)] backdrop-blur">
          <CardHeader className="rounded-[1.35rem] bg-[linear-gradient(135deg,#59cdf7_0%,#9de4fe_45%,#fff2d8_100%)] px-6 pb-5 pt-5 shadow-[inset_0_-1px_0_rgba(255,255,255,0.45)]">
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
              <div>
                <CardTitle className="text-2xl font-extrabold tracking-[0.02em] text-[#10364a] md:text-[2rem]">
                  My Family Account
                </CardTitle>
                <CardDescription className="mt-2 max-w-2xl text-sm leading-6 text-[#315363]">
                  <span className="inline-flex items-center gap-2 text-sm text-[#5f7987]">
                    <span>Manage the <b>{ memberKeyDetails.familyName }</b> family settings here</span>
                    <FounderFaqHelp
                      href="/founder-faq"
                      buttonClassName=" border-[#c9e2ec] bg-gradient-to-b from-[#f7fcff] to-[#dff2f9] text-[#2a819d] shadow-[0_8px_18px_rgba(42,129,157,0.2)] group-hover:shadow-[0_12px_26px_rgba(42,129,157,0.3)]"
                      iconClassName="text-[#5f7987]"
                      tooltipClassName="bg-[#315363] text-[#ecf9ff]"
                    />
                  </span>
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-1">
            <FounderAccountTabs
              founderDetails={ founderDetails }
              notifications={ notifications }
              featureConfig={ featureConfig }
              currentFamilyMembers={ currentFamilyMembers }
              memberActivitySummary={ memberActivitySummary }
              startDateValue={ startDateValue }
              endDateValue={ endDateValue }
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
