import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getMemberDetails } from "@/app/(family)/family-member-account/actions";
import { AccountDetails } from "@/features/auth/types/auth-types";
import { getUser2fa } from "@/components/db/sql/queries-user";
import { getAllFamilyMembers, getFamilyFounderDetails, getJoinedFamilyMembersForRemoval } from "@/components/db/sql/queries-family-member";
import { getMemberNotifications } from "@/components/db/sql/queries-family-notifications";
import { getMemberPageDetails } from "@/features/family/services/family-services";
import { CurrentFamilyMember, FounderDetails, NewFamilyInvite, RemovableFamilyMember } from "@/features/family/types/family-members";
import { Sparkles } from "lucide-react";
import FounderAccountTabs from "./founder-tabs";
import { toast } from "sonner";
import { getFounderDetails } from "@/features/family/services/get-founder-details";
import { getMemberImageDetailsByMemberId } from "@/components/db/sql/queries-family-member";
import MemberAvatar from "@/components/common/member-avatar";
import PublicHelpMenu from "@/components/common/public-help-menu";
import FounderFaqHelp from "@/components/common/founder-faq-help";
import { getFamilyFeatureConfig } from "@/components/db/sql/queries-family-features";

export default async function FamilyMyAccountPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const email = session.user?.email as string;
  const userId = Number(session.user?.id);


  const memberKeyDetails = await getMemberPageDetails();
  if (memberKeyDetails.isLoggedIn === false || memberKeyDetails.isFounder === false) {
    console.warn('Unauthorized access attempt to family founder account page. Redirecting to home page.');
    redirect("/");
  }

  const [
    memberNotificationsResult,
    featureConfigResult,
    currentMembersResult,
    memberImageResult,
    joinedMembersResult,
  ] = await Promise.all([
    getMemberNotifications(memberKeyDetails.memberId),
    getFamilyFeatureConfig(memberKeyDetails.familyId),
    getAllFamilyMembers(memberKeyDetails.familyId),
    getMemberImageDetailsByMemberId(memberKeyDetails.memberId),
    getJoinedFamilyMembersForRemoval(memberKeyDetails.familyId),
  ]);

  const memberImageUrl = memberImageResult.success ? memberImageResult.memberImageUrl : null;


  const notifications = memberNotificationsResult.success
    ? memberNotificationsResult.notifications
    : [];

  const featureConfig = featureConfigResult.success
    ? {
      familyStatus: featureConfigResult.familyStatus,
      features: featureConfigResult.features,
    }
    : {
      familyStatus: "active",
      features: [],
    };

  const newFamilyMembers: NewFamilyInvite[] = [];
  let currentFamilyMembers: CurrentFamilyMember[] = [];
  let joinedFamilyMembers: RemovableFamilyMember[] = [];

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

  if (joinedMembersResult.success) {
    joinedFamilyMembers = joinedMembersResult.members.map((member) => ({
      memberId: member.memberId,
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      status: member.status,
      memberImageUrl: member.memberImageUrl ?? null,
    }));
  }


  const founderDetailsResult = await getFounderDetails(memberKeyDetails.familyId);
  let founderDetails: FounderDetails | null = null;
  if (founderDetailsResult.success && founderDetailsResult.founderDetails) {
    founderDetails = founderDetailsResult.founderDetails;
  } else {
    console.error(`Error fetching founder details for familyId ${ memberKeyDetails.familyId }`);
    toast.error('Error fetching family founder details. Please try again later.');
    redirect("/");
  }

  return (
    <main className="font-app min-h-[90vh] max-w-screen bg-linear-to-b from-white to-slate-50 px-4 py-2 sm:px-6 md:px-8">
      <div className="mx-auto w-full max-w-4xl">
        <Card className="w-full overflow-hidden border-white/70 bg-white/82 pt-0 shadow-[0_28px_90px_-50px_rgba(16,54,74,0.75)] backdrop-blur">
          <CardHeader className="rounded-[1.35rem] bg-[linear-gradient(135deg,#59cdf7_0%,#9de4fe_45%,#fff2d8_100%)] px-6 pb-5 pt-5 text-center shadow-[inset_0_-1px_0_rgba(255,255,255,0.45)]">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/65 bg-white/55 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-[#005472] shadow-sm backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              Founder Dashboard
            </div>
            <div className="mt-3 flex justify-center">
              <MemberAvatar
                imageUrl={ memberImageUrl }
                firstName={ founderDetails.firstName }
                lastName={ founderDetails.lastName }
                sizeClassName="h-20 w-20"
              />
            </div>
            <CardTitle className="mt-3 text-center text-2xl font-extrabold tracking-[0.02em] text-[#10364a] md:text-[2rem]">
              My Family Account
            </CardTitle>
            <CardDescription className="mx-auto mt-2 max-w-2xl text-center text-sm leading-6 text-[#315363]">
              <div className="flex items-start justify-end md:pt-1 md:self-start">
                <span className="inline-flex items-center gap-2 text-sm text-[#5f7987]">
                  <p>Manage the <b>{ memberKeyDetails.familyName }</b> family settings here</p>
                  <FounderFaqHelp
                    href="/founder-faq"
                    buttonClassName=" border-[#c9e2ec] bg-gradient-to-b from-[#f7fcff] to-[#dff2f9] text-[#2a819d] shadow-[0_8px_18px_rgba(42,129,157,0.2)] group-hover:shadow-[0_12px_26px_rgba(42,129,157,0.3)]"
                    iconClassName="text-[#5f7987]"
                    tooltipClassName="bg-[#315363] text-[#ecf9ff]"
                  />
                </span>
              </div>

            </CardDescription>
          </CardHeader>

          <CardContent className="pt-1">
            <FounderAccountTabs
              founderDetails={ founderDetails }
              notifications={ notifications }
              featureConfig={ featureConfig }
              currentFamilyMembers={ currentFamilyMembers }
              joinedFamilyMembers={ joinedFamilyMembers }
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
