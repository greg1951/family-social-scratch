import MainHeader from "@/app/(main)/main-header";
import { Card } from "../../components/ui/card";
import Link from "next/link";
import { auth } from "@/auth";
import MainLinkCard from "../../components/common/main-link-card";

export default async function MainTablet() {
  const session = await auth();
  let isLoggedIn: boolean = false;
  if (session)
    isLoggedIn = true;
  // console.log("MainTablet->session: ", session);

  return (
    <>
      <div>
        <MainHeader isLoggedIn={ isLoggedIn } />
        <section className="flex align-middle font-app">
          <div className="grid sm:grid-cols-2 gap-x-1 gap-y-1 w-screen h-screen">
            <Card className="bg-gray-300 rounded-lg aspect-auto w-full object-cover">
              <div className=" flex justify-center items-baseline-last">
                <div className=" flex items-center">
                  <img src="icons/investigation.png" alt="More Information" className="aspect-auto object-cover h-10 w-10 md:h-15 md:w-15 " />
                </div>
                <div className="flex items-center p-1 md:p-5">
                  <div className="text-1xl md:text-2xl leading-snug">
                    <p className="text-center underline">
                      <Link href="/help/about-family-social" className="text-amber-800 text-center">
                        What is Family Social?
                      </Link>
                    </p>
                    <p className="text-center underline">
                      <Link href="/trial-home" className="text-amber-800 text-center">
                        Start a trial!
                      </Link>
                    </p>
                    <p className="text-center underline">
                      <Link href="/help-subscribe" className="text-amber-800 text-center">
                        Our reasonable subscriptions
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            </Card>
            <MainLinkCard isLoggedIn={ isLoggedIn } href="/tv-junkies" src="images/tv-junkies-tablet.png" title="TV Junkies" tw="bg-red-500 rounded-lg p-2 shadow-xl relative" />
            <MainLinkCard isLoggedIn={ isLoggedIn } href="/movie-maniacs" src="images/movies-maniacs-tablet.png" title="Movie Maniacs" tw="bg-yellow-500 rounded-lg p-2 shadow relative" />
            <MainLinkCard isLoggedIn={ isLoggedIn } href="/book-besties" src="images/book-besties-tablet.png" title="Book Besties" tw="bg-blue-500 rounded-lg p-2 shadow relative" />
            <MainLinkCard isLoggedIn={ isLoggedIn } href="/family-foodies" src="images/family-foodies-tablet.png" title="Family Foodies" tw="bg-green-500 rounded-lg p-2 shadow relative" />
            <MainLinkCard isLoggedIn={ isLoggedIn } href="/poetry-cafe" src="images/poetry-cafe-tablet.png" title="Poetry Cafe" tw="bg-cyan-500 rounded-lg p-2 shadow relative" />
            <MainLinkCard isLoggedIn={ isLoggedIn } href="/mx-train" src="images/mx-train-tablet.png" title="MX Train" tw="bg-amber-500 rounded-lg p-2 shadow relative" />
            <MainLinkCard isLoggedIn={ isLoggedIn } href="/family-threads" src="images/family-threads-tablet.png" title="Family Threads" tw="bg-fuchsia-500 rounded-lg p-2 shadow relative" />
            {/* <Link href="/family-threads" >
            <Card className="bg-fuchsia-500 rounded-lg p-2 shadow relative">
              <img src="images/family-threads-tablet.png" alt="Family Threads" className="aspect-auto w-full object-cover" />
            </Card>
          </Link> */}
          </div>
        </section>
      </div>
    </>
  );
};
