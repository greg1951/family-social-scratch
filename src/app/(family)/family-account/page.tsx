import z from "zod";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AddMembersFormSchema } from "@/features/family/components/validation/schema";
import MyFamilyAccountForm from ".";
import { getAllFamilyMembers } from "@/components/db/sql/queries-family-member";
import { FamilyMember } from "../family-setup/family-setup-dialogs/invite-family-dialog";
import { getMemberPageDetails } from "@/features/family/services/family-services";

type FormValues = z.infer<typeof AddMembersFormSchema>;

export default async function MyFamilyAccount() {
  const memberKeyDetails = await getMemberPageDetails();

  const membersResult = await getAllFamilyMembers(memberKeyDetails.familyId);
  const familyMembers = membersResult.members?.map((member) => ({
    id: member.id.toString(),
    firstName: member.firstName,
    lastName: member.lastName,
    email: member.email,
  })) as FamilyMember[];


  return (
    <div className="font-app min-h-[90vh] bg-linear-to-b from-white to-slate-50 px-4 py-2 sm:px-6 md:px-8">
      <div className="mx-auto w-full max-w-4xl">
        <Card className="w-full border-slate-200 shadow-lg">
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
          <MyFamilyAccountForm familyMembers={ familyMembers } />
        </Card>

      </div >
    </div >
  )
}