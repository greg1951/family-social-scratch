import MainHeader from "@/app/(main)/main-header";
import { Card } from "../../components/ui/card";
import Link from "next/link";
import { auth } from "@/auth";
import MainLinkCard from "../../components/common/main-link-card";
import Image from "next/image";
import { getMemberDetailsByEmail } from "@/components/db/sql/queries-family-member";
import { getMemberPageDetails } from "@/features/family/services/family-services";

export default async function MainPage() {
  const memberKeyDetails = await getMemberPageDetails();
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
                <div className="rounded-full bg-white/80 p-2 shadow-sm">
                  <Image
                    src="/icons/investigation.png"
                    alt="More Information"
                    width={ 56 }
                    height={ 56 }
                    className="h-10 w-10 object-contain md:h-14 md:w-14"
                  />
                </div>
                <div>
                  <p className="text-base font-extrabold text-slate-800 md:text-lg">{ title }</p>
                  <p className="text-xs text-slate-600 md:text-sm">Choose a channel below or learn more first.</p>
                </div>
              </div>

              <div className="grid w-full grid-cols-1 gap-2 text-sm md:w-auto md:grid-cols-3">
                <Link
                  href="/help/about-family-social"
                  className="rounded-lg border border-[#59cdf7] bg-white px-3 py-2 text-center font-semibold text-[#005472] transition hover:bg-[#e6f8ff]"
                >
                  What is Family Social?
                </Link>
                { memberKeyDetails.isFounder ? (
                  <Link
                    href="/family-account"
                    className="rounded-lg border border-[#59cdf7] bg-white px-3 py-2 text-center font-semibold text-[#005472] transition hover:bg-[#e6f8ff]"
                  >
                    My Family Account
                  </Link>
                ) : (
                  <Link
                    href="/family-home"
                    className="rounded-lg border border-[#59cdf7] bg-white px-3 py-2 text-center font-semibold text-[#005472] transition hover:bg-[#e6f8ff]"
                  >
                    Start a Family!
                  </Link>

                ) }
                <Link
                  href="/help-subscribe"
                  className="rounded-lg border border-[#59cdf7] bg-white px-3 py-2 text-center font-semibold text-[#005472] transition hover:bg-[#e6f8ff]"
                >
                  Our Reasonable Subscriptions
                </Link>
              </div>
            </div>

            { !memberKeyDetails.isLoggedIn && (
              <p className="mt-3 text-center text-xs text-slate-600 md:text-left">
                Sign in to open channels directly from this page.
              </p>
            ) }
          </Card>

          <MainLinkCard isLoggedIn={ memberKeyDetails.isLoggedIn } href="/tv-junkies" src="images/tv-junkies-tablet.png" title="TV Junkies" tw="rounded-xl border border-red-300 bg-red-500 p-2 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg relative overflow-hidden" />
          <MainLinkCard isLoggedIn={ memberKeyDetails.isLoggedIn } href="/movie-maniacs" src="images/movies-maniacs-tablet.png" title="Movie Maniacs" tw="rounded-xl border border-yellow-300 bg-yellow-500 p-2 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg relative overflow-hidden" />
          <MainLinkCard isLoggedIn={ memberKeyDetails.isLoggedIn } href="/book-besties" src="images/book-besties-tablet.png" title="Book Besties" tw="rounded-xl border border-blue-300 bg-blue-500 p-2 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg relative overflow-hidden" />
          <MainLinkCard isLoggedIn={ memberKeyDetails.isLoggedIn } href="/family-foodies" src="images/family-foodies-tablet.png" title="Family Foodies" tw="rounded-xl border border-green-300 bg-green-500 p-2 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg relative overflow-hidden" />
          <MainLinkCard isLoggedIn={ memberKeyDetails.isLoggedIn } href="/poetry-cafe" src="images/poetry-cafe-tablet.png" title="Poetry Cafe" tw="rounded-xl border border-cyan-300 bg-cyan-500 p-2 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg relative overflow-hidden" />
          <MainLinkCard isLoggedIn={ memberKeyDetails.isLoggedIn } href="/mx-train" src="images/mx-train-tablet.png" title="MX Train" tw="rounded-xl border border-amber-300 bg-amber-500 p-2 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg relative overflow-hidden" />
          <MainLinkCard isLoggedIn={ memberKeyDetails.isLoggedIn } href="/family-threads" src="images/family-threads-tablet.png" title="Family Threads" tw="rounded-xl border border-fuchsia-300 bg-fuchsia-500 p-2 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg relative overflow-hidden" />
        </div>
      </section>
    </div>
  );
};
