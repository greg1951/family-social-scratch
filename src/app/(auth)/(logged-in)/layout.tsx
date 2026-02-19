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
        <header className="flex justify-between align-middle h-[90px] font-app bg-[#59cdf7]">
          <Link href="/" className="flex justify-between">
            <div className="min-[70] max-[70]">
              <Image src={ logoImg } alt="Family Social Icon" width={ 90 } height={ 90 } />
            </div>
          </Link>
          <nav className="flex items-center">
            <div>
              <ul className="flex absolute top-[27] left-[100] space-x-5">
                <li>
                  <Link href="/my-account">My Account</Link>
                </li>
                <li>
                  <Link href="/change-password">Change Password</Link>
                </li>
              </ul>

            </div>
            <main className="flex items-center">
              <div className="p-2">
                <p>{ session.userEmail }</p>
              </div>
              <div className="p-2">
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