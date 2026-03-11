import { getSessionEmail } from "@/features/auth/services/auth-utils";
import Link from "next/link"
import { redirect } from "next/navigation";
import NavBar from "@/components/common/nav-bar";
import HeaderImage from "@/components/common/header-img";
import MainDropMenu from "@/components/common/main-dropmenu";
import { getMemberDetailsByEmail } from "@/components/db/sql/queries-family-member";

export default async function TrialLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let email: string = "";
  let isLoggedIn: boolean = false;
  let isFounder: boolean = false;
  let firstName: string = "";
  const session = await getSessionEmail();
  if (session.found) {
    email = session.userEmail as string;
    const memberDetails = await getMemberDetailsByEmail(email);
    if (memberDetails.success && memberDetails.isFounder) {
      isFounder = true;
      firstName = memberDetails.firstName!;
    }
  }

  return (
    <>
      <div className="font-app min-h-screen flex flex-col">
        <header className=" font-app font-extrabold bg-[#59cdf7] flex justify-between align-middle h-[80] md:h-[100]">
          <HeaderImage href="/" src="images/family-social-icon-only.png" title="Family Social Home" tw=" h-10 w-10 pt-[15] md:h-15 md:w-15 md:pt[5]" />
          <nav className="flex justify-center">
            <div className="text-amber-800 font-extrabold text-center text-xs md:text-base">
              <ul className="flex absolute pt-[25] md:pt[15] left-[70] md:left-[100] space-x-5 md:space-x-5 ">
                <NavBar isLoggedIn={ isLoggedIn } href="/family-home" src="icons/free-trial.png" title="Family Account Home" />
              </ul>

            </div>
            <main className="flex justify-end items-center">
              <div className="pb-5 p-5">
                <MainDropMenu firstName={ firstName } email={ email } sessionFound={ session.found } isFounder={ isFounder } />
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