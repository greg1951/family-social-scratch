import { Card } from "../../../components/ui/card";
import MainLinkCard from "../../../components/common/main-link-card";
import { getMemberPageDetails } from "@/features/family/services/family-services";
import PublicHelpMenu from "@/components/common/public-help-menu";
import { getFamilyFeatureConfig } from "@/components/db/sql/queries-family-features";
import { FamilyFeatureKey, getFeatureKeyFromReferenceName } from "@/features/family/services/family-feature-flags";
import FamilyActivity from "@/components/common/family-activity";
import MainDropMenu from "@/components/common/main-dropmenu";
import { getMemberImageDetailsByMemberId } from "@/components/db/sql/queries-family-member";
import { getUnreadThreadCountForRecipient } from "@/components/db/sql/queries-thread-convos";
import { RoomDefinitions, PhoneRoomOrder, TabletRoomOrder   } from "../types/constants";

// type MainRoomDefinition = {
//   featureKey: FamilyFeatureKey;
//   href: string;
//   roomTitle: string;
//   src: string;
// };

const roomDefinitions = RoomDefinitions;
const phoneRoomOrder = PhoneRoomOrder;
const tabletRoomOrder = TabletRoomOrder;

export default async function MainPage() {
  const memberKeyDetails = await getMemberPageDetails();
  let enabledFeatureKeys: FamilyFeatureKey[] | null = null;
  let memberImageUrl: string | null = null;
  let unreadThreadCount = 0;

  if (memberKeyDetails.isLoggedIn) {
    const [memberImageResult, unreadCount] = await Promise.all([
      getMemberImageDetailsByMemberId(memberKeyDetails.memberId),
      getUnreadThreadCountForRecipient(memberKeyDetails.memberId),
    ]);

    if (memberImageResult.success) {
      memberImageUrl = memberImageResult.memberImageUrl ?? null;
    }

    unreadThreadCount = unreadCount;
  }

  if (memberKeyDetails.isLoggedIn) {
    const featureConfigResult = await getFamilyFeatureConfig(memberKeyDetails.familyId);
    if (featureConfigResult.success) {
      enabledFeatureKeys = featureConfigResult.features
        .filter((f) => f.isSelected)
        .map((f) => getFeatureKeyFromReferenceName(f.featureName))
        .filter((k): k is FamilyFeatureKey => k !== null);
    }
  }

  const isFeatureEnabled = (featureKey: FamilyFeatureKey): boolean => {
    if (!memberKeyDetails.isLoggedIn) {
      return true;
    }

    if (!enabledFeatureKeys) {
      return true;
    }

    return enabledFeatureKeys.includes(featureKey);
  };

  let title: string = "Welcome to My Family Social! ";
  let cta: string = "If you want to know more, take a video tour.";
  if (memberKeyDetails.isLoggedIn) {
    title = `Welcome back, ${ memberKeyDetails.firstName }!`;
    cta = "Select a feature and share with the family.";
  }

  const renderRoom = (featureKey: FamilyFeatureKey, imageClassName: string) => {
    if (!isFeatureEnabled(featureKey)) {
      return null;
    }

    const room = roomDefinitions[featureKey];

    return (
      <MainLinkCard
        key={ room.featureKey }
        isLoggedIn={ memberKeyDetails.isLoggedIn }
        href={ room.href }
        src={ room.src }
        title={ room.roomTitle }
        tw="overflow-hidden rounded-xl border-[5px] border-[#9d3209] bg-[#9d3209] p-0 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg"
        imageClassName={ imageClassName }
      />
    );
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-[#b6c9e4] via-[#c7d9ef] to-[#d6e3f4]">
      <section className="font-app px-2 pb-5 pt-5 sm:px-4 sm:pb-6 sm:pt-6 md:px-8">
        <div className="mx-auto w-full max-w-260">
          <Card className="rounded-[22px] border border-slate-200/70 bg-white/95 px-3 py-2 shadow-sm sm:min-h-27 sm:px-6 sm:py-2.5">
            <div className="flex items-center justify-between gap-3 sm:gap-5">
              <div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <p className="font-sans text-[17px] leading-none font-extrabold tracking-tight text-slate-800 sm:text-[20px]">{ title }</p>
                  <div className="flex items-center gap-1.5 sm:gap-2.5">
                    <div className="scale-85 sm:scale-100">
                      <PublicHelpMenu href="/faq" />
                    </div>
                    { memberKeyDetails.isLoggedIn && (
                      <div className="scale-85 sm:scale-100">
                        <FamilyActivity />
                      </div>
                    ) }
                  </div>
                </div>
                <div className="mt-1">
                  <p className="font-sans text-[10px] font-semibold leading-tight text-slate-600 sm:text-[12px]">{ cta }</p>
                </div>
              </div>

              <div className="shrink-0 self-center scale-90 sm:scale-95">
                <MainDropMenu
                  firstName={ memberKeyDetails.firstName }
                  email={ memberKeyDetails.email }
                  sessionFound={ memberKeyDetails.isLoggedIn }
                  isFounder={ memberKeyDetails.isFounder }
                  isAdmin={ !!memberKeyDetails.isAdmin }
                  memberImageUrl={ memberImageUrl }
                  unreadThreadCount={ unreadThreadCount }
                />
              </div>
            </div>
          </Card>

          <div className="mx-auto mt-6 w-fit max-w-full overflow-x-hidden px-2 pb-4">
            <div className="relative mx-auto w-fit pt-16 md:pt-17">
              <div className="absolute left-1/2 top-0 h-16 w-102.5 -translate-x-1/2 bg-[#1f2c42] [clip-path:polygon(50%_0,100%_100%,0_100%)] md:h-17 md:w-234" />
              <div className="absolute right-6 top-7 h-11 w-9 rounded-t-sm bg-[#cf4505] md:right-19 md:top-6 md:h-11 md:w-10" />

              <div className="relative rounded-[22px] border-8 border-[#cf4505] bg-[#cf4505] p-2 shadow-[0_25px_55px_-28px_rgba(11,15,23,0.92)] md:p-3">
                <div className="grid grid-cols-3 gap-2 md:hidden">
                  { phoneRoomOrder.map((featureKey) => renderRoom(featureKey, "h-[172px] w-[120px] object-cover")) }
                </div>

                <div className="hidden grid-cols-3 gap-3 md:grid">
                  { tabletRoomOrder.map((featureKey) => renderRoom(featureKey, "h-[182px] w-[293px] object-cover")) }
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
