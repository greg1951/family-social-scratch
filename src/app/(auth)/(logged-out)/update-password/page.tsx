import { ShieldCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPasswordToken } from "@/components/db/sql/queries-passwordReset";
import Link from "next/link";

import UpdateResetPasswordForm from "./update-password-form";

export default async function UpdateResetPassword({ searchParams }: {
  searchParams: Promise<{
    token?: string;
  }>
}) {
  const { token } = await searchParams;
  let isValidExpiry;
  let email;

  if (token) {
    const result = await getPasswordToken({ token });
    if (result.error) {
      console.error("Error occurred retrieving passwordToken");
    }

    isValidExpiry = result.isValidExpiry;
    email = result.email;
  }

  return (
    <div className="flex justify-center">
      <main className="font-app h-[80vh]">
        <Card className="flex align-middle w-[300] overflow-hidden border-white/70 bg-white/82 pt-0 shadow-[0_28px_90px_-50px_rgba(16,54,74,0.75)] backdrop-blur md:w-[500]">
          <CardHeader className="rounded-[1.35rem] bg-[linear-gradient(135deg,#dff6ff_0%,#9de4fe_45%,#ffffff_100%)] px-6 pb-5 pt-5 text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-[#005472] shadow-sm">
              <ShieldCheck className="h-3.5 w-3.5" />
              Final Step
            </div>
            <CardTitle className="mt-3 text-center text-2xl font-extrabold text-[#10364a]">Password Reset Update</CardTitle>
          </CardHeader>
          <CardDescription className="px-6 pt-3 text-base font-medium text-center">
            { isValidExpiry
              ? <p className="text-blue-700">{ email }</p>
              : <p className="text-red-700">Your password reset link is invalid or has expired</p>
            }
          </CardDescription>
          <CardContent>
            { isValidExpiry
              ? <UpdateResetPasswordForm userEmail={ email as string } />
              : (
                <div className="text-center text-base text-muted-foreground">
                  <Link href="/password-reset" className="underline">
                    Request another password Reset
                  </Link>
                </div>
              )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}