import { auth } from "@/auth";
import { ShieldCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import TwoFactorAuthForm from ".";
import { getUser2fa } from "@/components/db/sql/queries-user";
import { redirect } from "next/navigation";

export default async function MfaChange() {
  const session = await auth();

  if (!session) {
    redirect('/login')
  }

  const email = session?.user?.email as string;
  const result2fa = await getUser2fa(email);

  return (
    <main className="font-app flex justify-center pt-0">
      <Card className="w-full max-w-4xl overflow-hidden border-white/70 bg-white/82 pt-0 shadow-[0_28px_90px_-50px_rgba(16,54,74,0.75)] backdrop-blur">
        <CardHeader className="rounded-[1.35rem] bg-[linear-gradient(135deg,#dff6ff_0%,#9de4fe_45%,#ffffff_100%)] px-6 pb-5 pt-5 text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-[#005472] shadow-sm">
            <ShieldCheck className="h-3.5 w-3.5" />
            Account Security
          </div>
          <CardTitle className="mt-3 text-center text-2xl font-extrabold text-[#10364a]">Two-Factor Authentication</CardTitle>
          <CardDescription className="mt-2 text-sm font-medium text-[#315363]">Signed in as { session.user?.name }</CardDescription>
        </CardHeader>
        <CardDescription className="px-6 pt-3 text-center text-base font-medium text-[#315363]">
          Scan the QR code with your authenticator app, then confirm setup with a six-digit code.
        </CardDescription>
        <CardContent className="px-6 pb-6 pt-5">
          <TwoFactorAuthForm isActivated={ result2fa.isActivated ?? false } email={ email } />
        </CardContent>
      </Card>
    </main>
  )
}