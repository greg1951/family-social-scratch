import MainHeader from "@/features/main/components/main-header";
import { Card } from "../../../components/ui/card";
import Link from "next/link";
import MainLinkCard from "../../../components/common/main-link-card";
import { getMemberPageDetails } from "@/features/family/services/family-services";
import PublicHelpMenu from "@/components/common/public-help-menu";
import { Goal } from "lucide-react";
import { getFamilyFeatureConfig } from "@/components/db/sql/queries-family-features";
import { FamilyFeatureKey, getFeatureKeyFromReferenceName } from "@/features/family/services/family-feature-flags";

export default async function MainPage() {
  const memberKeyDetails = await getMemberPageDetails();
  let enabledFeatureKeys: FamilyFeatureKey[] | null = null;
  let threadsColSpan = true;

  if (memberKeyDetails.isLoggedIn) {
    const featureConfigResult = await getFamilyFeatureConfig(memberKeyDetails.familyId);
    if (featureConfigResult.success) {
      enabledFeatureKeys = featureConfigResult.features
        .filter((f) => f.isSelected)
        .map((f) => getFeatureKeyFromReferenceName(f.featureName))
        .filter((k): k is FamilyFeatureKey => k !== null);

      const activeCount = featureConfigResult.features.length;
      const selectedCount = featureConfigResult.features.filter((f) => f.isSelected).length;
      const activeOdd = activeCount % 2 !== 0;
      const selectedOdd = selectedCount % 2 !== 0;
      // odd active + odd selected   → span 2
      // odd active + even selected  → span 1
      // even active + odd selected  → span 2
      // even active + even selected → span 1
      threadsColSpan = (activeOdd && selectedOdd) || (!activeOdd && selectedOdd);
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

  const whatsNewItems = [
    "Customer support is here to help! Check out our informative Frequently Asked Questions (FAQ) page.",
    "All My Family Social features are live! Check them out and start sharing your favorites with your family.",
    "Visit the Family Dashboard to see charts about your family activity across all channels.",
    "The My Family Social Dev Team is working on a new Photo Galleries feature. You'll be able to create albums, upload and share them with the rest of the family!",
    "Personalize your account by uploading a lovely mugshot to your profile.",
  ];
  const ctaCardClasses = [
    "group relative rounded-xl border border-sky-300/80 bg-linear-to-b from-white via-sky-50 to-cyan-50",
    "px-4 py-2.5 text-center text-[16px] font-bold tracking-[0.01em] text-sky-900",
    "shadow-[0_6px_14px_rgba(3,79,112,0.14)] transition-all duration-300",
    "hover:-translate-y-0.5 hover:border-sky-400 hover:from-sky-50 hover:to-white hover:shadow-[0_10px_20px_rgba(3,79,112,0.22)]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70"
  ].join(" ");

  let title: string = "Welcome to My Family Social! ";
  let cta: string = "If you want to know more, take a video tour.";
  if (memberKeyDetails.isLoggedIn) {
    title = `Welcome back, ${ memberKeyDetails.firstName }!`;
    cta = "Select  a feature and share with the family.";
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 to-white">
      <MainHeader
        isLoggedIn={ memberKeyDetails.isLoggedIn }
        isFounder={ memberKeyDetails.isFounder }
        firstName={ memberKeyDetails.firstName }
        enabledFeatureKeys={ enabledFeatureKeys }
      />

      <section className="font-app px-2 pb-3 md:px-4 md:pb-4">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-2 sm:grid-cols-2 md:gap-3">
          <Card className="sm:col-span-2 rounded-xl border border-slate-200 bg-linear-to-r from-[#d8f4ff] to-[#eef9ff] p-3 shadow-sm md:p-4">
            <div className="flex flex-col items-center justify-between gap-3 md:flex-row md:items-start">
              <div className="flex items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-base font-extrabold text-slate-800 md:text-lg">{ title }</p>
                    { !memberKeyDetails.isLoggedIn && (
                      <PublicHelpMenu href="/faq" />
                    ) }
                  </div>
                  <p className="text-sm text-slate-600 md:text-base">{ cta }</p>
                </div>
              </div>

              <div className="grid w-full grid-cols-1 gap-2 text-base md:w-auto md:grid-cols-3 pt-2">
                { memberKeyDetails.isFounder && (
                  <>
                    <Link
                      href="/family-dashboard"
                      className={ ctaCardClasses }
                    >
                      Activity Dashboard
                    </Link>
                    <Link
                      href="/whats-new"
                      className={ ctaCardClasses }
                    >
                      What&apos;s New?
                    </Link>
                    {/* <Link
                      href="/help-subscribe"
                      className={ ctaCardClasses }
                    >
                      Review Subscription Plans
                    </Link> */}
                  </>
                ) }
                { memberKeyDetails.isLoggedIn && !memberKeyDetails.isFounder && (
                  <>
                    <Link
                      href="/family-dashboard"
                      className={ ctaCardClasses }
                    >
                      Activity Dashboard
                    </Link>
                    <Link
                      href="/whats-new"
                      className={ ctaCardClasses }
                    >
                      What&apos;s New?
                    </Link>
                  </>
                ) }
              </div>
            </div>
          </Card>

          {/* { memberKeyDetails.isLoggedIn && (
            <Card className="sm:col-span-2 rounded-xl border border-slate-200 bg-linear-to-r from-[#efe9ff] to-[#f7f3ff] p-3 shadow-sm md:p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#6b5ca8]">Family Snapshot</p>
                  <h2 className="mt-1 text-lg font-extrabold text-slate-800 md:text-xl">What&apos;s New in the Family?</h2>
                  <ul className="mt-2 space-y-1 text-xs text-slate-700 md:text-sm">
                    { whatsNewItems.map((item) => (
                      <li key={ item } className="flex items-start gap-2">
                        <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-[#6b5ca8]" />
                        <span>{ item }</span>
                      </li>
                    )) }
                  </ul>
                </div>
              </div>
            </Card>
          ) } */}

          { isFeatureEnabled("tv") ? (
            <MainLinkCard isLoggedIn={ memberKeyDetails.isLoggedIn } href="/tv" src="/images/tv-junkies-tablet.png" title="TV Junkies" tw="rounded-xl border border-red-300 bg-red-500 p-2 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg relative overflow-hidden" />
          ) : null }
          { isFeatureEnabled("movies") ? (
            <MainLinkCard isLoggedIn={ memberKeyDetails.isLoggedIn } href="/movies" src="/images/movie-maniacs-wide.jpg" title="Movie Maniacs" tw="rounded-xl border border-yellow-300 bg-yellow-500 p-2 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg relative overflow-hidden" />
          ) : null }
          { isFeatureEnabled("books") ? (
            <MainLinkCard isLoggedIn={ memberKeyDetails.isLoggedIn } href="/books" src="/images/book-besties-tablet.png" title="Book Besties" tw="rounded-xl border border-blue-300 bg-blue-500 p-2 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg relative overflow-hidden" />
          ) : null }
          { isFeatureEnabled("foodies") ? (
            <MainLinkCard isLoggedIn={ memberKeyDetails.isLoggedIn } href="/foodies" src="/images/family-foodies-tablet.png" title="Family Foodies" tw="rounded-xl border border-green-300 bg-green-500 p-2 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg relative overflow-hidden" />
          ) : null }
          { isFeatureEnabled("music") ? (
            <MainLinkCard isLoggedIn={ memberKeyDetails.isLoggedIn } href="/music" src="/images/music-lovers-tablet.png" title="Music Lovers" tw="rounded-xl border border-[#2C5EAD]/45 bg-linear-to-br from-[#2C5EAD] via-[#2C5EAD] to-[#244B8A] p-2 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[#2C5EAD]/70 hover:shadow-lg relative overflow-hidden" />
          ) : null }
          { isFeatureEnabled("poetry") ? (
            <MainLinkCard isLoggedIn={ memberKeyDetails.isLoggedIn } href="/poetry" src="/images/poetry-cafe-tablet.png" title="Poetry Cafe" tw="rounded-xl border border-cyan-300 bg-cyan-500 p-2 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg relative overflow-hidden" />
          ) : null }
          { isFeatureEnabled("games") ? (
            <MainLinkCard isLoggedIn={ memberKeyDetails.isLoggedIn } href="/games" src="/images/game-scoreboards-tablet.png" title="Games Scoreboard" tw="rounded-xl border border-amber-300 bg-amber-500 p-2 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg relative overflow-hidden" />
          ) : null }
          { isFeatureEnabled("gallery") ? (
            <MainLinkCard isLoggedIn={ memberKeyDetails.isLoggedIn } href="/family-gallery" src="/images/photo-galleries-wide.jpg" title="Photo Galleries" tw="rounded-xl border border-green-300 bg-green-500 p-2 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg relative overflow-hidden" />
          ) : null }
          { isFeatureEnabled("threads") ? (
            threadsColSpan ? (
              <div className="sm:col-span-2">
                <MainLinkCard isLoggedIn={ memberKeyDetails.isLoggedIn } href="/threads" src="/images/family-threads-wide.jpg" title="Family Threads" tw="rounded-xl border border-fuchsia-300 bg-fuchsia-500 p-2 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg relative overflow-hidden" />
              </div>
            ) : (
              <MainLinkCard isLoggedIn={ memberKeyDetails.isLoggedIn } href="/threads" src="/images/family-threads-wide.jpg" title="Family Threads" tw="rounded-xl border border-fuchsia-300 bg-fuchsia-500 p-2 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg relative overflow-hidden" />
            )
          ) : null }
        </div>
      </section>
    </div>
  );
};
