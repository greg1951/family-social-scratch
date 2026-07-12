import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getAllFamilyMembers } from "@/components/db/sql/queries-family-member";
import { getMemberNotifications } from "@/components/db/sql/queries-family-notifications";
import { getMemberPageDetails } from "@/features/family/services/family-services";
import { CurrentFamilyMember, FounderDetails } from "@/features/family/types/family-members";
import FounderAccountTabs from "./founder-tabs";
import { toast } from "sonner";
import { getFounderDetails } from "@/features/family/services/get-founder-details";
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
        <FounderAccountTabs
          founderDetails={ founderDetails }
          notifications={ notifications }
          featureConfig={ featureConfig }
          currentFamilyMembers={ currentFamilyMembers }
          memberActivitySummary={ memberActivitySummary }
          startDateValue={ startDateValue }
          endDateValue={ endDateValue }
        />
      </div>
    </main>
  );
}
