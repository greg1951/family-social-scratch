'use client';

import { passwordSchema } from "@/features/auth/components/validation/passwordSchema";
import z from "zod";
import { useForm } from "react-hook-form";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { emailLoginCheck, fullLoginUser } from "./actions";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const formSchema = z
  .object({ email: z.email(), password: passwordSchema });

export default function LoginForm() {
  const searchParams = useSearchParams();
  const urlEmail = decodeURIComponent(searchParams.get("email") ?? "") as string
  const [email, setEmail] = useState(urlEmail);
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [emailAuthError, setEmailAuthError] = useState("");
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: email,
      password: ""
    },
  });

  /*
  There are potentially two form submissions: 
  1. The handleEmailSubmit executes (step 1) --> emailLoginCheck (action) to validate email creds and --> returns isActive
  2. The handle2faSubmit (step 2) only runs in 2fa active case --> fullLoginUser (action)
  */

  const handleEmailSubmit = async (data: z.infer<typeof formSchema>) => {
    setEmail(data.email);
    const precheckResult = await emailLoginCheck({ email: data.email, password: data.password });
    // console.log('Login->handleEmailSubmit->precheckResult: ', precheckResult);

    if (precheckResult.error) {
      // console.log('Login->handleEmailSubmit->precheckResult.error! ', precheckResult.error);
      form.setError("root", {
        message: precheckResult.message,
      });
      setEmailAuthError(precheckResult.message ?? "")
      return;
    }

    if (precheckResult.isActive) {
      setStep(2);
    }
    else {
      const response = await fullLoginUser({
        email: data.email,
        password: data.password
      });

      if (response?.error) {
        form.setError("root", {
          message: response?.message,
        });
      }
      else {
        router.push('/my-account');
      }
    }
  };

  const handle2faSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const loginResult = await fullLoginUser({
      email: email,
      password: form.getValues("password"),
      token: otp
    });
    if (loginResult?.error) {
      setOtpError(loginResult.message as string);
    }
    else {
      router.push('my-account');
    };
  };

  return (
    <main className="flex justify-center items-center h-screen">
      { step === 1 &&
        <Card className=" gap-y-2">
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>Login to your account.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form { ...form }>
              <form onSubmit={ form.handleSubmit(handleEmailSubmit) }>
                <fieldset disabled={ form.formState.isSubmitting } className="flex flex-col gap-2">
                  <FormField
                    control={ form.control }
                    name="email"
                    render={ ({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input { ...field } type="email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    ) }
                  />
                  <FormField
                    control={ form.control }
                    name="password"
                    render={ ({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input { ...field } type="password" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    ) }
                  />
                  { !!emailAuthError &&
                    <FormMessage>
                      { emailAuthError }
                    </FormMessage>
                  }
                  <Button type="submit">Login</Button>
                </fieldset>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex-col gap-2">
            <div className="text-muted-foreground text-sm">
              Don&apos;t have an account?{ "   " }
              <Link href="/register" className="underline">
                Register
              </Link>
            </div>
            <div className="text-muted-foreground text-sm">
              Forgot password?{ "   " }
              <Link className="underline"
                href={ `/password-reset${ form.getValues("email") ? `?email=${ encodeURIComponent(form.getValues("email")) }` : "" }` }>
                Reset my password
              </Link>
            </div>
          </CardFooter>
        </Card>
      }
      { step === 2 && (
        <Card className="w-[350]">
          <CardHeader>
            <CardTitle>One-Time Passcode</CardTitle>
            <CardDescription>Use 2FA One-Time Passcode.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={ handle2faSubmit } className="flex flex-col gap-2">
              <InputOTP maxLength={ 6 } value={ otp } onChange={ setOtp }>
                <InputOTPGroup className="*:data-[slot=input-otp-slot]:h-12 *:data-[slot=input-otp-slot]:w-11 *:data-[slot=input-otp-slot]:text-xm">
                  <InputOTPSlot index={ 0 } />
                  <InputOTPSlot index={ 1 } />
                  <InputOTPSlot index={ 2 } />
                </InputOTPGroup>
                <InputOTPSeparator className="mx-2" />
                <InputOTPGroup className="*:data-[slot=input-otp-slot]:h-12 *:data-[slot=input-otp-slot]:w-11 *:data-[slot=input-otp-slot]:text-xm">
                  <InputOTPSlot index={ 3 } />
                  <InputOTPSlot index={ 4 } />
                  <InputOTPSlot index={ 5 } />
                </InputOTPGroup>
              </InputOTP>
              { otpError &&
                <div>
                  <p className="text-sm text-red-600 text-center">{ otpError }</p>
                </div>
              }
              <Button disabled={ otp.length !== 6 } type="submit">Verify OTP</Button>
            </form>
          </CardContent>
        </Card>
      ) }
    </main>
  )
}
