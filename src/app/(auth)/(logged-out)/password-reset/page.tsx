import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";
import ResetPasswordForm from "./reset-password-form";

export default function ResetPassword() {
  return (
    <div className="flex justify-center">
      <main className="font-app h-[80vh]">
        <Card className="flex align-middle w-[400] overflow-hidden border-white/70 bg-white/82 pt-0 shadow-[0_28px_90px_-50px_rgba(16,54,74,0.75)] backdrop-blur md:w-[800]">
          <CardHeader className="rounded-[1.35rem] bg-[linear-gradient(135deg,#dff6ff_0%,#9de4fe_45%,#ffffff_100%)] px-6 pb-5 pt-5 text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-[#005472] shadow-sm">
              <ShieldCheck className="h-3.5 w-3.5" />
              Secure Reset
            </div>
            <CardTitle className="mt-3 text-center text-2xl font-extrabold text-[#10364a] md:text-[2rem]">Reset Password</CardTitle>
            <CardDescription className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-[#315363]">
              Enter your email below and we will send a one-hour reset link to get you back in.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResetPasswordForm />
          </CardContent>
        </Card>
      </main>
    </div >
  )
}