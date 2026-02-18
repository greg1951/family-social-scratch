"use server";

import { count, eq } from 'drizzle-orm';
import { users } from './schema';
import db from '@/components/db/drizzle';
import { hashUserPassword } from "@/features/auth/services/hash";
import { ErrorReturnType, 
         UserPasswordReturnType, 
         GetFullUserCredsReturnType, 
         GetUser2faReturnType,
         Update2faSecretRecordType,
         Update2faActivatedRecordType,
         EmailByIdReturnType,
         RegisteredReturnType, } from "@/features/auth/types/users"
import { Result } from 'pg';


export async function isUserRegistered(email: string) {
  const result = await db
    .select({count: count()})
    .from(users)
    .where(eq(users.email, email)); 

  console.log('isUserRegistered->count: ',result[0].count);
  
  if (result[0].count > 0)
    return true;
  else
    return false;
}

export async function insertRegisteredUser(email: string, password: string)
: Promise<RegisteredReturnType> {
    const hashedPassword = hashUserPassword(password);
    
    const result = await db.insert(users).values({
      email: email,
      password: hashedPassword,
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
      await db.update(users)
        .set({password: hashedPassword})
        .where(eq(users.email,email))
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
export async function getFullUserCredsByEmail(email: string)
  : Promise<GetFullUserCredsReturnType> {
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      password: users.password,
      isActivated: users.twoFactorActivated,
      secret: users.twoFactorSecret,
    })
    .from(users)
    .where(eq(users.email, email)); 
    
    /* 
      The stored password contains two elements that are separated by colon.
        1. The user's actual password but hashed
        2. The "salt" used to hash the password; used to hash the clear-text password for comparison to hashed password
    */
    
    if (user) {
      const passwordParts = user.password.split(':');
      // console.log('authenticateUserByEmail->passwordParts: ', passwordParts);
  
      const returnedUser = {
        id: user.id,
        email: user.email as string,
        password: passwordParts[0],
        salt: passwordParts[1],
        isActivated: user.isActivated as boolean,
        secret: user.secret as string,
    }
    return returnedUser;
  }
  /* This user is null but the auth.ts will check for it */
  return user;
}

export async function getUserByEmail(email: string) 
  : Promise<UserPasswordReturnType>  {
  const [user] = await db
    .select({
      id: users.id,
      password: users.password,
    })
    .from(users)
    .where(eq(users.email, email)); 

    if (!user) 
      return {
        success: false,
        message: "There were no users found matching that email."
      };
    
    // console.log('getUserByEmail->user: ', user);
    const passwordParts = user.password.split(':');
    // console.log('getUserByEmail->passwordParts', passwordParts);
    if (passwordParts.length === 2) {
      const fullUserInfo:UserPasswordReturnType = {
        success: true,
        id: user.id as number,
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
  const [user] = await db
    .select({
      id: users.id,
      secret: users.twoFactorSecret,
      isActivated: users.twoFactorActivated
    })
    .from(users)
    .where(eq(users.email, email)); 

  if (!user) 
    return {
      success: false,
      message: "There were no users found matching that email."
    };
  return {
    success: true, 
    id: user.id as number,
    secret: user.secret as string,
    isActivated: user.isActivated as boolean,
  }
};

export async function updateUser2faSecret(args: Update2faSecretRecordType) 
  : Promise<ErrorReturnType>  {
  const updateResult = await db
    .update(users)
    .set({twoFactorSecret: args.secret})
    .where(eq(users.email, args.email)); 

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
    .update(users)
    .set({twoFactorActivated: args.isActivated})
    .where(eq(users.email, args.email)); 

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
  const [user] = await db
    .select({
      email: users.email,
    })
    .from(users)
    .where(eq(users.id, userId)); 

    if (!user) 
      return {
        success: false,
        message: "There was no user found matching that id."
      };
    
      return {
        success: true,
        email: user.email as string
      };
    };

