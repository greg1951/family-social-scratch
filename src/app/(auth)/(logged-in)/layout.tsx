import LogoutButton from "@/app/(auth)/(logged-in)/auth-components"
import { getSessionEmail } from "@/features/auth/services/auth-utils";
import Link from "next/link"
import { redirect } from "next/navigation";
import Image from "next/image";
import logoImg from "@/public/images/family-social-icon-only.png";

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
      <div className="min-h-screen flex flex-col drop-shadow-lg">
        <header className=" font-app bg-[#59cdf7] flex justify-between align-middle h-[80] md:h-[100]">
          <Link href="/" className="flex justify-between">
            <div className="h-10 w-10 pt-[20] md:h-15 md:w-15 md:pt[0]">
              <img src="images/family-social-icon-only.png" alt="Family Social Icon" />
            </div>
          </Link>
          <nav className="flex justify-center">
            <div className="text-amber-800 text-center text-xs md:text-base">
              <ul className="flex absolute pt-[45] md:pt[15] left-[60] md:left-[100] space-x-2 lg:space-x-5 font-extrabold">
                <li>
                  <Link href="/my-account">My Account</Link>
                </li>
                <li>
                  <Link href="/change-password">Change Password</Link>
                </li>
              </ul>

            </div>
            <main className="flex items-center pt-0">
              <div className="pt-[15] md:pt-[10] p-1">
                <p className="text-xs md:text-base">{ session.userEmail }</p>
              </div>
              <div className="pt-0 h-5 w-20 ">
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