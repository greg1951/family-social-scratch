import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import ChangePasswordForm from "./change-password-form";
import { redirect } from "next/navigation";
import { getSessionEmail } from "@/features/auth/services/auth-utils";
import { auth } from "@/auth";

export default async function ChangePassword() {

  const session = await auth();
  if (!session) {
    redirect('/login');
  }
  const name: string = session.user?.name!;
  const email: string = session.user?.email!;

  return (
    <main className="font-app h-[80vh]">
      <Card className=" gap-y-2 w-[300] md:w-[800]">
        <CardHeader className=" text-base bg-[#59cdf7] rounded-2xl pt-2 text-center p-2">
          <CardTitle>Change Password</CardTitle>
          <CardDescription className="text-xs">{ name }</CardDescription>
        </CardHeader>
        <CardDescription className="text-xs text-center">Enter current password, new password and new password confirmation below.</CardDescription>
        <CardContent >
          <ChangePasswordForm userEmail={ email } />
        </CardContent>
      </Card>
    </main>
  )
}