import { auth } from "@/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getUser2fa } from "@/components/db/sql/queries-user";
import { redirect } from "next/navigation";
import AccountDetailsForm from "./index";
import { getMemberDetails } from "./actions";
import { AccountDetails } from "@/features/auth/auth-types";

// interface AccountDetails {
//   accountDetails: {
//     email: string;
//     familyName: string;
//     userId: number;
//     memberId: number;
//     firstName: string;
//     lastName: string;
//     nickName: string;
//     birthday: string;
//     cellPhone: string;
//     mfaActive: boolean;
//   }
// }


export default async function MyAccount() {
  const session = await auth();

  if (!session) {
    redirect('/login')
  }
  const email = session?.user?.email as string;
  const userId = Number(session?.user?.id);
  const familyName = session?.user?.name as string;
  const result2fa = await getUser2fa(email);

  const memberDetails = await getMemberDetails(userId);
  // console.log("AccountDetailsForm->memberDetails: ", memberDetails);

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
    <main className="font-app h-[90vh]">
      <Card className="flex align-top w-[350] md:w-[600]">
        <CardHeader className=" text-base md:text-2xl bg-[#59cdf7] rounded-2xl text-center ">
          <CardTitle className="text-center font-bold size-1.2 p-2">My Account</CardTitle>
          <div className="p-1">
            <CardDescription className="text-xs">{ session.user?.name }</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <AccountDetailsForm accountDetails={ accountDetails.accountDetails } />
        </CardContent>
      </Card>
    </main>
  )
}