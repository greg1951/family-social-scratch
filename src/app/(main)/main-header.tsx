import Link from "next/link";
import NavBar from "@/components/common/nav-bar";
import { getSessionEmail } from "@/features/auth/services/auth-utils";
import HeaderImage from "@/components/common/header-img";
import MainDropMenu from "../../components/common/main-dropmenu";

export default async function MainHeader({ isLoggedIn, isFounder, firstName }: { isLoggedIn: boolean; isFounder: boolean; firstName: string }) {
  const session = await getSessionEmail();
  let email: string = "";
  if (session.found) {
    email = session.userEmail!;
  }

  return (
    <>

      <header className=" font-app rounded font-extrabold bg-[#59cdf7] flex justify-between align-middle h-[80] md:h-[110]">
        <HeaderImage href="/my-account" src="images/family-social-icon-only.png" title="Family Social Home" />

        <div className="flex justify-center ">
          <nav className="font-app font-extrabold text-xs md:text-base w-max-[100vh]">
            <ul className="flex absolute pt-[30] md:pt-[25] left-[70] md:left-[200] space-x-2 md:space-x-4">
              <NavBar isLoggedIn={ isLoggedIn } href="/tv" src="/icons/tv.png" title="TV Junkies" />
              <NavBar isLoggedIn={ isLoggedIn } href="/movies" src="/icons/movies.png" title="Movie Maniacs" />
              <NavBar isLoggedIn={ isLoggedIn } href="/books" src="/icons/book.png" title="Book Besties" />
              <NavBar isLoggedIn={ isLoggedIn } href="/poetry" src="/icons/poetry.png" title="Poetry Cafe" />
              <NavBar isLoggedIn={ isLoggedIn } href="/foodies" src="/icons/food.png" title="Family Foodies" />
              <NavBar isLoggedIn={ isLoggedIn } href="/mxtrain" src="/icons/games.png" title="MX Train" />
              <NavBar isLoggedIn={ isLoggedIn } href="/threads" src="/icons/family.png" title="Family Threads" />
            </ul>
            <main className="flex pr-6 items-center gap-x-2 gap-y-2 pt-6">
              <div>
                <MainDropMenu firstName={ firstName } email={ email } sessionFound={ session.found } isFounder={ isFounder } />
              </div>
            </main>
          </nav>
        </div>

      </header >
      <div className="p-1"></div>
    </>
  )
}