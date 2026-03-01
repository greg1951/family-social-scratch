'use client';

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSearchParams } from "next/navigation";


export default function HandleReset() {
  const searchParams = useSearchParams();
  const email = decodeURIComponent(searchParams.get("email") ?? "") as string
  return (
    <div className="flex justify-center">
      <main className="font-app h-[80vh]">
        <Card className="flex align-middle w-[300] md:w-[500]">
          <CardHeader className="text-base md:text-2xl bg-[#59cdf7] rounded-2xl text-center gap-y-0 p-2">
            <CardTitle className="text-center font-bold size-1.2 pt-0">Check Your Email</CardTitle>
          </CardHeader>
          <CardDescription>
            If you have an account with us you will receive a password reset email at '{ email }'. { " " }
            Open the email and follow the link to reset your password.
          </CardDescription>
        </Card>
      </main>
    </div>
  )
}