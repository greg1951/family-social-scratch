import NavBar from "@/components/common/nav-bar";
import HeaderImage from "@/components/common/header-img";
import MainDropMenu from "@/components/common/main-dropmenu";
import { getMemberPageDetails } from "@/features/family/services/family-services";

export default async function LoggedInLayout({
  children,
}: {
  children: React.ReactNode
}) {

  const memberKeyDetails = await getMemberPageDetails();

  return (
    <>
      <div className="font-app min-h-screen flex flex-col">
        <header className=" font-app font-extrabold bg-[#59cdf7] flex justify-between align-middle h-[80] md:h-[100]">
          <HeaderImage href="/" src="images/family-social-icon-only.png" title="Family Social Home" tw="h-10 w-10 pt-[15] md:h-15 md:w-15 md:pt[5]" />

          <nav className="flex justify-center">
            <div className="text-amber-800 font-extrabold text-center text-xs md:text-base">
              <ul className="flex absolute pt-[25] md:pt[15] left-[70] md:left-[100] space-x-5 md:space-x-5 ">
                {/* <NavBar isLoggedIn={ memberKeyDetails.isLoggedIn } href="/my-account" src="icons/account.png" title="My Account" /> */ }
                <NavBar isLoggedIn={ memberKeyDetails.isLoggedIn } href="/change-password" src="icons/change-password.png" title="Change Password" />
                <NavBar isLoggedIn={ memberKeyDetails.isLoggedIn } href="/two-factor-auth-form" src="icons/mfa.png" title="Update 2FA" />
              </ul>

            </div>
            <main className="flex justify-end items-center">
              <div className="pb-5 p-5">
                <MainDropMenu firstName={ memberKeyDetails.firstName } email={ memberKeyDetails.email } sessionFound={ memberKeyDetails.isLoggedIn } isFounder={ memberKeyDetails.isFounder } />
              </div>
            </main>
          </nav>
        </header>

        <div className="flex-1 flex justify-center items-center ">
          { children }
        </div>
      </div>
    </>
  );
}