import { auth } from "@/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { getUser2fa } from "@/components/db/sql/queries-user";
import { redirect } from "next/navigation";
import AccountDetailsForm from "./index";
import { getMemberDetails } from "./actions";
import { AccountDetails } from "@/features/auth/types/auth-types";
import { getMemberPageDetails } from "@/features/family/services/family-services";
import FamilyNotificationsForm from "../family-notifications";
import { getMemberNotifications } from "@/components/db/sql/queries-family-notifications";

export default async function FamilyMemberAccount() {
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

  const [memberDetails, memberNotificationsResult] = await Promise.all([
    getMemberDetails(userId),
    getMemberNotifications(memberKeyDetails.memberId),
  ]);

  const notifications = memberNotificationsResult.success ? memberNotificationsResult.notifications : [];
  let accountDetails: AccountDetails | null = null;
  if (memberDetails.success) {
    const accountDetails: AccountDetails = {
      accountDetails: {
        email: session?.user?.email as string,
        familyName: session?.user?.name as string,
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

    return (
      <main className="font-app h-[90vh] gap-y-2 pt-1">
        <Card className="flex align-top w-[400] md:w-[700] pt-0">
          <CardHeader className=" text-base md:text-2xl bg-[#59cdf7] rounded-2xl text-center ">
            <CardTitle className="text-center font-bold size-1.2 p-1">My Account</CardTitle>
            <div className="p-1">
              <CardDescription className="text-xs md:text-sm text-center text-black/80">
                Manage <b>{ memberDetails.firstName } { memberDetails.lastName }'s</b> settings in the <b>{ memberKeyDetails.familyName }</b> family
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-0 ">
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid h-auto w-full grid-cols-1 gap-2 bg-transparent p-0 md:grid-cols-3 mb-10 md:mb-1">
                <TabsTrigger value="profile" className="border bg-slate-100 data-[state=active]:bg-white">
                  Member Profile
                </TabsTrigger>
                <TabsTrigger value="notifications" className="border bg-slate-100 data-[state=active]:bg-white">
                  Notifications
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

            </Tabs>

          </CardContent>
        </Card>
      </main>
    )
  }
}