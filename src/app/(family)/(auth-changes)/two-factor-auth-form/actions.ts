'use server';

import { getUser2fa, 
         updateUser2faSecret, 
         updateUser2faActivated,   
        } from "@/components/db/sql/queries-user";
import { Update2faSecretRecordType, 
         Update2faActivatedRecordType } from "@/components/db/types/user"

import { generateSecret } from 'otplib';

export const generate2faSecret = async(email:string) => {
  const result2fa = await getUser2fa(email);
  if (!result2fa.success) {
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
    return {
      error: false,
      secretCreated: true,
    };  
  }

  return {
    error: false,
    secretCreated: false,
  };
}

export const activate2fa = async(email: string) => {
  const result2fa = await getUser2fa(email);
  if (!result2fa.success) {
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

  const update2faActivated:Update2faActivatedRecordType = {
    email: email,
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
  if (!result2fa.success) {
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