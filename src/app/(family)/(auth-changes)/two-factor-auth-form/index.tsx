'use client';

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { generate2faSecret, activate2fa, disable2fa } from "./actions";
import { toast } from "sonner";
import { ArrowRight, ShieldCheck } from "lucide-react";


type Props = {
  isActivated: boolean;
  email: string;
}

export default function TwoFactorAuthForm({ isActivated, email }: Props) {
  const [activated, setActivated] = useState(isActivated);

  const handleEnableClick = async () => {
    const secretResult = await generate2faSecret(email);
    if (secretResult?.error) {
      toast.error(secretResult.message, {
        position: "bottom-center",
        duration: 2000,
      });
      return;
    }

    const activatedResult = await activate2fa(email);
    if (activatedResult?.error) {
      toast.error(activatedResult.message, {
        position: "bottom-center",
        duration: 3000,
      });
    }
    else {
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
          <div className="w-full max-w-md rounded-[1.6rem] border border-[#d7edf6] bg-[#f8fdff] p-5 text-center shadow-inner">
            <p className="text-sm font-medium text-[#315363]">
              Enable two-factor authentication to receive a one-time passcode by email each time you sign in.
            </p>
            <Button
              onClick={ handleEnableClick }
              className="mt-4 h-11 w-full rounded-2xl bg-[linear-gradient(135deg,#005472_0%,#0a779f_52%,#59cdf7_100%)] px-6 text-base font-bold text-white shadow-[0_18px_30px_-18px_rgba(0,84,114,0.8)] hover:brightness-110"
            >
              <ShieldCheck className="h-4 w-4" />
              Enable 2FA Authentication
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      }
    </div>
  )
};
