import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getMemberDetails } from "@/app/(family)/family-member-account/actions";
import { getAllFamilyMembers, getFamilyFounderDetails } from "@/components/db/sql/queries-family-member";
import { getMemberPageDetails } from "@/features/family/services/family-services";
import { CurrentFamilyMember, FounderDetails, NewFamilyInvite } from "@/features/family/types/family-members";
import FamilyMemberSuggestForm from ".";
import { toast } from "sonner";

export default async function FamilyMemberSuggestPage() {

  const session = await auth();
  console.log('FamilyMemberSuggestPage->session: ', session);

  if (!session) {
    redirect("/login");
  }

  const email = session.user?.email as string;
  const userId = Number(session.user?.id);

  const [memberDetails, memberKeyDetails] = await Promise.all([
    getMemberDetails(userId),
    getMemberPageDetails(),
  ]);

  if (memberKeyDetails.isLoggedIn === false) {
    console.warn('Unauthorized access attempt to family founder account page. Redirecting to home page.');
    redirect("/");
  }
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
    };
  }


  return (
    <div className="font-app min-h-[90vh] bg-linear-to-b from-white to-slate-50 px-4 py-2 sm:px-6 md:px-8">
      <div className="mx-auto w-full max-w-4xl">
        <Card className="w-full border-slate-200 shadow-lg pt-0">
          <CardHeader className="rounded-t-xl bg-linear-to-r from-[#59cdf7] to-[#9de4fe] px-4 py-4 md:px-6 md:py-1">
            <div>
              <CardTitle className="text-2xl font-bold text-slate-900 md:text-3xl text-center">
                Family Member Suggestions
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
                <p className='text-sm'>Family members are listed here. If there is a invitation to someone you want to add, you can send it from this page.</p>
              </div>
            </CardDescription>
          </div>
          <FamilyMemberSuggestForm
            familyId={ memberKeyDetails.familyId }
            currentFamilyMembers={ currentFamilyMembers }
            memberKeyDetails={ memberKeyDetails }
            founderDetails={ founderDetails }
          />
        </Card>

      </div >
    </div >
  );
}