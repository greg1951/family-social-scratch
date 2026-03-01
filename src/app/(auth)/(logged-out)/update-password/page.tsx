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
  // let tokenExpiry;
  let isValidExpiry;
  let email;
  if (token) {
    const result = await getPasswordToken({ token });
    if (result.error) {
      console.log('Error occurred retrieving passwordToken');
    }

    // console.log('UpdateResetPassword->result: ', result);
    // tokenExpiry = result.tokenExpiry;
    isValidExpiry = result.isValidExpiry;
    email = result.email;
  }

  return (
    <div className="flex justify-center">
      <main className="font-app h-[80vh]">
        <Card className="flex align-middle w-[300] md:w-[500]">
          <CardHeader className="text-base md:text-2xl bg-[#59cdf7] rounded-2xl text-center gap-y-0 p-2">
            <CardTitle className="text-center font-bold size-1.2 pt-0">Password Reset Update</CardTitle>
          </CardHeader>
          <CardDescription className="text-base font-medium text-center">
            { isValidExpiry
              ? <p className="text-blue-700">{ email }</p>
              : <p className="text-red-700">Your password reset link is invalid or has expired</p>
            }
          </CardDescription>
          <CardContent>
            { isValidExpiry
              ? <UpdateResetPasswordForm userEmail={ email as string } />
              :
              <div className="text-center text-base text-muted-foreground">
                <Link href='/password-reset' className="underline">
                  Request another password Reset
                </Link>
              </div>
            }

          </CardContent>
        </Card>
      </main>
    </div>
  )
}