import z from "zod";
import { redirect } from "next/navigation";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NewMembersFormSchema } from "@/features/family/components/validation/schema";
import NewMembersAccountForm from "./index-new";
import { getAllFamilyMembers, getMemberDetailsByEmail } from "@/components/db/sql/queries-family-member";
import { getMemberPageDetails } from "@/features/family/services/family-services";
import { NewFamilyInvite } from "@/features/family/types/family-members";
import { member } from "@/components/db/schema/family-social-schema-tables";
import { AccountDetails } from "@/features/auth/types/auth-types";

type FormValues = z.infer<typeof NewMembersFormSchema>;

/* Only the form in the index.tsx file is referenced. This page is strictly for testing. Rename the page to page.tsx and the url to /family-account for testing. */
export default async function FamilyNewMembersPage() {
  const memberKeyDetails = await getMemberPageDetails();
  if (memberKeyDetails.isLoggedIn === false || memberKeyDetails.isFounder === false) {
    console.warn('Unauthorized access attempt to family account members page. Redirecting to home page.');
    redirect("/");
  }

  const [memberDetailsResult] = await Promise.all([
    getMemberDetailsByEmail(memberKeyDetails.email),
  ]);


  let accountDetails: AccountDetails | null = null;
  if (memberDetailsResult.success) {
    accountDetails = {
      accountDetails: {
        userId: memberDetailsResult.userId,
        email: memberDetailsResult.email,
        familyName: memberDetailsResult.familyName,
        firstName: memberDetailsResult.firstName,
        lastName: memberDetailsResult.lastName,
        nickName: memberDetailsResult.nickName,
        birthday: memberDetailsResult.birthday,
        cellPhone: memberDetailsResult.cellPhone,
        memberId: memberDetailsResult.memberId,
        mfaActive: memberDetailsResult.mfaActive,
      }
    };
  }



  return (
    <div className="font-app min-h-[90vh] bg-linear-to-b from-white to-slate-50 px-4 py-2 sm:px-6 md:px-8">
      <div className="mx-auto w-full max-w-4xl">
        <Card className="w-full border-slate-200 shadow-lg pt-0">
          <CardHeader className="rounded-t-xl bg-linear-to-r from-[#59cdf7] to-[#9de4fe] px-4 py-4 md:px-6 md:py-1">
            <div>
              <CardTitle className="text-2xl font-bold text-slate-900 md:text-3xl text-center">
                Manage Family Account
              </CardTitle>
            </div>
          </CardHeader>
          <div className="grid grid-cols-1 gap-1">
            <CardDescription>
              <div className="flex items-center justify-center gap-2 pl-5 p-2">
                <img src="/icons/add-family.png" alt="add family" className="aspect-auto object-cover h-10 w-10 md:h-15 md:w-15 " />
                <h3 className="font-extrabold inline p-0">
                  Invite Family
                </h3>
                <p className='text-sm'>Emails will be used to send invitations to family and friends. You will add them to the list below and when done, proceed to the confirmation step.</p>
              </div>
            </CardDescription>
          </div>
          <NewMembersAccountForm familyId={ memberKeyDetails.familyId } accountDetails={ accountDetails } />
        </Card>

      </div >
    </div >
  )
}