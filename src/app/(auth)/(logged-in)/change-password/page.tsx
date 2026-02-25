import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import ChangePasswordForm from "./change-password-form";
import { redirect } from "next/navigation";
import { getSessionEmail } from "@/features/auth/services/auth-utils";

export default async function ChangePassword() {

  const session = await getSessionEmail();
  if (!session.found) {
    redirect('/login');
  }
  const userEmail = session.userEmail as string;

  return (
    <main className="font-app flex justify-center items-center h-2/12 w-max">
      <Card className=" gap-y-2 w-max">
        <CardHeader className=" text-base bg-blue-300 rounded-2xl pt-2 text-center p-2">
          <CardTitle>Change Password</CardTitle>
          <CardDescription className="text-xs">Enter current password, new password and new password confirmation below.</CardDescription>
        </CardHeader>
        <CardContent >
          <ChangePasswordForm userEmail={ userEmail } />
        </CardContent>
      </Card>
    </main>
  )
}