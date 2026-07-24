'use client';

import { familySchema } from "@/features/auth/components/validation/familySchema";
import z from "zod";
import { useForm } from "react-hook-form";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { beginAppleLogin, beginGoogleLogin, emailLoginCheck, fullLoginUser, sendLogin2faCodeEmail } from "./actions";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, CircleHelp, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { FamilySocialLoginSchema } from "@/features/family/components/validation/schema";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { signIn } from "next-auth/react";

const formSchema = FamilySocialLoginSchema;

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const searchParams = useSearchParams();
  const urlEmail = decodeURIComponent(searchParams.get("email") ?? "") as string
  const [email, setEmail] = useState(urlEmail);
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [emailAuthError, setEmailAuthError] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false)

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
      const sendCodeResult = await sendLogin2faCodeEmail({ email: data.email });
      if (sendCodeResult?.error) {
        form.setError("root", {
          message: sendCodeResult.message,
        });
        setEmailAuthError(sendCodeResult.message ?? "Unable to send one-time passcode");
        return;
      }
      setCodeSent(true);
      setOtpError("");
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
      router.push('/');
    };
  };

  const handleResend2faCode = async () => {
    const sendCodeResult = await sendLogin2faCodeEmail({ email });
    if (sendCodeResult?.error) {
      setOtpError(sendCodeResult.message ?? "Unable to resend one-time passcode");
      return;
    }
    setCodeSent(true);
    setOtpError("A new one-time passcode was sent to your email.");
  };

  const handleGoogleLogin = async () => {
    const family = form.getValues("family");
    const familyValidation = familySchema.safeParse(family);
    if (!familyValidation.success) {
      form.setError("family", {
        message: familyValidation.error.issues[0]?.message ?? "Family name is required",
      });
      return;
    }

    const response = await beginGoogleLogin({ family });
    if (response?.error) {
      form.setError("root", {
        message: response.message,
      });
      setEmailAuthError(response.message ?? "Unable to begin Google sign-in");
      return;
    }

    await signIn("google", { callbackUrl: "/" });
  };

  const handleAppleLogin = async () => {
    const family = form.getValues("family");
    const familyValidation = familySchema.safeParse(family);
    if (!familyValidation.success) {
      form.setError("family", {
        message: familyValidation.error.issues[0]?.message ?? "Family name is required",
      });
      return;
    }

    const response = await beginAppleLogin({ family });
    if (response?.error) {
      form.setError("root", {
        message: response.message,
      });
      setEmailAuthError(response.message ?? "Unable to begin Apple sign-in");
      return;
    }

    await signIn("apple", { callbackUrl: "/" });
  };

  return (
    <main className="font-app flex justify-center items-center h-2/12">
      { step === 1 &&
        <Card className="w-full max-w-md gap-y-3 overflow-hidden border-white/70 bg-white/82 pt-0 shadow-[0_28px_90px_-50px_rgba(16,54,74,0.75)] backdrop-blur">
          <CardHeader className="rounded-[1.35rem] bg-[linear-gradient(135deg,#59cdf7_0%,#9de4fe_45%,#fff2d8_100%)] px-6 pb-5 pt-5 text-center shadow-[inset_0_-1px_0_rgba(255,255,255,0.45)]">
            {/* <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/65 bg-white/55 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-[#005472] shadow-sm backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              Welcome Back
            </div> */}
            <CardTitle className="mt-3 font-extrabold tracking-[0.02em] text-[#10364a] text-2xl">
              My Family Social Login
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-2 pt-1 md:px-6">
            <Form { ...form }>
              <form onSubmit={ form.handleSubmit(handleEmailSubmit) }>
                <fieldset disabled={ form.formState.isSubmitting } className="flex flex-col gap-3">
                  <CardDescription className="rounded-xl border border-[#d8eef7] bg-[linear-gradient(180deg,rgba(223,246,255,0.5),rgba(255,255,255,0.92))] px-3 py-2 text-xs leading-5 text-[#315363] md:text-sm">
                    Sign in with a credential or use Google, or Apple. Start by entering your Family Name first.
                  </CardDescription>
                  <div className="relative">
                    <FormField
                      control={ form.control }
                      name="family"
                      render={ ({ field }) => (
                        <FormItem>
                          <FormLabel className="font-extrabold text-sm md:text-base">Family Name</FormLabel>
                          <FormControl>
                            <Input { ...field } type="text" placeholder="Family Name is required" className="text-xs" />
                          </FormControl>
                          <CardDescription className="rounded-xl border border-[#d8eef7] bg-[linear-gradient(180deg,rgba(223,246,255,0.5),rgba(255,255,255,0.92))] px-3 py-2 text-xs leading-5 text-[#315363] md:text-sm">
                            Credential sign in requires an Email and Password. Skip them if using Google or Apple.
                          </CardDescription>
                          <FormMessage />
                        </FormItem>
                      ) }
                    />
                    <div className="absolute top-0 right-0 mt-7">
                      <HoverCard open={ infoOpen } openDelay={ 300 } closeDelay={ 150 }>
                        <HoverCardTrigger asChild>
                          <Button
                            className='w-auto text-xs md:text-sm'
                            variant="link"
                            onMouseEnter={ () => setInfoOpen(true) }
                            onMouseLeave={ () => setInfoOpen(false) }
                          >
                            <CircleHelp size={ 6 } className="h-5 w-5 text-[#315363]" />
                          </Button>
                        </HoverCardTrigger>
                        <HoverCardContent side='top' className="flex w-50 md:w-120 flex-col gap-0.5">
                          <p className='text-sm p-1'>When you join My Family Social you become part of a unique family. Your family name is required to sign in.</p>
                          <p className='text-sm p-1'>In your email invitation, and in the login instructions email you received after registering,
                            your family name was prominently mentioned.</p>
                          <p className='text-sm p-1'>You may use the email and password credential when you registered. If using Google or Apple instead, it must match the email you registed with. </p>
                        </HoverCardContent>
                      </HoverCard>
                    </div>
                  </div>
                  <FormField
                    control={ form.control }
                    name="email"
                    render={ ({ field }) => (
                      <FormItem>
                        <FormLabel className="font-extrabold text-sm md:text-base">Email</FormLabel>
                        <FormControl>
                          <Input { ...field } type="email" placeholder="Email used in My Family Social" className="text-xs" />
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
                            <Input { ...field } type={ showPassword ? "text" : "password" } placeholder="8+ chars, uppercase, number, special" className="text-xs" />
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

                  { !!emailAuthError &&
                    <FormMessage>
                      { emailAuthError }
                    </FormMessage>
                  }
                  <Button
                    className="mt-2 h-11 rounded-2xl border border-[#d8eef7] bg-white text-sm font-bold text-[#10364a] shadow-[0_18px_30px_-24px_rgba(16,54,74,0.8)] hover:bg-[#f1fbff]"
                    type="submit"
                  >
                    Use a Credential to Sign In
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button
                    className="h-11 rounded-2xl border border-[#d8eef7] bg-white text-sm font-bold text-[#10364a] shadow-[0_18px_30px_-24px_rgba(16,54,74,0.8)] hover:bg-[#f1fbff]"
                    type="button"
                    onClick={ handleGoogleLogin }
                  >
                    OR Continue with Google
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button
                    className="h-11 rounded-2xl border border-[#d8eef7] bg-white text-sm font-bold text-[#10364a] shadow-[0_18px_30px_-24px_rgba(16,54,74,0.8)] hover:bg-[#f1fbff]"
                    type="button"
                    onClick={ handleAppleLogin }
                  >
                    OR Continue with Apple
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
                  <p className="text-xs text-[#5a7381]">Return to the My Family Social landing page.</p>
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
            <CardDescription className="mt-2 text-sm leading-6 text-[#315363]">Enter the six-digit code sent to your email. It expires in five minutes.</CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-3">
            <form onSubmit={ handle2faSubmit } className="flex flex-col gap-2">
              { codeSent && (
                <p className="rounded-xl border border-[#d7edf6] bg-[#f8fdff] px-3 py-2 text-center text-xs text-[#315363]">
                  A one-time passcode was sent to { email }.
                </p>
              ) }
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
              <Button
                type="button"
                onClick={ handleResend2faCode }
                className="h-11 rounded-2xl border border-[#c8e5f1] bg-white text-sm font-semibold text-[#315363] hover:bg-[#eef9fe]"
              >
                Resend Code
              </Button>
            </form>
          </CardContent>
        </Card>
      ) }
    </main>
  )
}
