import Link from "next/link";
import Image from "next/image";
import logoImg from "images/family-social-icon-only.png";
import burgerImg from "icons/hamburger.png";
import NavLink from "./nav-link";
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
          <div className="h-10 w-10 pt-[20] md:h-15 md:w-15 md:pt[0]">
            <img src="images/family-social-icon-only.png" alt="Family Social Icon" />
          </div>
        </Link>

        <div className="flex justify-center">
          <nav className=" font-app">
            <ul className="flex absolute pt-[45] md:pt[15] left-[60] md:left-[100] space-x-2 lg:space-x-5 font-extrabold">
              <NavLink href="/tv-junkies">
                TV
              </NavLink>
              <NavLink href="/movie-maniacs">
                Movies
              </NavLink>
              <NavLink href="/book-besties">
                Books
              </NavLink>
              <NavLink href="/family-foodies">
                Foodies
              </NavLink>
              <NavLink href="/poetry-cafe">
                Poetry
              </NavLink>
              <NavLink href="/mx-train">
                Games
              </NavLink>
              <NavLink href="/family-threads">
                Threads
              </NavLink>
            </ul>
            <main className="flex justify-end align-middle">
              <div className="pt-[19] md:pt-[30]">
                <p className="text-xs md:text-base">{ email }</p>
              </div>
              <div className="pt-[5]">
                <Link href="/my-account" className="flex justify-between">
                  <div className="h-5 w-5 pt-[15] md:h-10 md:w-10 md:pt[5]">
                    <img src="icons/hamburger.png" alt="account" />
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