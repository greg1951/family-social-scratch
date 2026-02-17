import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card className="w-[400]">
      <CardHeader>
        <CardTitle className="text-center font-bold size-1.2">Change Password</CardTitle>
      </CardHeader>
      <CardContent>
        <ChangePasswordForm userEmail={ userEmail } />
      </CardContent>
    </Card>
  )
}