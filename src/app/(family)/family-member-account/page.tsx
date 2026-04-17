import { auth } from "@/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { getUser2fa } from "@/components/db/sql/queries-user";
import { redirect } from "next/navigation";
import { getMemberDetails } from "./actions";
import { AccountDetails } from "@/features/auth/types/auth-types";
import { getMemberPageDetails } from "@/features/family/services/family-services";
import { getMemberNotifications } from "@/components/db/sql/queries-family-notifications";
import { Sparkles } from "lucide-react";
import MemberAccountTabs from "./member-tabs";
import { getAllFamilyMembers, getFamilyFounderDetails, getMemberImageDetailsByMemberId } from "@/components/db/sql/queries-family-member";
import { CurrentFamilyMember, FounderDetails } from "@/features/family/types/family-members";
import { toast } from "sonner";
import MemberAvatar from "@/components/common/member-avatar";

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

  const [memberDetails, memberNotificationsResult, memberImageResult] = await Promise.all([
    getMemberDetails(userId),
    getMemberNotifications(memberKeyDetails.memberId),
    getMemberImageDetailsByMemberId(memberKeyDetails.memberId),
  ]);

  const memberImageUrl = memberImageResult.success ? memberImageResult.memberImageUrl : null;

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
        memberImageUrl: member.memberImageUrl ?? null,
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
        familyName: founderDetailsResult.familyName!,
        familyId: memberKeyDetails.familyId,
        isFounder: true,
      };
    }


    return (
      <main className="font-app h-[90vh] gap-y-2 pt-1 w-[700]">
        <Card className="flex align-top w-[400] overflow-hidden border-white/70 bg-white/82 pt-0 shadow-[0_28px_90px_-50px_rgba(16,54,74,0.75)] backdrop-blur md:w-[700]">
          <CardHeader className="rounded-[1.35rem] bg-[linear-gradient(135deg,#59cdf7_0%,#9de4fe_45%,#fff2d8_100%)] px-6 pb-5 pt-5 text-center shadow-[inset_0_-1px_0_rgba(255,255,255,0.45)]">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/65 bg-white/55 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-[#005472] shadow-sm backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              Your Space
            </div>
            <div className="mt-3 flex justify-center">
              <MemberAvatar
                imageUrl={ memberImageUrl }
                firstName={ memberDetails.firstName }
                lastName={ memberDetails.lastName }
                sizeClassName="h-20 w-20"
              />
            </div>
            <CardTitle className="mt-3 text-center text-2xl font-extrabold tracking-[0.02em] text-[#10364a] md:text-[2rem]">My Account</CardTitle>
            <div className="pt-1">
              <CardDescription className="mx-auto max-w-2xl text-center text-sm leading-6 text-[#315363]">
                Manage <b>{ memberDetails.firstName } { memberDetails.lastName }'s</b> settings in the <b>{ memberKeyDetails.familyName }</b> family
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-0 ">
            { accountDetails && (
              <MemberAccountTabs
                accountDetails={ accountDetails }
                notifications={ notifications }
                currentFamilyMembers={ currentFamilyMembers }
                memberKeyDetails={ memberKeyDetails }
                founderDetails={ founderDetails }
              />
            ) }
          </CardContent>
        </Card>
      </main>
    )
  }
}