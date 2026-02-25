'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter }
  from "@/components/ui/card";
import Link from "next/link";
import RegisterAccountForm from "./register-form";


export default function Register() {

  /* Remember, to see console logs you need to Inspect in the browser */
  // console.log('Register->handleSubmit->submitted: ', submitted);
  return (
    <main className="flex justify-center items-center min-h-screen">
      <Card className="w-[350]">
        <CardHeader>
          <CardTitle>Register Account</CardTitle>
          <CardDescription>Register for a new account.</CardDescription>
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
