import MainHeader from "@/features/main/components/main-header";
import { Card } from "../ui/card";
import Image from "next/image";
import leftImg1 from "@/public/images/tv-junkies-tablet.png";
import leftImg2 from "@/public/images/movies-maniacs-tablet.png";
import leftImg3 from "@/public/images/book-besties-tablet.png";
import leftImg4 from "@/public/images/family-foodies-tablet.png";
import leftImg5 from "@/public/images/poetry-cafe-tablet.png";
import leftImg6 from "@/public/images/mx-train-tablet.png";
import leftImg7 from "@/public/images/family-threads-tablet.png";
import infoImg from "@/public/icons/investigation.png";
import Link from "next/link";
import { getSessionEmail } from "@/features/auth/services/auth-utils";

export default async function MainTablet() {
  // const session = await getSessionEmail();
  // if (!session.found) {
  //   console.log('MainTablet->session: ', session);
  // }

  return (
    <>
      <MainHeader />
      <section className="flex align-middle font-app">
        <div className="grid sm:grid-cols-2 gap-x-1 gap-y-1">
          <Link href="/tv-junkies" >
            {/* {/* <Card className="bg-red-500 rounded-lg shadow-xl h-[190] pt-[17] md:h-[300] md:pt-[22]"> */ }
            <Card className="bg-red-500 rounded-lg p-2 shadow-xl relative">
              <img src="images/tv-junkies-tablet.png" alt="TV Junkies" className="aspect-auto w-full object-cover" />
              {/* <img src="images/tv-junkies-tablet.png" alt="TV Junkies" className="absolute h-full w-full object-cover" /> */ }
            </Card>
          </Link>
          <Card className="bg-orange-500 rounded-lg p-1 aspect-auto w-full object-cover">
            <p className="text-xs md:text-1xl text-center leading-snug ">
              <span className="text-[#002400] font-app ">
                Post pictures, announcements, TV show, movie, book reviews and
                much more,&nbsp;&nbsp;with your family members, right here, in one
                place,{ " " } your very own Family Social website.
              </span>
            </p>
            <div className=" flex justify-center items-baseline-last">
              <div className="bg-orange-500 flex items-center">
                <Image src={ infoImg } alt="More Information" height={ 50 } width={ 50 } />
              </div>
              <div className="bg-orange-500 flex items-center p-1 md:p-5">
                <div className="text-xs md:text-1xl leading-snug">
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
