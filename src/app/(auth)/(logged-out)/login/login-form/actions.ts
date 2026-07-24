'use server';

import z from "zod";
import { passwordSchema } from "@/features/auth/components/validation/passwordSchema";
import { familySchema } from "@/features/auth/components/validation/familySchema";
import { signIn } from "@/auth";
import { preLoginAuthValidation } from "@/features/auth/services/auth-utils";
import { generate } from "otplib";
import { getUser2fa, upsertUser2faCode } from "@/components/db/sql/queries-user";
import { cookies } from "next/headers";
import { findRegisteredFamily } from "@/components/db/sql/queries-family-member";
import { sendTwoFactorCodeEmail } from "@/components/emails/send-2fa-code-email";

const OAUTH_FAMILY_COOKIE = "oauth_family_context";

export const fullLoginUser = async({email, password, family, token}: {email: string, password: string, family: string, token?: string}) => {
    // console.log('fullLoginUser->email: ',email, 'family: ',family, 'token: ', token);
    const userSchema = z.object({
      email: z.email(),
      family: familySchema,
      password: passwordSchema
    });
    
    const userValidation = userSchema.safeParse({email, password, family});
    // console.log("fullLoginUser->userValidation: ", userValidation);
    
    if (!userValidation.success) {
      return {
        error: true,
        message: userValidation.error.issues[0]?.message ?? "An error occurred in validation",
      };
        
      }
      /* Kickoff the auth authentication here to the auth.ts Credentials provider */
      try {
        // console.info(`fullLoginUser->Starting Credentails signIn: ${email}, ${password}, ${family}, ${token}`);
        await signIn("credentials", {
          email,
          password,
          family,
          token,
          redirect: false
        })
        // console.info('fullLoginUser->signInResult: ', signInResult);
      } catch {
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

  // console.log('actions->emailLoginCheck->validationResult: ', validationResult);
  return validationResult;
};

export const sendLogin2faCodeEmail = async({ email }: { email: string }) => {
  const normalizedEmail = email.trim().toLowerCase();
  const result2fa = await getUser2fa(normalizedEmail);
  if (!result2fa.success) {
    return {
      error: true,
      message: "Unable to find your account for 2FA"
    }
  };

  if (!result2fa.isActivated) {
    return {
      error: true,
      message: "2FA is not activated for this account"
    }
  }

  if (!result2fa.secret) {
    return {
      error: true,
      message: "Authorization secret error"
    }
  };

  const secret = result2fa.secret;
  const token = await generate({secret});
  const codeNumber = Number.parseInt(token, 10);

  if (!Number.isInteger(codeNumber)) {
    return {
      error: true,
      message: "Could not generate a valid one-time passcode"
    }
  }

  const storeResult = await upsertUser2faCode({
    userId: result2fa.id as number,
    codeNumber,
    expires: new Date(Date.now() + 5 * 60 * 1000),
  });

  if (storeResult.error) {
    return {
      error: true,
      message: storeResult.message ?? "Unable to save your one-time passcode"
    }
  }

  const sendResult = await sendTwoFactorCodeEmail({
    email: normalizedEmail,
    code: token,
    expiresInMinutes: 5,
  });

  if (sendResult.error) {
    return {
      error: true,
      message: sendResult.message ?? "The 2FA email could not be sent"
    }
  }

  return {
    error: false,
  }
}

export const beginGoogleLogin = async ({ family }: { family: string }) => {
  const validation = familySchema.safeParse(family);
  if (!validation.success) {
    return {
      error: true,
      message: validation.error.issues[0]?.message ?? "Family name is required",
    };
  }

  const familyResult = await findRegisteredFamily(family);
  if (!familyResult.success || !familyResult.familyId) {
    return {
      error: true,
      message: "Family name is not registered in My Family Social",
    };
  }

  const cookieStore = await cookies();
  cookieStore.set(
    OAUTH_FAMILY_COOKIE,
    JSON.stringify({ familyName: familyResult.familyName, familyId: familyResult.familyId }),
    {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 10,
    }
  );

  return {
    error: false,
  };
};

export const beginAppleLogin = async ({ family }: { family: string }) => {
  const validation = familySchema.safeParse(family);
  if (!validation.success) {
    return {
      error: true,
      message: validation.error.issues[0]?.message ?? "Family name is required",
    };
  }

  const familyResult = await findRegisteredFamily(family);
  if (!familyResult.success || !familyResult.familyId) {
    return {
      error: true,
      message: "Family name is not registered in My Family Social",
    };
  }

  const cookieStore = await cookies();
  cookieStore.set(
    OAUTH_FAMILY_COOKIE,
    JSON.stringify({ familyName: familyResult.familyName, familyId: familyResult.familyId }),
    {
      httpOnly: true,
      secure: true,
      // Apple uses response_mode=form_post, so callback is a cross-site POST.
      // SameSite=Lax blocks cookies on that POST; None allows the callback to read family context.
      sameSite: "none",
      path: "/",
      maxAge: 60 * 10,
    }
  );

  return {
    error: false,
  };
};
