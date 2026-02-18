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

export function MainTablet() {

  return (
    <>
      <MainHeader />
      <section className="flex align-middle font-app">
        <div className="grid sm:grid-cols-2 gap-x-1 gap-y-2">
          <Card className="bg-red-500 rounded-lg shadow-xl min-h-50">
            <Image src={ leftImg1 } alt="TV Junkies" height={ 500 } />
          </Card>
          <Card className="bg-orange-500 rounded-lg ">
            <p className="text-center leading-snug">
              <span className="text-[#002400] font-app ">
                Post pictures, announcements, TV show, movie, book reviews and
                much more,&nbsp;&nbsp;with your family members, right here, in one
                place,{ " " } your very own Family Social website.
              </span>
            </p>
            <div className=" flex justify-center items-center p-3">
              <div className="bg-orange-500 flex items-center">
                <Image src={ infoImg } alt="More Information" height={ 50 } width={ 50 } />
              </div>
              <div className="bg-orange-500 flex items-center p-3">
                <div className="leading-snug">
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
          <Card className="bg-yellow-500 rounded-lg shadow min-h-50">
            <Image src={ leftImg2 } alt="Movie Maniacs" height={ 400 } />
          </Card>
          <Card className="bg-blue-500 rounded-lg shadow min-h-50">
            <Image src={ leftImg3 } alt="Book Besties" height={ 400 } />
          </Card>
          <Card className="bg-green-500 rounded-lg shadow min-h-50">
            <Image src={ leftImg4 } alt="Family Foodies" height={ 400 } />
          </Card>
          <Card className="bg-cyan-500 rounded-lg shadow min-h-50">
            <Image src={ leftImg5 } alt="Poetry Cafe" height={ 400 } />
          </Card>
          <Card className="bg-amber-500 rounded-lg shadow min-h-50">
            <Image src={ leftImg6 } alt="MX Train" height={ 400 } />
          </Card>
          <Card className="bg-fuchsia-500 rounded-lg shadow min-h-50">
            <Image src={ leftImg7 } alt="Family Threads" height={ 308 } width={ 700 } />
          </Card>
        </div>
      </section>
    </>
  );
};
