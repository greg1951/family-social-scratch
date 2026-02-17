import LogoutButton from "@/app/(auth)/(logged-in)/auth-components"
import { getSessionEmail } from "@/features/auth/services/auth-utils";
import Link from "next/link"
import { redirect } from "next/navigation";

export default async function LoggedInLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSessionEmail();
  if (!session.found) {
    redirect('/login');
  }

  return (
    <>
      <div className="min-h-screen flex flex-col drop-shadow-lg">
        <nav className="bg-gray-200 flex justify-between p-4 items-center">
          <ul className="flex flex-row space-x-4">
            <li>
              <Link href="/my-account">My Account</Link>
            </li>
            <li>
              <Link href="/change-password">Change Password</Link>
            </li>
          </ul>
          <main className="flex items-center">
            <div className="p-2">
              <p>{ session.userEmail }</p>
            </div>
            <div className="p-2">
              <LogoutButton />
            </div>
          </main>
        </nav>
        <div className="flex-1 flex justify-center items-center ">
          { children }
        </div>
      </div>
    </>
  )
}