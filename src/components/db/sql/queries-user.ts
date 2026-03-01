"use server";

import { count, eq, and } from 'drizzle-orm';
import { user } from '../schema/family-social-schema-tables';
import db from '@/components/db/drizzle';
import { hashUserPassword } from "@/features/auth/services/hash";
import { ErrorReturnType, 
         UserPasswordReturnType, 
         GetFullUserCredsReturnType, 
         GetUser2faReturnType,
         Update2faSecretRecordType,
         Update2faActivatedRecordType,
         EmailByIdReturnType,
         RegisteredReturnType, } from "@/components/db/types/user"
import { Result } from 'pg';
import { findRegisteredFamily } from './queries-family-member';

/* Validate the user exists in the user table */
export async function isUserRegistered(email: string) {
  const result = await db
    .select({count: count()})
    .from(user)
    .where(eq(user.email, email)); 
  
  if (result[0].count > 0)
    return true;
  else
    return false;
}

/* 
  insert user into the user table 
  IMPORTANT: The insert must also handle the member table insert
*/
export async function insertRegisteredUser(email: string, password: string, familyId: number)
: Promise<RegisteredReturnType> {
    const hashedPassword = hashUserPassword(password);

    console.warn('queries-user->insertRegisteredUser->THE member_id IS HARD-CODED HERE!')
    const result = await db.insert(user).values({
      email: email,
      password: hashedPassword,
      familyId: familyId,
      memberId: 1,

    }).returning();
    return {
      id: result[0].id,
      email: result[0].email!,
      password: result[0].password,
      mfaSecret: result[0].twoFactorSecret!,
      mfaActivated: result[0].twoFactorActivated!
    }

}

export async function updateUserPassword(email: string, password: string) 
: Promise<ErrorReturnType> {
  const hashedPassword = hashUserPassword(password);
  let returnedResult;
  try {
      await db.update(user)
        .set({password: hashedPassword})
        .where(eq(user.email,email))
      ;
      returnedResult = {
        error: false,
      }      
      
    } catch(e: unknown) {
      returnedResult = {
        error: true,
        message: 'Failed to updated password'
      }      
      console.error(returnedResult);
    }      
    return returnedResult;

}

/* This function is used by the Auth.js Credentials provider */
export async function getFullUserCredsByEmail(email: string, family: string)
  : Promise<GetFullUserCredsReturnType> {
  
  const findFamilyResult = await findRegisteredFamily(family);
  console.log("queries-user->findRegisteredFamily->findFamilyResult: ", findFamilyResult);
  if (!findFamilyResult.success) {
    return findFamilyResult;
  }

  const [selectedUser] = await db
    .select({
      id: user.id,
      email: user.email,
      password: user.password,
      isActivated: user.twoFactorActivated,
      secret: user.twoFactorSecret,
      memberId: user.memberId,
    })
    .from(user)
    .where(
      and(
        eq(user.email, email),
        eq(user.familyId, findFamilyResult.familyId as number)
      )
    ); 
     
    /* 
      The stored password contains two elements that are separated by colon.
        1. The user's actual password but hashed
        2. The "salt" used to hash the password; used to hash the clear-text password for comparison to hashed password
    */
    
    if (selectedUser) {
      const passwordParts = selectedUser.password.split(':');
      // console.log('authenticateUserByEmail->passwordParts: ', passwordParts);
  
      const returnedUser = {
        success: true,
        id: selectedUser.id,
        email: selectedUser.email as string,
        password: passwordParts[0],
        salt: passwordParts[1],
        isActivated: selectedUser.isActivated as boolean,
        secret: selectedUser.secret as string,
        familyId: findFamilyResult.familyId,
        memberId: selectedUser?.memberId!,
    }
    return returnedUser;
  }
  /* This user is null but the auth.ts will check for it */
  return selectedUser;
}

export async function getUserByEmail(email: string) 
  : Promise<UserPasswordReturnType>  {
  const [selectedUser] = await db
    .select({
      id: user.id,
      password: user.password,
    })
    .from(user)
    .where(eq(user.email, email)); 

    if (!user) 
      return {
        success: false,
        message: "There were no users found matching that email."
      };
    
    // console.log('getUserByEmail->user: ', user);
    const passwordParts = selectedUser.password.split(':');
    // console.log('getUserByEmail->passwordParts', passwordParts);
    if (passwordParts.length === 2) {
      const fullUserInfo:UserPasswordReturnType = {
        success: true,
        id: selectedUser.id as number,
        password: passwordParts[0],
        salt: passwordParts[1],
      }
      // console.log('getUserByEmail->fullUserInfo: ', fullUserInfo);
      return fullUserInfo;
    }
    else {
      return {
        success: false,
        message: "The credentials could not be parsed properly."
      }
    }
}

export async function getUser2fa(email: string) 
  : Promise<GetUser2faReturnType>  {
  const [selectedUser] = await db
    .select({
      id: user.id,
      secret: user.twoFactorSecret,
      isActivated: user.twoFactorActivated
    })
    .from(user)
    .where(eq(user.email, email)); 

  if (!user) 
    return {
      success: false,
      message: "There were no users found matching that email."
    };
  return {
    success: true, 
    id: selectedUser.id as number,
    secret: selectedUser.secret as string,
    isActivated: selectedUser.isActivated as boolean,
  }
};

export async function updateUser2faSecret(args: Update2faSecretRecordType) 
  : Promise<ErrorReturnType>  {
  const updateResult = await db
    .update(user)
    .set({twoFactorSecret: args.secret})
    .where(eq(user.email, args.email)); 

  if (!updateResult) 
    return {
      error: false,
      message: "Unable to update 2fa string."
    };

  return {
    error: false, 
  }
};

export async function updateUser2faActivated(args: Update2faActivatedRecordType) 
  : Promise<ErrorReturnType>  {

  const updateResult = await db
    .update(user)
    .set({twoFactorActivated: args.isActivated})
    .where(eq(user.email, args.email)); 

  if (!updateResult) 
    return {
      error: false,
      message: "Unable to update 2fa boolean."
    };

  return {
    error: false, 
  }
};

export async function getEmailByUserId(userId: number) 
  : Promise<EmailByIdReturnType>  {
  const [selectedUser] = await db
    .select({
      email: user.email,
    })
    .from(user)
    .where(eq(user.id, userId)); 

    if (!user) 
      return {
        success: false,
        message: "There was no user found matching that id."
      };
    
      return {
        success: true,
        email: selectedUser.email as string
      };
    };

