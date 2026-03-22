import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getMemberDetails } from "@/app/(family)/family-member-account/actions";
import { AccountDetails } from "@/features/auth/types/auth-types";
import { getUser2fa } from "@/components/db/sql/queries-user";
import { getAllFamilyMembers } from "@/components/db/sql/queries-family-member";
import { getMemberNotifications } from "@/components/db/sql/queries-family-notifications";
import { getMemberPageDetails } from "@/features/family/services/family-services";
import { CurrentFamilyMember, NewFamilyInvite } from "@/features/family/types/family-members";
import { Sparkles } from "lucide-react";
import FounderAccountTabs from "./founder-tabs";

export default async function FamilyMyAccountPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const email = session.user?.email as string;
  const userId = Number(session.user?.id);

  const [memberDetails, result2fa, memberKeyDetails] = await Promise.all([
    getMemberDetails(userId),
    getUser2fa(email),
    getMemberPageDetails(),
  ]);

  if (memberKeyDetails.isLoggedIn === false || memberKeyDetails.isFounder === false) {
    console.warn('Unauthorized access attempt to family founder account page. Redirecting to home page.');
    redirect("/");
  }

  const memberNotificationsResult = await getMemberNotifications(memberKeyDetails.memberId);
  const notifications = memberNotificationsResult.success ? memberNotificationsResult.notifications : [];

  // const membersResult = await getAllFamilyMembers(memberKeyDetails.familyId);
  let newFamilyMembers: NewFamilyInvite[] = [];

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
    })) as CurrentFamilyMember[];
  }


  let accountDetails: AccountDetails | null = null;
  if (memberDetails.success) {
    accountDetails = {
      accountDetails: {
        email: memberDetails.email as string,
        familyName: memberDetails.familyName,
        userId,
        memberId: memberDetails.memberId as number,
        firstName: memberDetails.firstName as string,
        lastName: memberDetails.lastName as string,
        nickName: memberDetails.nickName as string,
        birthday: memberDetails.birthday as string,
        cellPhone: memberDetails.cellPhone as string,
        mfaActive: memberDetails.mfaActive as boolean,
      }
    }
  }

  return (
    <main className="font-app min-h-[90vh] max-w-screen bg-linear-to-b from-white to-slate-50 px-4 py-2 sm:px-6 md:px-8">
      <div className="mx-auto w-full max-w-4xl">
        <Card className="w-full overflow-hidden border-white/70 bg-white/82 pt-0 shadow-[0_28px_90px_-50px_rgba(16,54,74,0.75)] backdrop-blur">
          <CardHeader className="rounded-[1.35rem] bg-[linear-gradient(135deg,#59cdf7_0%,#9de4fe_45%,#fff2d8_100%)] px-6 pb-5 pt-5 text-center shadow-[inset_0_-1px_0_rgba(255,255,255,0.45)]">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/65 bg-white/55 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-[#005472] shadow-sm backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              Founder Dashboard
            </div>
            <CardTitle className="mt-3 text-center text-2xl font-extrabold tracking-[0.02em] text-[#10364a] md:text-[2rem]">
              My Family Account
            </CardTitle>
            <CardDescription className="mx-auto mt-2 max-w-2xl text-center text-sm leading-6 text-[#315363]">
              Manage the <b>{ memberKeyDetails.familyName }</b> family settings here
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-1">
            <FounderAccountTabs
              accountDetails={ accountDetails }
              notifications={ notifications }
              familyId={ memberKeyDetails.familyId }
              currentFamilyMembers={ currentFamilyMembers }
              memberKeyDetails={ memberKeyDetails }
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
