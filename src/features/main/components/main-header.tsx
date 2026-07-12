import NavBar from "@/components/common/nav-bar";
import MainDropMenu from "../../../components/common/main-dropmenu";
import { getCurrentMemberAvatarDetails } from "@/features/family/services/member-avatar-details";
import { getUnreadThreadCountForRecipient } from "@/components/db/sql/queries-thread-convos";
import { FamilyFeatureKey } from "@/features/family/services/family-feature-flags";

export default async function MainHeader({
  isLoggedIn,
  isFounder,
  firstName,
  enabledFeatureKeys,
}: {
  isLoggedIn: boolean;
  isFounder: boolean;
  firstName: string;
  enabledFeatureKeys?: FamilyFeatureKey[] | null;
}) {
  const memberAvatarDetails = await getCurrentMemberAvatarDetails();
  const unreadThreadCount = memberAvatarDetails.isLoggedIn
    ? await getUnreadThreadCountForRecipient(memberAvatarDetails.memberId)
    : 0;

  const isFeatureEnabled = (featureKey: FamilyFeatureKey): boolean => {
    if (!isLoggedIn) {
      return true;
    }

    if (!enabledFeatureKeys) {
      return true;
    }

    return enabledFeatureKeys.includes(featureKey);
  };

  const menuFirstName = memberAvatarDetails.firstName || firstName;
  const menuEmail = memberAvatarDetails.email;
  const menuSessionFound = memberAvatarDetails.isLoggedIn;
  const menuIsFounder = memberAvatarDetails.isLoggedIn ? memberAvatarDetails.isFounder : isFounder;
  const menuIsAdmin = memberAvatarDetails.isLoggedIn ? memberAvatarDetails.isAdmin : false;

  return (
    <>
      <header className="font-app px-2 pt-2 md:px-4 md:pt-3">
        <div className="flex justify-center mx-auto max-w-7xl overflow-hidden rounded-[1.9rem] border border-white/65 bg-[linear-gradient(135deg,rgba(11,47,66,0.96),rgba(21,98,123,0.88)_56%,rgba(106,177,198,0.8))] p-3 text-white shadow-[0_24px_70px_-42px_rgba(8,34,50,0.95)] md:p-4">
          <div className="grid items-center gap-4 lg:grid-cols-[auto_minmax(0,1fr)_auto]">
            <nav className="rounded-[1.5rem] border border-white/30 bg-white/12 px-3 py-3 backdrop-blur md:px-4">
              <ul className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
                { isFeatureEnabled("tv") ? <NavBar isLoggedIn={ isLoggedIn } href="/tv" src="/icons/tv.png" title="TV Room" /> : null }
                { isFeatureEnabled("movies") ? <NavBar isLoggedIn={ isLoggedIn } href="/movies" src="/icons/movies.png" title="Movie Theater" /> : null }
                { isFeatureEnabled("music") ? <NavBar isLoggedIn={ isLoggedIn } href="/music" src="/icons/music.png" title="Music Salon" /> : null }
                { isFeatureEnabled("books") ? <NavBar isLoggedIn={ isLoggedIn } href="/books" src="/icons/book.png" title="Reading Room" /> : null }
                { isFeatureEnabled("poetry") ? <NavBar isLoggedIn={ isLoggedIn } href="/poetry" src="/icons/poetry.png" title="Poetry Nook" /> : null }
                { isFeatureEnabled("foodies") ? <NavBar isLoggedIn={ isLoggedIn } href="/foodies" src="/icons/food.png" title="The Kitchen" /> : null }
                { isFeatureEnabled("gallery") ? <NavBar isLoggedIn={ isLoggedIn } href="/family-gallery" src="/icons/galleries.png" title="Picture Hallway" /> : null }
                { isFeatureEnabled("games") ? <NavBar isLoggedIn={ isLoggedIn } href="/games" src="/icons/games.png" title="Game Room" /> : null }
                { isFeatureEnabled("threads") ? <NavBar isLoggedIn={ isLoggedIn } href="/threads" src="/icons/family.png" title="Mail Box" /> : null }
                <MainDropMenu
                  firstName={ menuFirstName }
                  email={ menuEmail }
                  sessionFound={ menuSessionFound }
                  isFounder={ menuIsFounder }
                  isAdmin={ menuIsAdmin }
                  memberImageUrl={ memberAvatarDetails.memberImageUrl }
                  unreadThreadCount={ unreadThreadCount }
                />
              </ul>
            </nav>
          </div>
        </div>
      </header>
      <div className="p-1" />
    </>
  );
}