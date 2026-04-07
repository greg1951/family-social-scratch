import MainHeader from "@/app/(main)/main-header";
import { Card } from "../../components/ui/card";
import Link from "next/link";
import MainLinkCard from "../../components/common/main-link-card";
import { getMemberPageDetails } from "@/features/family/services/family-services";
import PublicHelpMenu from "@/components/common/public-help-menu";

export default async function MainPage() {
  const memberKeyDetails = await getMemberPageDetails();
  const whatsNewItems = [
    "Family Threads, TV Junkies, Family Foodies, Movie Maniacs, and Music Lovers home pages are available. Check them out!",
    "A new member was suggested to be invited to our family. Keep an eye out for them.",
    "Stay tuned to this channel for future updates. 👍",
  ];
  const ctaCardClasses = [
    "group relative rounded-xl border border-sky-300/80 bg-linear-to-b from-white via-sky-50 to-cyan-50",
    "px-4 py-2.5 text-center text-[13px] font-bold tracking-[0.01em] text-sky-900",
    "shadow-[0_6px_14px_rgba(3,79,112,0.14)] transition-all duration-300",
    "hover:-translate-y-0.5 hover:border-sky-400 hover:from-sky-50 hover:to-white hover:shadow-[0_10px_20px_rgba(3,79,112,0.22)]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70"
  ].join(" ");

  let title: string = "Welcome to Family Social!";
  if (memberKeyDetails.isLoggedIn) {
    title = `Welcome back, ${ memberKeyDetails.firstName }!`;
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 to-white">
      <MainHeader isLoggedIn={ memberKeyDetails.isLoggedIn } isFounder={ memberKeyDetails.isFounder } firstName={ memberKeyDetails.firstName } />

      <section className="font-app px-2 pb-3 md:px-4 md:pb-4">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-2 sm:grid-cols-2 md:gap-3">
          <Card className="sm:col-span-2 rounded-xl border border-slate-200 bg-linear-to-r from-[#d8f4ff] to-[#eef9ff] p-3 shadow-sm md:p-4">
            <div className="flex flex-col items-center justify-between gap-3 md:flex-row md:items-start">
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-base font-extrabold text-slate-800 md:text-lg">{ title }</p>
                  <p className="text-xs text-slate-600 md:text-sm">Choose a channel below or learn more first.</p>
                </div>
              </div>

              <div className="grid w-full grid-cols-1 gap-2 text-sm md:w-auto md:grid-cols-3 pt-2">
                { memberKeyDetails.isFounder && (
                  <>
                    <Link
                      href="/family-founder-account"
                      className={ ctaCardClasses }
                    >
                      My Family Account
                    </Link>
                    <Link
                      href="/family-member-dashboard"
                      className={ ctaCardClasses }
                    >
                      Family Dashboard
                    </Link>
                    <Link
                      href="/help-subscribe"
                      className={ ctaCardClasses }
                    >
                      Our Reasonable Subscriptions
                    </Link>
                  </>
                ) }
                { memberKeyDetails.isLoggedIn && !memberKeyDetails.isFounder && (
                  <>
                    <Link
                      href="/family-member-account"
                      className={ ctaCardClasses }
                    >
                      My Account
                    </Link>
                    <Link
                      href="/family-member-dashboard"
                      className={ ctaCardClasses }
                    >
                      Family Dashboard
                    </Link>
                  </>
                ) }
                { !memberKeyDetails.isLoggedIn && (
                  <>
                    <Link
                      href="/help/about-family-social"
                      className={ ctaCardClasses }
                    >
                      What is Family Social?
                    </Link>
                    <Link
                      href="/family-setup-home"
                      className={ ctaCardClasses }
                    >
                      Start a Family!
                    </Link>

                  </>
                ) }
              </div>
              <div className="flex items-start justify-end md:pt-1 md:self-start">
                <PublicHelpMenu />
              </div>
            </div>
          </Card>

          { memberKeyDetails.isLoggedIn && (
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

                <div className="shrink-0">
                  <Link
                    href="/whats-new"
                    className="inline-flex items-center rounded-full border border-[#bdb0f1] bg-white px-4 py-2 text-sm font-bold text-[#5b4b9a] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#f7f3ff]"
                  >
                    View All Updates
                  </Link>
                </div>
              </div>
            </Card>
          ) }

          <MainLinkCard isLoggedIn={ memberKeyDetails.isLoggedIn } href="/tv" src="/images/tv-junkies-tablet.png" title="TV Junkies" tw="rounded-xl border border-red-300 bg-red-500 p-2 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg relative overflow-hidden" />
          <MainLinkCard isLoggedIn={ memberKeyDetails.isLoggedIn } href="/movies" src="/images/movies-maniacs-tablet.png" title="Movie Maniacs" tw="rounded-xl border border-yellow-300 bg-yellow-500 p-2 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg relative overflow-hidden" />
          <MainLinkCard isLoggedIn={ memberKeyDetails.isLoggedIn } href="/books" src="/images/book-besties-tablet.png" title="Book Besties" tw="rounded-xl border border-blue-300 bg-blue-500 p-2 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg relative overflow-hidden" />
          <MainLinkCard isLoggedIn={ memberKeyDetails.isLoggedIn } href="/foodies" src="/images/family-foodies-tablet.png" title="Family Foodies" tw="rounded-xl border border-green-300 bg-green-500 p-2 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg relative overflow-hidden" />
          <MainLinkCard isLoggedIn={ memberKeyDetails.isLoggedIn } href="/music" src="/images/music-lovers-tablet.png" title="Music Lovers" tw="rounded-xl border border-pink-300 bg-pink-500 p-2 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg relative overflow-hidden" />
          <MainLinkCard isLoggedIn={ memberKeyDetails.isLoggedIn } href="/poetry" src="/images/poetry-cafe-tablet.png" title="Poetry Cafe" tw="rounded-xl border border-cyan-300 bg-cyan-500 p-2 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg relative overflow-hidden" />
          <MainLinkCard isLoggedIn={ memberKeyDetails.isLoggedIn } href="/mxtrain" src="/images/mx-train-tablet.png" title="MX Train" tw="rounded-xl border border-amber-300 bg-amber-500 p-2 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg relative overflow-hidden" />
          <MainLinkCard isLoggedIn={ memberKeyDetails.isLoggedIn } href="/threads" src="/images/family-threads-tablet.png" title="Family Threads" tw="rounded-xl border border-fuchsia-300 bg-fuchsia-500 p-2 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg relative overflow-hidden" />
        </div>
      </section>
    </div>
  );
};
