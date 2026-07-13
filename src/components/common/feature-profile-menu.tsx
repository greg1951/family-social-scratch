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
    <div className={ `pointer-events-none absolute inset-x-0 top-0 z-40 flex ${ isFeatureHeroVariant ? "h-28 sm:h-32 lg:h-36" : "h-56" } items-center justify-end` }>
      <div className={ `mx-auto flex w-full max-w-7xl justify-end px-4 ${ isFeatureHeroVariant ? "pr-6 sm:px-6 sm:pr-10 lg:px-8 lg:pr-12" : "pr-8 sm:px-6 sm:pr-10 lg:px-8 lg:pr-12" }` }>
        <div className="pointer-events-auto flex items-center">
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
