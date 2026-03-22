'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter }
  from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import RegisterAccountForm from "./register-form";


export default function Register() {

  /* Remember, to see console logs you need to Inspect in the browser */
  // console.log('Register->handleSubmit->submitted: ', submitted);
  return (
    <main className="flex justify-center items-center min-h-screen">
          <Card className="w-[350] overflow-hidden border-white/70 bg-white/82 pt-0 shadow-[0_28px_90px_-50px_rgba(16,54,74,0.75)] backdrop-blur">
            <CardHeader className="rounded-[1.35rem] bg-[linear-gradient(135deg,#59cdf7_0%,#9de4fe_45%,#fff2d8_100%)] px-6 pb-5 pt-5 text-center shadow-[inset_0_-1px_0_rgba(255,255,255,0.45)]">
              <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/65 bg-white/55 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-[#005472] shadow-sm backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" />
                Start Here
              </div>
              <CardTitle className="mt-3 text-2xl font-extrabold tracking-[0.02em] text-[#10364a] md:text-[2rem]">Register Account</CardTitle>
              <CardDescription className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#315363]">Create your Family Social account and step into your family circles.</CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterAccountForm />
        </CardContent>
        <CardFooter className="flex-col gap-2">
          <div className="text-muted-foreground text-sm">
            Already have an account?{ " " }
            <Link href="/login" className="underline">
              Login
            </Link>
          </div>
        </CardFooter>
      </Card>
    </main>
  );
}
