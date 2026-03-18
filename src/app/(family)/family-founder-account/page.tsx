import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getMemberDetails } from "@/app/(family)/family-member-account/actions";
import { AccountDetails } from "@/features/auth/types/auth-types";
import { getUser2fa } from "@/components/db/sql/queries-user";
import { getAllFamilyMembers } from "@/components/db/sql/queries-family-member";
import { getMemberNotifications } from "@/components/db/sql/queries-family-notifications";
import { getMemberPageDetails } from "@/features/family/services/family-services";
import FamilyNotificationsForm from "../family-notifications";
import AccountDetailsForm from "@/app/(family)/family-member-account";
import MyFamilyAccountForm from "../(family-members)/family-new-members/index-new";
import { CurrentFamilyMember, NewFamilyMember } from "@/features/family/types/family-members";
import { CirclePlusIcon, CircleCheck, MessageCircleMore, UserPenIcon, UserPlus, Users } from 'lucide-react'
import NewMembersAccountForm from "../(family-members)/family-new-members/index-new";
import CurrentMembersAccountForm from "../(family-members)/family-current-members/index-current";

export default async function FamilyMyAccountPage() {


  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const email = session.user?.email as string;
  const userId = Number(session.user?.id);
  const familyName = session.user?.name as string;

  const [memberDetails, result2fa, memberKeyDetails] = await Promise.all([
    getMemberDetails(userId),
    getUser2fa(email),
    getMemberPageDetails(),
  ]);

  // console.log("FamilyMyAccountPage->memberDetails: ", memberDetails);
  // console.log("FamilyMyAccountPage->result2fa: ", result2fa);
  // console.log("FamilyMyAccountPage->memberKeyDetails: ", memberKeyDetails);
  if (memberKeyDetails.isLoggedIn === false || memberKeyDetails.isFounder === false) {
    console.warn('Unauthorized access attempt to family founder account page. Redirecting to home page.');
    redirect("/");
  }

  const memberNotificationsResult = await getMemberNotifications(memberKeyDetails.memberId);
  const notifications = memberNotificationsResult.success ? memberNotificationsResult.notifications : [];

  // const membersResult = await getAllFamilyMembers(memberKeyDetails.familyId);
  let newFamilyMembers: NewFamilyMember[] = [];

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
        <Card className="w-full border-slate-200 shadow-lg pt-0">
          <CardHeader className="rounded-t-xl bg-linear-to-r from-[#59cdf7] to-[#9de4fe] px-4 py-4 md:px-6 md:py-5">
            <CardTitle className="text-center text-2xl font-bold text-slate-900 md:text-3xl">
              My Family Account
            </CardTitle>
            <CardDescription className="text-center text-sm text-slate-800">
              Manage the <b>{ familyName }</b> family settings here
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-1">
            <Tabs defaultValue="profile" className=" gap-y-25 md:gap-y-2">
              <TabsList className="grid h-auto w-full grid-cols-1 gap-2 bg-transparent p-0 md:grid-cols-4 mb-10 md:mb-1">
                <TabsTrigger value="profile" className="border bg-slate-100 data-[state=active]:bg-white">
                  <UserPenIcon className="inline h-3 w-3 mr-1 text-[#59cdf7]" />
                  Your Profile
                </TabsTrigger>
                <TabsTrigger value="notifications" className="border bg-slate-100 data-[state=active]:bg-white">
                  <MessageCircleMore className="inline h-3 w-3 mr-1 text-[#59cdf7]" />
                  Your Notifications
                </TabsTrigger>
                <TabsTrigger value="current-family" className="border bg-slate-100 data-[state=active]:bg-white">
                  <Users className="inline h-3 w-3 mr-1 text-[#59cdf7]" />
                  Current Members
                </TabsTrigger>
                <TabsTrigger value="new-family" className="border bg-slate-100 data-[state=active]:bg-white">
                  <UserPlus className="inline h-3 w-3 mr-1 text-[#59cdf7]" />
                  Add Members
                </TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="mt-4">
                { accountDetails && (
                  <AccountDetailsForm accountDetails={ accountDetails } />
                ) }
              </TabsContent>

              <TabsContent value="notifications" className="mt-4 rounded-lg border p-4">
                <FamilyNotificationsForm notifications={ notifications } />
              </TabsContent>

              <TabsContent value="new-family" className="mt-4 rounded-lg border">
                <NewMembersAccountForm familyMembers={ newFamilyMembers } />
              </TabsContent>

              <TabsContent value="current-family" className="mt-4 rounded-lg border">
                <CurrentMembersAccountForm familyMembers={ currentFamilyMembers } />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
