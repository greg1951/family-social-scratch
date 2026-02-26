"use server";

import { passwordReset } from '../schema/family-social-schema-tables';
import db from '../drizzle';
import { eq } from 'drizzle-orm';
import { getEmailByUserId } from './queries-user';
import { InsertRecordType,
         InsertReturnType, 
         PasswordTokenRecordType,
         GetPasswordTokenReturnType,
         RemoveReturnType } from "@/components/db/types/passwordReset";

export async function insertPasswordToken(arg: InsertRecordType)
: Promise<InsertReturnType> {
  try {
    const result = await db.insert(passwordReset).values({
      userId: arg.userId,
      token: arg.token,
      tokenExpiry: arg.tokenExpiry
    }).returning()
      .onConflictDoUpdate({
        target: passwordReset.userId,
        set: {
          token: arg.token, 
          tokenExpiry: arg.tokenExpiry
        }
      });

    if (!result) {
      return {
        error: true,
        message: "Error inserting into passwordResetTokens table"
      }
    };

    // console.log('insertPasswordToken->result: ',result);
    return {
      error: false
    }
  }catch (e:unknown) {
      return {
        error: true,
        message: "Unknow error occured in the passwordResetTokens table"
      }
    }
  }

export async function getPasswordToken(arg: PasswordTokenRecordType)
: Promise<GetPasswordTokenReturnType> {
  const [passwordResetToken] = await db
    .select()
    .from(passwordReset)
    .where(eq(passwordReset.token,arg.token));

    if (!passwordResetToken) {
      return {
        error: true,
        message: "Did not find token"
      }
    };

    let isValid: boolean=false;
    let validEmail;
    const now = Date.now();
    if (!!passwordResetToken.tokenExpiry && now < passwordResetToken.tokenExpiry.getTime()) {
      isValid=true;
      // console.log('getPasswordToken=>userId: ', passwordResetToken.userId);
      const result = await getEmailByUserId(passwordResetToken.userId);
      if (!result.success) {
        return {
          error: false,
          message: "Did not find id in users table"
        };
      };
      validEmail=result.email;
    }
    

    return {
      error: false,
      email: validEmail,
      tokenExpiry: passwordResetToken.tokenExpiry as Date,
      isValidExpiry: isValid
    };
};

export async function removePasswordToken(userId: number)
: Promise<RemoveReturnType> {
  const result = await db
    .delete(passwordReset)
    .where(eq(passwordReset.userId,userId));

    if (!result) {
      return {
        error: true,
        message: "Password Token removal issue"
      }
    };

    return {
      error: false,
    };
  };
      


