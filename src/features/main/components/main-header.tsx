import Link from "next/link";
import Image from "next/image";
import logoImg from "@/public/images/family-social-icon-only.png";
import burgerImg from "@/public/icons/hamburger.png";
import NavLink from "./nav-link";

export default function MainHeader() {
  return (
    <>

      <header className="flex justify-between align-middle h-[70px] bg-[#59cdf7]">
        <Link href="/" className="flex justify-between">
          <div className="min-[70] max-[70]">
            <Image src={ logoImg } alt="Family Social Icon" width={ 70 } height={ 70 } />
          </div>
        </Link>

        <nav className="font-bold">
          <ul className="flex absolute top-[20] left-[100] space-x-5">
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
              Train
            </NavLink>
            <NavLink href="/family-threads">
              Threads
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