import MainDropMenu from "@/components/common/main-dropmenu";
import { getUnreadThreadCountForRecipient } from "@/components/db/sql/queries-thread-convos";
import { getCurrentMemberAvatarDetails } from "@/features/family/services/member-avatar-details";

export default async function FeatureProfileMenu({ mobileVariant = "default" }: { mobileVariant?: "default" | "feature-hero" }) {
  const memberAvatarDetails = await getCurrentMemberAvatarDetails();

  const unreadThreadCount = memberAvatarDetails.isLoggedIn
    ? await getUnreadThreadCountForRecipient(memberAvatarDetails.memberId)
    : 0;

  const isFeatureHeroVariant = mobileVariant === "feature-hero";

  return (
    <div className={ `pointer-events-none absolute inset-x-0 z-40 ${ isFeatureHeroVariant ? "top-5 sm:top-0" : "top-0" }` }>
      <div className={ `mx-auto flex w-full max-w-7xl items-center justify-end px-4 ${ isFeatureHeroVariant ? "h-20 pr-6 sm:h-56 sm:px-6 sm:pr-10 lg:px-8 lg:pr-12" : "h-56 pr-8 sm:px-6 sm:pr-10 lg:px-8 lg:pr-12" }` }>
        <div className="pointer-events-auto">
        <MainDropMenu
          firstName={ memberAvatarDetails.firstName }
          email={ memberAvatarDetails.email }
          sessionFound={ memberAvatarDetails.isLoggedIn }
          isFounder={ memberAvatarDetails.isFounder }
          isAdmin={ memberAvatarDetails.isAdmin }
          memberImageUrl={ memberAvatarDetails.memberImageUrl }
          unreadThreadCount={ unreadThreadCount }
          sizeVariant={ isFeatureHeroVariant ? "feature-hero-mobile" : "default" }
        />
        </div>
      </div>
    </div>
  );
}
