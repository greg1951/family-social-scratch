'use server';

import z from "zod";
import { passwordSchema } from "@/features/auth/components/validation/passwordSchema";
import { familySchema } from "@/features/auth/components/validation/familySchema";
import { signIn } from "@/auth";
import { preLoginAuthValidation } from "@/features/auth/services/auth-utils";
import { generate } from "otplib";
import { getUser2fa } from "@/components/db/sql/queries-user";

export const fullLoginUser = async({email, password, family, token}: {email: string, password: string, family: string, token?: string}) => {
    console.log('fullLoginUser->email: ',email, 'family: ',family, 'token: ', token);
    const userSchema = z.object({
      email: z.email(),
      family: familySchema,
      password: passwordSchema
    });
    
    const userValidation = userSchema.safeParse({email, password, family});
    console.log("fullLoginUser->userValidation: ", userValidation);
    
    if (!userValidation.success) {
      return {
        error: true,
        message: userValidation.error.issues[0]?.message ?? "An error occurred in validation",
      };
        
      }
      /* Kickoff the auth authentication here to the auth.ts Credentials provider */
      try {
        console.info(`fullLoginUser->Starting Credentails signIn: ${email}, ${password}, ${family}, ${token}`);
        const signInResult = await signIn("credentials", {
          email,
          password,
          family,
          token,
          redirect: false
        })
        console.info('fullLoginUser->signInResult: ', signInResult);
      } catch(e) {
        return {
          error: true,
          message: "Incorrect email or password"
        }
    };    
  };

/*
  Confirm the email/password credentials and returns the isActive property for 2fa logic
*/  
export const emailLoginCheck = async ({email, password, family}:{email:string; password: string; family: string;}) => {
  
  if (email) {console.log('actions->emailLoginCheck->email: ',email, ', family: ', family);}
  
  const validationResult = await preLoginAuthValidation({email, password, family});

  console.log('actions->emailLoginCheck->validationResult: ', validationResult);
  return validationResult;
};

export type ValidateOtpRecordType = {
  email: string,
  token: string,
}

export const validateOtp = async(args: ValidateOtpRecordType) => {
  // console.log('validateOtp->args.email: ', args.email, ' args.token: ', args.token);
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

  if (args.token !== token) {
    return {
      error: true,
      message: "Invalid one-time passcode"
    }
  };

  return {
    error: false,
  }
}
