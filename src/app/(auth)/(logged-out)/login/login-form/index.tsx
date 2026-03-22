'use client';

import { passwordSchema } from "@/features/auth/components/validation/passwordSchema";
import { familySchema } from "@/features/auth/components/validation/familySchema";
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
import { ArrowRight, Eye, EyeOff, LogIn, ShieldCheck, Sparkles } from "lucide-react";

const formSchema = z
  .object({ email: z.email(), password: passwordSchema, family: familySchema });

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
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
      password: "",
      family: ""
    },
  });

  /*
  There are potentially two form submissions: 
  1. The handleEmailSubmit executes (step 1) --> emailLoginCheck (action) to validate email creds and --> returns isActive
  2. The handle2faSubmit (step 2) only runs in 2fa active case --> fullLoginUser (action)
  */

  const handleEmailSubmit = async (data: z.infer<typeof formSchema>) => {
    setEmail(data.email);
    const precheckResult = await emailLoginCheck({ email: data.email, password: data.password, family: data.family });
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
        family: data.family,
        password: data.password
      });
      // console.log("index->response: ", response);

      if (response?.error) {
        form.setError("root", {
          message: response?.message,
        });
      }
      else {
        router.push('/');
      }
    }
  };

  const handle2faSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const loginResult = await fullLoginUser({
      email: email,
      family: form.getValues("family"),
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
    <main className="font-app flex justify-center items-center h-2/12">
      { step === 1 &&
        <Card className="w-full max-w-md gap-y-3 overflow-hidden border-white/70 bg-white/82 pt-0 shadow-[0_28px_90px_-50px_rgba(16,54,74,0.75)] backdrop-blur">
          <CardHeader className="rounded-[1.35rem] bg-[linear-gradient(135deg,#59cdf7_0%,#9de4fe_45%,#fff2d8_100%)] px-6 pb-5 pt-5 text-center shadow-[inset_0_-1px_0_rgba(255,255,255,0.45)]">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/65 bg-white/55 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-[#005472] shadow-sm backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              Welcome Back
            </div>
            <CardTitle className="mt-3 text-2xl font-extrabold tracking-[0.02em] text-[#10364a] md:text-[2rem]">
              Family Social Login
            </CardTitle>
            <CardDescription className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#315363]">
              Step back into your family circles with your email, password, and family name.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-2 pt-1 md:px-6">
            <Form { ...form }>
              <form onSubmit={ form.handleSubmit(handleEmailSubmit) }>
                <fieldset disabled={ form.formState.isSubmitting } className="flex flex-col gap-3">
                  <FormField
                    control={ form.control }
                    name="email"
                    render={ ({ field }) => (
                      <FormItem>
                        <FormLabel className="font-extrabold text-sm md:text-base">Email</FormLabel>
                        <FormControl>
                          <Input { ...field } type="email" placeholder="Email used in Family Social" className="text-xs" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    ) }
                  />
                  <div className="relative">
                    <FormField
                      control={ form.control }
                      name="password"
                      render={ ({ field }) => (
                        <FormItem>
                          <FormLabel className="font-extrabold text-sm md:text-base">Password</FormLabel>
                          <FormControl>
                            <Input { ...field } type={ showPassword ? "text" : "password" } placeholder="At least 5 characters" className="text-xs" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      ) }
                    />
                    <Button type="button" variant="ghost" size="sm"
                      className="absolute right-0 top-4 h-full px-3 py-2 text-[#315363] hover:bg-transparent hover:text-[#10364a]"
                      onClick={ () => setShowPassword((prev) => !prev) }
                    >
                      { showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      ) }
                    </Button>

                  </div>
                  <FormField
                    control={ form.control }
                    name="family"
                    render={ ({ field }) => (
                      <FormItem>
                        <FormLabel className="font-extrabold text-sm md:text-base">Family Name</FormLabel>
                        <FormControl>
                          <Input { ...field } type="text" placeholder="Family name 10-30 characters" className="text-xs" />
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
                  <Button
                    className="mt-2 h-11 rounded-2xl bg-[linear-gradient(135deg,#005472_0%,#0a779f_52%,#59cdf7_100%)] text-base font-bold text-white shadow-[0_18px_30px_-18px_rgba(0,84,114,0.8)] hover:brightness-110"
                    type="submit"
                  >
                    <LogIn className="h-4 w-4" />
                    Enter Family Social
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </fieldset>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex-col items-start gap-3 border-t border-[#d8eef7] px-5 pb-5 pt-4 md:px-6">
            <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.22em] text-[#2f7a95]">
              Need a hand?
            </div>
            <div className="grid w-full gap-2">
              <div className="flex items-center justify-between rounded-2xl border border-[#d8eef7] bg-[linear-gradient(180deg,rgba(223,246,255,0.5),rgba(255,255,255,0.92))] px-3 py-2.5 shadow-[0_14px_30px_-30px_rgba(16,54,74,0.85)]">
                <div>
                  <p className="text-sm font-bold text-[#10364a]">Forgot password?</p>
                  <p className="text-xs text-[#5a7381]">Start a secure password reset.</p>
                </div>
                <Link
                  className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#005472] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#dff6ff]"
                  href={ `/password-reset${ form.getValues("email") ? `?email=${ encodeURIComponent(form.getValues("email")) }` : "" }` }
                >
                  Reset
                </Link>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-[#d8eef7] bg-[linear-gradient(180deg,rgba(255,242,216,0.55),rgba(255,255,255,0.92))] px-3 py-2.5 shadow-[0_14px_30px_-30px_rgba(16,54,74,0.85)]">
                <div>
                  <p className="text-sm font-bold text-[#10364a]">Forgot family name?</p>
                  <p className="text-xs text-[#5a7381]">Send yourself a reminder email.</p>
                </div>
                <Link
                  className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#005472] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#fff2d8]"
                  href={ `/family-reminder-email${ form.getValues("email") ? `?email=${ encodeURIComponent(form.getValues("email")) }` : "" }` }
                >
                  Remind Me
                </Link>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-[#d8eef7] bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(223,246,255,0.38))] px-3 py-2.5 shadow-[0_14px_30px_-30px_rgba(16,54,74,0.85)]">
                <div>
                  <p className="text-sm font-bold text-[#10364a]">Take me home</p>
                  <p className="text-xs text-[#5a7381]">Return to the Family Social landing page.</p>
                </div>
                <Link
                  className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#005472] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#dff6ff]"
                  href="/"
                >
                  Home
                </Link>
              </div>
            </div>
          </CardFooter>
        </Card>
      }
      { step === 2 && (
        <Card className="w-[350px] overflow-hidden border-white/70 bg-white/82 pt-0 shadow-[0_28px_90px_-50px_rgba(16,54,74,0.75)] backdrop-blur">
          <CardHeader className="rounded-[1.35rem] bg-[linear-gradient(135deg,#dff6ff_0%,#9de4fe_45%,#ffffff_100%)] px-6 pb-5 pt-5 text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-[#005472] shadow-sm">
              <ShieldCheck className="h-3.5 w-3.5" />
              Secure Check
            </div>
            <CardTitle className="mt-3 text-2xl font-extrabold text-[#10364a]">One-Time Passcode</CardTitle>
            <CardDescription className="mt-2 text-sm leading-6 text-[#315363]">Use your 2FA code to finish entering your family space.</CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-3">
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
              <Button
                disabled={ otp.length !== 6 }
                type="submit"
                className="mt-3 h-11 rounded-2xl bg-[linear-gradient(135deg,#005472_0%,#0a779f_52%,#59cdf7_100%)] text-base font-bold text-white shadow-[0_18px_30px_-18px_rgba(0,84,114,0.8)] hover:brightness-110"
              >
                <ShieldCheck className="h-4 w-4" />
                Verify OTP
              </Button>
            </form>
          </CardContent>
        </Card>
      ) }
    </main>
  )
}
