import Link from "next/link";
import NavBar from "./nav-bar";
import { getSessionEmail } from "@/features/auth/services/auth-utils";

export default async function MainHeader() {
  const session = await getSessionEmail();
  let email;
  if (session.found) {
    console.log('MainHeader->session: ', session);
    email = session.userEmail;
  }

  return (
    <>

      <header className=" font-app bg-[#59cdf7] flex justify-between align-middle h-[80] md:h-[100]">
        <Link href="/" className="flex justify-between">
          <div className="h-10 w-10 pt-[15] md:h-15 md:w-15 md:pt[5]">
            <img src="images/family-social-icon-only.png" alt="Family Social Icon" />
          </div>
        </Link>

        <div className="flex justify-center">
          <nav className="font-app">
            <ul className="flex absolute pt-[40] md:pt-[25] left-[65] md:left-[250] space-x-3 md:space-x-5">
              <NavBar href="/tv-junkies" src="icons/tv.png" />
              <NavBar href="/movie-maniacs" src="icons/movies.png" />
              <NavBar href="/book-besties" src="icons/book.png" />
              <NavBar href="/poetry-cafe" src="icons/poetry.png" />
              <NavBar href="/family-foodies" src="icons/food.png" />
              <NavBar href="/mx-train" src="icons/games.png" />
              <NavBar href="/family-threads" src="icons/family.png" />
            </ul>
            <main className="flex justify-end align-middle gap-x-1">
              <div className="pt-[15] md:pt-[30]">
                <p className="font-app font-extralight text-xs md:text-base">{ email }</p>
              </div>
              <div className="pt-[1] md:pt-[5]">
                <Link href="/my-account" className="flex justify-between">
                  <div className="h-4 w-4 pt-[15] md:h-10 md:w-10 md:pt[5]">
                    <img src="icons/account.png" alt="account" />
                  </div>
                </Link>
              </div>
            </main>
          </nav>
        </div>

      </header >
      <div className="p-1"></div>
    </>
  )
}