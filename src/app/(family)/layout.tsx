import { getSessionEmail } from "@/features/auth/services/auth-utils";
import Link from "next/link"
import { redirect } from "next/navigation";
import NavBar from "@/components/common/nav-bar";
import HeaderImage from "@/components/common/header-img";
import MainDropMenu from "@/components/common/main-dropmenu";

export default async function TrialLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let userEmail: string = "";
  let isLoggedIn: boolean = false;
  const session = await getSessionEmail();
  if (session.found) {
    console.log("TrialLayout->session: ", session.userEmail);
    userEmail = session.userEmail as string;
    isLoggedIn = true;
  }

  return (
    <>
      <div className="font-app min-h-screen flex flex-col">
        <header className=" font-app font-extrabold bg-[#59cdf7] flex justify-between align-middle h-[80] md:h-[100]">
          <HeaderImage href="/" src="images/family-social-icon-only.png" title="Family Social Home" tw=" h-10 w-10 pt-[15] md:h-15 md:w-15 md:pt[5]" />

          {/* <Link href="/" className="flex justify-between">
            <div className="h-10 w-10 pt-[15] md:h-15 md:w-15 md:pt[5]">
              <img src="images/family-social-icon-only.png" alt="Family Social Icon" />
            </div> */}
          <nav className="flex justify-center">
            <div className="text-amber-800 font-extrabold text-center text-xs md:text-base">
              <ul className="flex absolute pt-[25] md:pt[15] left-[70] md:left-[100] space-x-5 md:space-x-5 ">
                <NavBar isLoggedIn={ isLoggedIn } href="/family-home" src="icons/free-trial.png" title="Family Account Home" />
              </ul>

            </div>
            <main className="flex justify-end items-center">
              { isLoggedIn ? (
                <div className="pb-0 pr-5">
                  <p className="font-extralight text-xs md:text-base">{ session.userEmail }</p>
                </div>)
                : (
                  <div></div>
                ) }
              <div className="pb-5 p-5">
                <MainDropMenu sessionFound={ isLoggedIn } />
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