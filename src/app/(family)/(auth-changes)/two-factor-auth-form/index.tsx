'use client';

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { generate2faSecret, activate2fa, disable2fa } from "./actions";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp";
import { Activated2faRecordType } from "./actions";
import { ArrowRight, ShieldCheck } from "lucide-react";


type Props = {
  isActivated: boolean;
  email: string;
}

export default function TwoFactorAuthForm({ isActivated, email }: Props) {
  const [activated, setActivated] = useState(isActivated);
  const [step, setStep] = useState(1);
  const [code, setCode] = useState("");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");

  const handleEnableClick = async () => {
    const getResponse = await generate2faSecret(email);
    // console.log('TwoFactorAuthForm->handleEnableClick->getResponse: ', getResponse);
    if (getResponse?.error) {
      toast.error(getResponse.message, {
        position: "bottom-center",
        duration: 2000,
      });
      return;
    }
    setStep(2);
    setCode(getResponse?.qrUri ?? "");
  }
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setActivated(false);
    const activatedRecord: Activated2faRecordType = { email: email, otp: otp };
    const activatedResult = await activate2fa(activatedRecord);
    // console.log('TwoFactorAuthForm->activatedResult: ', activatedResult);
    if (activatedResult?.error) {
      setOtpError(activatedResult.message);
    }
    else {
      setOtpError("");
      setActivated(true);
      toast.success("2FA has been enabled for your login", {
        position: "bottom-center",
        duration: 3000,
      });
    };
  }

  const handleDisableClick = async () => {
    const disableResult = await disable2fa(email);
    if (disableResult.error) {
      toast.error(disableResult.message, {
        position: "bottom-center",
        duration: 3000,
      });
      setActivated(true);
      return;
    }
    setActivated(false);
    setStep(1);
  };

  return (
    <div className="space-y-4">
      { activated && (
        <div className="flex justify-center py-2">
          <Button
            onClick={ handleDisableClick }
            className="h-11 rounded-2xl bg-[linear-gradient(135deg,#005472_0%,#0a779f_52%,#59cdf7_100%)] px-6 text-base font-bold text-white shadow-[0_18px_30px_-18px_rgba(0,84,114,0.8)] hover:brightness-110"
          >
            Disable 2FA Authentication
          </Button>
        </div>
      ) }
      { !activated &&
        <div className="flex justify-center py-1">
          { step === 1 && (
            <Button
              onClick={ handleEnableClick }
              className="h-11 rounded-2xl bg-[linear-gradient(135deg,#005472_0%,#0a779f_52%,#59cdf7_100%)] px-6 text-base font-bold text-white shadow-[0_18px_30px_-18px_rgba(0,84,114,0.8)] hover:brightness-110"
            >
              <ShieldCheck className="h-4 w-4" />
              Enable 2FA Authentication
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) }
          { step === 2 && (
            <div className="w-full max-w-md rounded-[1.6rem] border border-[#d7edf6] bg-[#f8fdff] p-5 text-center shadow-inner">
              <p className="text-sm font-medium text-[#315363]">
                Step 1: Scan the QR code below in the Authenticator app and retrieve a token from the app.
              </p>
              <div className="flex justify-center py-4">
                <div className="rounded-[1.35rem] border border-white bg-white p-4 shadow-sm">
                  <QRCodeSVG value={ code } />
                </div>
              </div>
              <Button
                onClick={ () => setStep(3) }
                className="mt-1 h-11 w-full rounded-2xl bg-[linear-gradient(135deg,#005472_0%,#0a779f_52%,#59cdf7_100%)] text-base font-bold text-white shadow-[0_18px_30px_-18px_rgba(0,84,114,0.8)] hover:brightness-110"
              >
                I have scanned the QR Code
              </Button>
              <Button type="button" onClick={ () => setStep(1) } className="mt-2 h-11 w-full rounded-2xl border border-[#c8e5f1] bg-white text-base font-semibold text-[#315363] hover:bg-[#eef9fe]">
                Cancel
              </Button>
            </div>
          ) }
          { step === 3 && (
            <form onSubmit={ handleSubmit }>
              <div className="max-w-max rounded-[1.6rem] border border-[#d7edf6] bg-[#f8fdff] p-5 shadow-inner">
                <p className="pb-3 text-center text-sm font-medium text-[#315363]">
                  Step 2: Please enter the one-time passcode from the authenticator app.
                </p>
                <InputOTP maxLength={ 6 } value={ otp } onChange={ setOtp } className="max-w-max">
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

                { !activated && (
                  <div className="mt-4 space-y-2">
                    <Button
                      disabled={ otp.length != 6 }
                      type="submit"
                      className="h-11 w-full rounded-2xl bg-[linear-gradient(135deg,#005472_0%,#0a779f_52%,#59cdf7_100%)] text-base font-bold text-white shadow-[0_18px_30px_-18px_rgba(0,84,114,0.8)] hover:brightness-110"
                    >
                      Submit and activate 2FA
                    </Button>
                    <Button type="button" onClick={ () => setStep(2) } className="h-11 w-full rounded-2xl border border-[#c8e5f1] bg-white text-base font-semibold text-[#315363] hover:bg-[#eef9fe]">
                      Cancel
                    </Button>
                  </div>
                ) }
              </div>
            </form>
          ) }
        </div>
      }
    </div>
  )
};
