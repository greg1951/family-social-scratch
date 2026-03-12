import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AccountDetailsForm from "@/app/(family)/my-account";
import TwoFactorAuthForm from "@/app/(auth)/(logged-in)/two-factor-auth-form";
import MyFamilyAccountForm from "../family-account";
import { getMemberDetails } from "@/app/(family)/my-account/actions";
import { AccountDetails } from "@/features/auth/auth-types";
import { getUser2fa } from "@/components/db/sql/queries-user";
import { getAllFamilyMembers, getMemberNotifications } from "@/components/db/sql/queries-family-member";
import { FamilyMember } from "../family-setup/family-setup-dialogs/invite-family-dialog";
import { getMemberPageDetails } from "@/features/family/services/family-services";
import FamilyNotificationsForm from "../family-notifications";

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

  const memberNotificationsResult = await getMemberNotifications(memberKeyDetails.memberId);

  const membersResult = await getAllFamilyMembers(memberKeyDetails.familyId);
  const familyMembers = (membersResult.members ?? []).map((member) => ({
    id: member.id.toString(),
    firstName: member.firstName,
    lastName: member.lastName,
    email: member.email,
  })) as FamilyMember[];

  const accountDetails: AccountDetails = {
    accountDetails: {
      email,
      familyName: familyName ?? "",
      userId,
      memberId: memberDetails.memberId as number,
      firstName: memberDetails.firstName as string,
      lastName: memberDetails.lastName as string,
      nickName: memberDetails.nickName as string,
      birthday: memberDetails.birthday as string,
      cellPhone: memberDetails.cellPhone as string,
      mfaActive: memberDetails.mfaActive as boolean,
    },
  };

  return (
    <main className="font-app min-h-[90vh] bg-linear-to-b from-white to-slate-50 px-4 py-2 sm:px-6 md:px-8">
      <div className="mx-auto w-full max-w-4xl">
        <Card className="w-full border-slate-200 shadow-lg">
          <CardHeader className="rounded-t-xl bg-linear-to-r from-[#59cdf7] to-[#9de4fe] px-4 py-4 md:px-6 md:py-5">
            <CardTitle className="text-center text-2xl font-bold text-slate-900 md:text-3xl">
              My Family Account
            </CardTitle>
            <CardDescription className="text-center text-sm text-slate-800">
              Manage the settings for the <b>{ familyName }</b> family in one place.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-1">
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid h-auto w-full grid-cols-1 gap-2 bg-transparent p-0 md:grid-cols-3 mb-10 md:mb-1">
                <TabsTrigger value="profile" className="border bg-slate-100 data-[state=active]:bg-white">
                  Founder's Profile
                </TabsTrigger>
                <TabsTrigger value="family" className="border bg-slate-100 data-[state=active]:bg-white">
                  Family Invitations
                </TabsTrigger>
                <TabsTrigger value="notifications" className="border bg-slate-100 data-[state=active]:bg-white">
                  Notifications Settings
                </TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="mt-4">
                <AccountDetailsForm accountDetails={ accountDetails.accountDetails } />
              </TabsContent>

              <TabsContent value="notifications" className="mt-4 rounded-lg border p-4">
                <FamilyNotificationsForm notifications={ memberNotificationsResult.notifications } />
              </TabsContent>

              <TabsContent value="family" className="mt-4 rounded-lg border">
                <MyFamilyAccountForm familyMembers={ familyMembers } />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
