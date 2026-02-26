import Link from "next/link";
import NavBar from "@/components/common/nav-bar";
import { getSessionEmail } from "@/features/auth/services/auth-utils";
import HeaderImage from "@/components/common/header-img";

export default async function MainHeader({ isLoggedIn }: { isLoggedIn: boolean }) {
  const session = await getSessionEmail();
  let email;
  if (session.found) {
    console.log('MainHeader->session: ', session);
    email = session.userEmail;
  }

  return (
    <>

      <header className=" font-app rounded font-extrabold bg-[#59cdf7] flex justify-between align-middle h-[80] md:h-[100]">
        <HeaderImage href="/my-account" src="images/family-social-icon-only.png" title="Family Social Home" tw="h-10 w-10 pt-[15] md:h-15 md:w-15 md:pt[5]" />

        <div className="flex justify-center ">
          <nav className="font-app font-extrabold text-xs md:text-base w-max-[100vh]">
            <ul className="flex absolute pt-[30] md:pt-[25] left-[65] md:left-[250] space-x-2 md:space-x-5">
              <NavBar isLoggedIn={ isLoggedIn } href="/tv-junkies" src="icons/tv.png" title="TV Junkies" />
              <NavBar isLoggedIn={ isLoggedIn } href="/movie-maniacs" src="icons/movies.png" title="Movie Maniacs" />
              <NavBar isLoggedIn={ isLoggedIn } href="/book-besties" src="icons/book.png" title="Book Besties" />
              <NavBar isLoggedIn={ isLoggedIn } href="/poetry-cafe" src="icons/poetry.png" title="Poetry Cafe" />
              <NavBar isLoggedIn={ isLoggedIn } href="/family-foodies" src="icons/food.png" title="Family Foodies" />
              <NavBar isLoggedIn={ isLoggedIn } href="/mx-train" src="icons/games.png" title="MX Train" />
              <NavBar isLoggedIn={ isLoggedIn } href="/family-threads" src="icons/family.png" title="Family Threads" />
            </ul>
            <main className="flex pr-8 items-center gap-x-2 pt-5">
              <div>
                <p className="font-app font-extralight text-xs md:text-base">{ email }</p>
              </div>
              <HeaderImage href="/my-account" src="icons/account.png" title="My Account" tw="h-4 w-4 pb-0 md:h-10 md:w-10" />
              {/* <div className="pt-[1] md:pt-[5]">
                <Link href="/my-account" className="flex justify-between">
                  <div className="h-4 w-4 pt-[15] md:h-10 md:w-10 md:pt[5]">
                    <img src="icons/account.png" alt="account" title="My Account" className='transition-transform duration-300 transform hover:scale-150' />
                  </div>
                </Link>
              </div> */}
            </main>
          </nav>
        </div>

      </header >
      <div className="p-1"></div>
    </>
  )
}