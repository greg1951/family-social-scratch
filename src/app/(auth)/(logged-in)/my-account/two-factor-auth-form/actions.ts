'use server';

import { getUser2fa, 
         updateUser2faSecret, 
         updateUser2faActivated,   
        } from "@/features/auth/components/db/queries-users";
import { Update2faSecretRecordType, 
         Update2faActivatedRecordType } from "@/features/auth/types/users"

import { generateSecret, generateURI, generate } from 'otplib';

export const generate2faSecret = async(email:string) => {
  const result2fa = await getUser2fa(email);
  if (!result2fa) {
    return {
      errror: true,
      message: "Authentication error"
    }
  };
  
  let twoFactorSecret = result2fa.secret;

  if (!result2fa.secret) {
    twoFactorSecret = generateSecret();

    const update2faSecret:Update2faSecretRecordType = {
      email: email,
      secret: twoFactorSecret,
    }
    const updateResult = await updateUser2faSecret(update2faSecret);

    if (updateResult.error) {
      return {
        error: true,
        message: "Authorization update error"
      }
    }
    /* Generate a key URI to be used by the authenticator */
    return {
      error: false,
      qrUri: generateURI({
        issuer: "KbgAuthApp",
        label: email,
        secret: twoFactorSecret
      })
    };  
  }
}

export type Activated2faRecordType = {
  email: string,
  otp: string,
}

export const activate2fa = async(args: Activated2faRecordType) => {
  const result2fa = await getUser2fa(args.email);
  if (!result2fa) {
    return {
      errror: true,
      message: "Activate find error"
    }
  };

  if (!result2fa.secret) {
    return {
      error: true,
      message: "Authorization secret error"
    }
  };

  const secret = result2fa.secret;
  const token = await generate({secret});

  if (args.otp !== token) {
    return {
      error: true,
      message: "Invalid one-time passcode"
    }
  }

  const update2faActivated:Update2faActivatedRecordType = {
    email: args.email,
    isActivated: true,
  }

  const updateResult = await updateUser2faActivated(update2faActivated);
  if (updateResult.error) {
    return {
      error: true,
      message: "Authorization update error"
    }
  }
}


export const disable2fa = async(email: string) => {
  const result2fa = await getUser2fa(email);
  if (!result2fa) {
    return {
      errror: true,
      message: "Disable 2fa find error"
    }
  };

  if (!result2fa.isActivated) {
    return {
      error: false,
    }; 
  };

  const update2faActivated:Update2faActivatedRecordType = {
    email: email,
    isActivated: false,
  }

  const updateResult = await updateUser2faActivated(update2faActivated);
  if (updateResult.error) {
    return {
      error: true,
      message: "Disable 2fa update error"
    }
  }
  return {
    error: false,
  }; 
}