import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import SendFamilyEmailForm from "./";
import { Mail } from "lucide-react";

export default function ResetPassword() {
  return (
    <div className="flex justify-center">
      <main className="font-app h-[80vh]">
        <Card className="flex align-middle w-[300] overflow-hidden border-white/70 bg-white/82 pt-0 shadow-[0_28px_90px_-50px_rgba(16,54,74,0.75)] backdrop-blur md:w-[800]">
          <CardHeader className="rounded-[1.35rem] bg-[linear-gradient(135deg,#59cdf7_0%,#9de4fe_45%,#fff2d8_100%)] px-6 pb-5 pt-5 text-center shadow-[inset_0_-1px_0_rgba(255,255,255,0.45)]">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/65 bg-white/55 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-[#005472] shadow-sm backdrop-blur">
              <Mail className="h-3.5 w-3.5" />
              Helpful Reminder
            </div>
            <CardTitle className="mt-3 text-center text-2xl font-extrabold tracking-[0.02em] text-[#10364a] md:text-[2rem]">Send Family Name Email</CardTitle>
            <CardDescription className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-[#315363]">
              We will email your family name if your address is already connected to a Family Social family.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SendFamilyEmailForm />
          </CardContent>
        </Card>
      </main>
    </div >
  )
}