'use client';

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { generate2faSecret, activate2fa, disable2fa } from "./actions";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp";
import { Activated2faRecordType } from "./actions";


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
    <div>
      { activated && (
        <div className="flex py-2">
          <Button onClick={ handleDisableClick }>
            Disable 2FA Authentication
          </Button>
        </div>
      ) }
      { !activated &&
        <div className="flex py-2">
          { step === 1 && (
            <Button onClick={ handleEnableClick }>
              Enable 2FA Authentication
            </Button>
          ) }
          { step === 2 && (
            <div>
              <p className="text-xs text-muted-foreground py-2">
                Scan the QR code below in the Authenticator app to activate 2FA.
              </p>
              <QRCodeSVG value={ code } />
              <Button onClick={ () => setStep(3) } className="w-full my-2">
                I have scanned the QR Code
              </Button>
              <Button onClick={ () => setStep(1) } className="w-full bg-gray-400">
                Cancel
              </Button>
            </div>
          ) }
          { step === 3 && (
            <form onSubmit={ handleSubmit }>
              <div className="max-w-max">
                <p className="text-xs md:text-base">
                  Please enter the one-time passcode from the authenticator app.
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
                  <>
                    <Button disabled={ otp.length != 6 } type="submit" className="w-full my-2">
                      Submit and activate 2FA
                    </Button>
                    <Button onClick={ () => setStep(2) } className="w-full bg-gray-400">
                      Cancel
                    </Button>
                  </>
                ) }
              </div>
            </form>
          ) }
        </div>
      }
    </div>
  )
};
