import z from "zod";
import { redirect } from "next/navigation";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NewMembersFormSchema } from "@/features/family/components/validation/schema";
import { getAllFamilyMembers } from "@/components/db/sql/queries-family-member";
import { getMemberPageDetails } from "@/features/family/services/family-services";
import CurrentMembersAccountForm from "./index-current";
import { CurrentFamilyMember } from "@/features/family/types/family-members";
import { copyMemberToFounderDetails } from "@/features/family/services/client-side";

type FormValues = z.infer<typeof NewMembersFormSchema>;

/* 
   Only the form in the index.tsx file is referenced. 
    This page however is strictly for testing. 
    Rename the page to page.tsx and 
    Set the browser url to /family-current-members for testing. 
*/
export default async function FamilyCurrentMembersPage() {

  const memberKeyDetails = await getMemberPageDetails();
  if (memberKeyDetails.isLoggedIn === false || memberKeyDetails.isFounder === false) {
    console.warn('Unauthorized access attempt to family current members page. Redirecting to home page.');
    redirect("/");
  }

  // console.log('FamilyCurrentMembersPage->memberKeyDetails: ', memberKeyDetails);

  const membersResult = await getAllFamilyMembers(memberKeyDetails.familyId);
  let familyMembers: CurrentFamilyMember[] = [];

  if (membersResult.success && membersResult.members) {
    // console.log('FamilyCurrentMembersPage->getAllFamilyMembers->membersResult: ', membersResult);
    familyMembers = membersResult.members.map((member) => ({
      id: member.id,
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      status: member.status,
      memberImageUrl: member.memberImageUrl ?? null,
    })) as CurrentFamilyMember[];
  }

  const founderDetails = copyMemberToFounderDetails(memberKeyDetails);

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
                <img src="/icons/add-family.png" alt="add family" className="aspect-auto object-cover h-7 w-7 md:h-10 md:w-10 " />
                <h3 className="font-extrabold inline p-0">
                  Update Family
                </h3>
                <p className='text-sm'>In the Update Family Members dialog you can mark current members for removal or resend invitations to pending members.</p>
              </div>
            </CardDescription>
          </div>
          <CurrentMembersAccountForm familyMembers={ familyMembers } founderDetails={ founderDetails } />
        </Card>

      </div >
    </div >
  )
}