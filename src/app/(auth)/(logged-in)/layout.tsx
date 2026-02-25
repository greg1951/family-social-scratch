import LogoutButton from "@/app/(auth)/(logged-in)/auth-components"
import { getSessionEmail } from "@/features/auth/services/auth-utils";
import Link from "next/link"
import { redirect } from "next/navigation";
import Image from "next/image";
import logoImg from "@/public/images/family-social-icon-only.png";
import NavBar from "@/components/common/nav-bar";
import HeaderImage from "@/components/common/header-img";

export default async function LoggedInLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSessionEmail();
  // console.log("LoggedInLayout->session: ", session);

  if (!session.found) {
    redirect('/login');
  }

  return (
    <>
      <div className="font-app min-h-screen flex flex-col">
        <header className=" font-app font-extrabold bg-[#59cdf7] flex justify-between align-middle h-[70] md:h-[100]">
          <HeaderImage href="/" src="images/family-social-icon-only.png" title="Family Social Home" tw="h-10 w-10 pt-[15] md:h-15 md:w-15 md:pt[5]" />

          {/* <Link href="/" className="flex justify-between">
            <div className="h-10 w-10 pt-[15] md:h-15 md:w-15 md:pt[5]">
              <img src="images/family-social-icon-only.png" alt="Family Social Icon" />
            </div> */}
          <nav className="flex justify-center">
            <div className="text-amber-800 font-extrabold text-center text-xs md:text-base">
              <ul className="flex absolute pt-[25] md:pt[15] left-[70] md:left-[100] space-x-5 md:space-x-5 ">
                <NavBar href="/my-account" src="icons/account.png" title="My Account" />
                <NavBar href="/change-password" src="icons/change-password.png" title="Change Password" />
              </ul>

            </div>
            <main className="flex justify-end items-center">
              <div className="pb-0">
                <p className="font-extralight text-xs md:text-base">{ session.userEmail }</p>
              </div>
              <div className="pb-5 p-5">
                <LogoutButton />
              </div>
            </main>
          </nav>
        </header>

        <div className="flex-1 flex justify-center items-center ">
          { children }
        </div>
      </div>
    </>
  )
}