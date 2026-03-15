import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getMemberPageDetails } from "@/features/family/services/family-services";
import FamilyNotificationsForm from ".";
import { getMemberNotifications } from "@/components/db/sql/queries-family-notifications";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function FamilyNotificationSettings() {
  // const session = await auth();

  // if (!session) {
  //   redirect("/login");
  // }

  const memberKeyDetails = await getMemberPageDetails();
  const memberNotificationsResult = await getMemberNotifications(memberKeyDetails.memberId);
  // console.log("FamilyNotificationSettings->notifications.length: ", memberNotificationsResult.notifications?.length);

  return (
    <main className="font-app h-[90vh]">
      <Card className="flex align-top w-[400] md:w-[700]">
        <CardHeader className=" text-base md:text-2xl bg-[#59cdf7] rounded-2xl text-center ">
          <CardTitle className="text-center font-bold size-1.2 p-2">My Account</CardTitle>
          <div className="p-1">
            <CardDescription className="text-xs">{ memberKeyDetails.familyName }</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <FamilyNotificationsForm notifications={ memberNotificationsResult.success ? memberNotificationsResult.notifications : [] } />
        </CardContent>
      </Card>
    </main>
  )
}