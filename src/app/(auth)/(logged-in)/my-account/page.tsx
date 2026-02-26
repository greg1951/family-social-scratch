import { auth } from "@/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import TwoFactorAuthForm from "./two-factor-auth-form";
import { getUser2fa } from "@/components/db/sql/queries-user";
import { redirect } from "next/navigation";

export default async function MyAccount() {
  const session = await auth();

  if (!session) {
    redirect('/login')
  }

  const email = session?.user?.email as string;
  const familyName = session?.user?.name as string;
  const result2fa = await getUser2fa(email);

  return (
    <main className="font-app h-[80vh]">
      <Card className="flex align-top w-[450]">
        <CardHeader className=" text-base md:text-2xl bg-blue-300 rounded-2xl pt-2 text-center ">
          <CardTitle className="text-center font-bold size-1.2">My Account</CardTitle>
          <CardDescription className="text-xs">Your Account Home</CardDescription>
        </CardHeader>
        <CardContent>
          <TwoFactorAuthForm isActivated={ result2fa.isActivated ?? false } email={ email } />
        </CardContent>
      </Card>
    </main>
  )
}