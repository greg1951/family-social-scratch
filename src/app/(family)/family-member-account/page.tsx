import { auth } from "@/auth";

import { redirect } from "next/navigation";
import { getMemberDetails } from "./actions";
import { AccountDetails } from "@/features/auth/types/auth-types";
import { getMemberPageDetails } from "@/features/family/services/family-services";
import { getMemberNotifications } from "@/components/db/sql/queries-family-notifications";
import MemberAccountTabs from "./member-tabs";
import { getAllFamilyMembers, getFamilyFounderDetails } from "@/components/db/sql/queries-family-member";
import { CurrentFamilyMember, FounderDetails } from "@/features/family/types/family-members";
import { toast } from "sonner";
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

export default async function FamilyMemberAccount({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; startDate?: string; endDate?: string }>;
}) {
  const session = await auth();

  if (!session) {
    redirect('/login')
  }
  const email = session?.user?.email as string;
  const userId = Number(session?.user?.id);

  const memberKeyDetails = await getMemberPageDetails();
  if (memberKeyDetails.isLoggedIn === false) {
    console.warn('Unauthorized access attempt to member account page. Redirecting to home page.');
    redirect("/");
  }
  if (memberKeyDetails.isFounder === true) {
    redirect("/family-founder-account");
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

  const [memberDetails, memberNotificationsResult] = await Promise.all([
    getMemberDetails(userId),
    activeTab === "settings"
      ? getMemberNotifications(memberKeyDetails.memberId)
      : Promise.resolve({ success: true as const, memberId: memberKeyDetails.memberId, notifications: [] }),
  ]);

  const notifications = memberNotificationsResult.success ? memberNotificationsResult.notifications : [];
  const accountDetails: AccountDetails | null = null;
  if (memberDetails.success) {
    const accountDetails: AccountDetails = {
      accountDetails: {
        email: session?.user?.email as string,
        familyName: memberKeyDetails.familyName,
        userId: userId as number,
        memberId: memberDetails.memberId as number,
        firstName: memberDetails.firstName as string,
        lastName: memberDetails.lastName as string,
        nickName: memberDetails.nickName as string,
        birthday: memberDetails.birthday as string,
        cellPhone: memberDetails.cellPhone as string,
        mfaActive: memberDetails.mfaActive as boolean,
      }
    }

    const currentMembersResult = await getAllFamilyMembers(memberKeyDetails.familyId);
    let currentFamilyMembers: CurrentFamilyMember[] = [];

    if (currentMembersResult.success && currentMembersResult.members) {
      // console.log('FamilyCurrentMembersPage->getAllFamilyMembers->membersResult: ', currentMembersResult);
      currentFamilyMembers = currentMembersResult.members.map((member) => ({
        id: member.id,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        status: member.status,
        memberImageUrl: member.memberImageUrl ?? null,
      })) as CurrentFamilyMember[];
    }

    const founderDetailsResult = await getFamilyFounderDetails(memberKeyDetails.familyId);
    let founderDetails: FounderDetails | null = null;
    if (!founderDetailsResult.success) {
      console.error(`Error fetching founder details for familyId ${ memberKeyDetails.familyId }: ${ founderDetailsResult.message }`);
      toast.error('Error fetching family founder details. Please try again later.');
      redirect("/");
    }
    else {
      founderDetails = {
        email: founderDetailsResult.email,
        status: founderDetailsResult.status,
        memberId: founderDetailsResult.memberId,
        firstName: founderDetailsResult.firstName,
        lastName: founderDetailsResult.lastName,
        nickName: founderDetailsResult.nickName!,
        birthday: founderDetailsResult.birthday!,
        cellPhone: founderDetailsResult.cellPhone!,
        familyName: founderDetailsResult.familyName!,
        familyId: memberKeyDetails.familyId,
        isFounder: true,
      };
    }


    return (
      <main className="font-app min-h-[90vh] bg-linear-to-b from-white to-slate-50 px-4 py-2 sm:px-6 md:px-8">
        <div className="mx-auto w-full max-w-4xl">
          { accountDetails && (
            <MemberAccountTabs
              accountDetails={ accountDetails }
              notifications={ notifications }
              currentFamilyMembers={ currentFamilyMembers }
              memberKeyDetails={ memberKeyDetails }
              founderDetails={ founderDetails }
              memberActivitySummary={ memberActivitySummary }
              startDateValue={ startDateValue }
              endDateValue={ endDateValue }
            />
          ) }
        </div>
      </main>
    )
  }
}