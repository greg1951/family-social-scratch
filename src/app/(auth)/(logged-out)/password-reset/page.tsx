import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ResetPasswordForm from "./reset-password-form";

export default function ResetPassword() {
  return (
    <div className="flex justify-center">
      <main className="font-app h-[80vh]">
        <Card className="flex align-middle w-[300] md:w-[500]">
          <CardHeader className="text-base md:text-2xl bg-[#59cdf7] rounded-2xl text-center gap-y-0 p-2">
            <CardTitle className="text-center font-bold size-1.2 pt-0">Reset Password</CardTitle>
          </CardHeader>
          <CardDescription className="text-xs">
            Enter your email address below to reset your password. { " " }
            You will be sent an email that will be valid for one hour. { " " }
            Click on the link in the email to reset your password.
          </CardDescription>
          <CardContent>
            <ResetPasswordForm />
          </CardContent>
        </Card>
      </main>
    </div >
  )
}