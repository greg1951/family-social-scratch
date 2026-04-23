'use client';

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";
import { useSearchParams } from "next/navigation";


export default function HandleReset() {
  const searchParams = useSearchParams();
  const email = decodeURIComponent(searchParams.get("email") ?? "") as string
  return (
    <div className="flex justify-center">
      <main className="font-app h-[80vh]">
        <Card className="flex align-middle w-[400] overflow-hidden border-white/70 bg-white/82 pt-0 shadow-[0_28px_90px_-50px_rgba(16,54,74,0.75)] backdrop-blur md:w-[800]">
          <CardHeader className="rounded-[1.35rem] bg-[linear-gradient(135deg,#dff6ff_0%,#9de4fe_45%,#ffffff_100%)] px-6 pb-5 pt-5 text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-[#005472] shadow-sm">
              <ShieldCheck className="h-3.5 w-3.5" />
              Secure Reset
            </div>
            <CardTitle className="mt-3 text-center text-2xl font-extrabold text-[#10364a] md:text-[2rem]">Reset Password Sent</CardTitle>
            <CardDescription>
              If you have an account with us you will receive a password reset email at { email }. { " " }
              Open the email and follow the link to reset your password.
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    </div>
  )
}