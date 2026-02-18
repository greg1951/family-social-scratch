import Link from "next/link";
import Image from "next/image";
import logoImg from "@/public/images/family-social-icon-only.png";
import burgerImg from "@/public/icons/hamburger.png";
import NavLink from "./nav-link";

export default function MainHeader() {
  return (
    <>

      <header className="flex justify-between align-middle h-[90px] font-app bg-[#59cdf7]">
        <Link href="/" className="flex justify-between">
          <div className="min-[70] max-[70]">
            <Image src={ logoImg } alt="Family Social Icon" width={ 90 } height={ 90 } />
          </div>
        </Link>

        <nav className=" font-app font-extrabold">
          <ul className="flex absolute top-[27] left-[100] space-x-5">
            <NavLink href="/tv-junkies">
              TV Junkies
            </NavLink>
            <NavLink href="/movie-maniacs">
              Movie Maniacs
            </NavLink>
            <NavLink href="/book-besties">
              Book Besties
            </NavLink>
            <NavLink href="/family-foodies">
              Family Foodies
            </NavLink>
            <NavLink href="/poetry-cafe">
              Poetry Club
            </NavLink>
            <NavLink href="/mx-train">
              MX Train
            </NavLink>
            <NavLink href="/family-threads">
              Family Threads
            </NavLink>
          </ul>
        </nav>

        <div className="flex align-middle">
          <Image width={ 50 } height={ 50 }
            src={ burgerImg }
            alt="Hamburger"
          />
        </div>
      </header >
      <div className="p-1"></div>
    </>
  )
}