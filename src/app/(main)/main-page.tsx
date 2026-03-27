import MainHeader from "@/app/(main)/main-header";
import { Card } from "../../components/ui/card";
import Link from "next/link";
import { auth } from "@/auth";
import MainLinkCard from "../../components/common/main-link-card";
import Image from "next/image";
import { getMemberDetailsByEmail } from "@/components/db/sql/queries-family-member";
import { getMemberPageDetails } from "@/features/family/services/family-services";
import PublicHelpMenu from "@/components/common/public-help-menu";

export default async function MainPage() {
  const memberKeyDetails = await getMemberPageDetails();
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
                {/* <div className="rounded-full bg-white/80 p-2 shadow-sm">
                  <Image
                    src="/icons/investigation.png"
                    alt="More Information"
                    width={ 56 }
                    height={ 56 }
                    className="h-10 w-10 object-contain md:h-14 md:w-14"
                  />
                </div> */}
                <div>
                  <p className="text-base font-extrabold text-slate-800 md:text-lg">{ title }</p>
                  <p className="text-xs text-slate-600 md:text-sm">Choose a channel below or learn more first.</p>
                </div>
              </div>

              <div className="grid w-full grid-cols-1 gap-2 text-sm md:w-auto md:grid-cols-3">
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
                      My Dashboard
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

            {/* { !memberKeyDetails.isLoggedIn && (
              <p className="mt-3 text-center text-xs text-slate-600 md:text-left">
                Sign in to open channels directly from this page.
              </p>
            ) } */}
          </Card>

          <MainLinkCard isLoggedIn={ memberKeyDetails.isLoggedIn } href="/tv" src="/images/tv-junkies-tablet.png" title="TV Junkies" tw="rounded-xl border border-red-300 bg-red-500 p-2 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg relative overflow-hidden" />
          <MainLinkCard isLoggedIn={ memberKeyDetails.isLoggedIn } href="/movies" src="/images/movies-maniacs-tablet.png" title="Movie Maniacs" tw="rounded-xl border border-yellow-300 bg-yellow-500 p-2 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg relative overflow-hidden" />
          <MainLinkCard isLoggedIn={ memberKeyDetails.isLoggedIn } href="/books" src="/images/book-besties-tablet.png" title="Book Besties" tw="rounded-xl border border-blue-300 bg-blue-500 p-2 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg relative overflow-hidden" />
          <MainLinkCard isLoggedIn={ memberKeyDetails.isLoggedIn } href="/foodies" src="/images/family-foodies-tablet.png" title="Family Foodies" tw="rounded-xl border border-green-300 bg-green-500 p-2 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg relative overflow-hidden" />
          <MainLinkCard isLoggedIn={ memberKeyDetails.isLoggedIn } href="/poetry" src="/images/poetry-cafe-tablet.png" title="Poetry Cafe" tw="rounded-xl border border-cyan-300 bg-cyan-500 p-2 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg relative overflow-hidden" />
          <MainLinkCard isLoggedIn={ memberKeyDetails.isLoggedIn } href="/mxtrain" src="/images/mx-train-tablet.png" title="MX Train" tw="rounded-xl border border-amber-300 bg-amber-500 p-2 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg relative overflow-hidden" />
          <MainLinkCard isLoggedIn={ memberKeyDetails.isLoggedIn } href="/threads" src="/images/family-threads-tablet.png" title="Family Threads" tw="rounded-xl border border-fuchsia-300 bg-fuchsia-500 p-2 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg relative overflow-hidden" />
        </div>
      </section>
    </div>
  );
};
