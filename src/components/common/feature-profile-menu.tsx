import MainDropMenu from "@/components/common/main-dropmenu";
import { getUnreadThreadCountForRecipient } from "@/components/db/sql/queries-thread-convos";
import { getCurrentMemberAvatarDetails } from "@/features/family/services/member-avatar-details";

export default async function FeatureProfileMenu() {
  const memberAvatarDetails = await getCurrentMemberAvatarDetails();

  const unreadThreadCount = memberAvatarDetails.isLoggedIn
    ? await getUnreadThreadCountForRecipient(memberAvatarDetails.memberId)
    : 0;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-40">
      <div className="mx-auto flex h-56 w-full max-w-7xl items-center justify-end px-4 pr-8 sm:px-6 sm:pr-10 lg:px-8 lg:pr-12">
        <div className="pointer-events-auto">
        <MainDropMenu
          firstName={ memberAvatarDetails.firstName }
          email={ memberAvatarDetails.email }
          sessionFound={ memberAvatarDetails.isLoggedIn }
          isFounder={ memberAvatarDetails.isFounder }
          isAdmin={ memberAvatarDetails.isAdmin }
          memberImageUrl={ memberAvatarDetails.memberImageUrl }
          unreadThreadCount={ unreadThreadCount }
        />
        </div>
      </div>
    </div>
  );
}
