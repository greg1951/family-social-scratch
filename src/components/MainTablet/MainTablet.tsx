import MainHeader from "@/features/main/components/main-header";
import { Card } from "../ui/card";
import Image from "next/image";
import infoImg from "@/public/icons/investigation.png";
import Link from "next/link";

export default async function MainTablet() {

  return (
    <>
      <MainHeader />
      <section className="flex align-middle font-app">
        <div className="grid sm:grid-cols-2 gap-x-1 gap-y-1">
          <Card className="bg-orange-500 rounded-lg p-1 aspect-auto w-full object-cover">
            <div className=" flex justify-center items-baseline-last">
              <div className="bg-orange-500 flex items-center">
                <Image src={ infoImg } alt="More Information" height={ 50 } width={ 50 } />
              </div>
              <div className="bg-orange-500 flex items-center p-1 md:p-5">
                <div className="text-1xl md:text-2xl leading-snug">
                  <p className="text-center underline">
                    <Link href="/help/about-family-social" className="text-amber-800 text-center">
                      What is Family Social?
                    </Link>
                  </p>
                  <p className="text-center underline">
                    <Link href="/trial" className="text-amber-800 text-center">
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
          <Link href="/tv-junkies" >
            <Card className="bg-red-500 rounded-lg p-2 shadow-xl relative">
              <img src="images/tv-junkies-tablet.png" alt="TV Junkies" className="aspect-auto w-full object-cover" />
            </Card>
          </Link>
          <Link href="/movie-maniacs" >
            <Card className="bg-yellow-500 rounded-lg p-2 shadow relative">
              <img src="images/movies-maniacs-tablet.png" alt="Movie Maniacs" className="aspect-auto w-full object-cover" />
            </Card>
          </Link>
          <Link href="/book-besties" >
            <Card className="bg-blue-500 rounded-lg p-2 shadow relative">
              <img src="images/book-besties-tablet.png" alt="Book Besties" className="aspect-auto w-full object-cover" />
            </Card>
          </Link>
          <Link href="/family-foodies" >
            <Card className="bg-green-500 rounded-lg p-2 shadow relative">
              <img src="images/family-foodies-tablet.png" alt="Family Foodies" className="aspect-auto w-full object-cover" />
            </Card>
          </Link>
          <Link href="/poetry-cafe" >
            <Card className="bg-cyan-500 rounded-lg p-2 shadow relative">
              <img src="images/poetry-cafe-tablet.png" alt="Poetry Cafe" className="aspect-auto w-full object-cover" />
            </Card>
          </Link>
          <Link href="/mx-train" >
            <Card className="bg-amber-500 rounded-lg p-2 shadow relative">
              <img src="images/mx-train-tablet.png" alt="MX Train" className="aspect-auto w-full object-cover" />
            </Card>
          </Link>
          <Link href="/family-threads" >
            <Card className="bg-fuchsia-500 rounded-lg p-2 shadow relative">
              <img src="images/family-threads-tablet.png" alt="Family Threads" className="aspect-auto w-full object-cover" />
            </Card>
          </Link>
        </div>
      </section>
    </>
  );
};
