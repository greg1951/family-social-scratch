"use server";

import { count, eq, and, sql, desc } from 'drizzle-orm';
import { user, user2faCode } from '../schema/family-social-schema-tables';
import db from '@/components/db/drizzle';
import { hashUserPassword } from "@/features/auth/services/hash";
import { ErrorReturnType, 
         UserPasswordReturnType, 
         GetFullUserCredsReturnType, 
         GetUser2faReturnType,
         Update2faSecretRecordType,
         Update2faActivatedRecordType,
         EmailByIdReturnType,
         RegisteredReturnType} from "@/components/db/types/user"
import { findRegisteredFamily } from './queries-family-member';

/* Validate the user exists in the user table */
export async function isUserRegistered(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const result = await db
    .select({count: count()})
    .from(user)
    .where(sql`lower(${user.email}) = ${normalizedEmail}`); 
  
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
  const normalizedEmail = email.trim().toLowerCase();
    const hashedPassword = hashUserPassword(password);

    // console.warn('queries-user->insertRegisteredUser->THE member_id IS HARD-CODED HERE!')
    const [insertResult] = await db.insert(user).values({
      email: normalizedEmail,
      password: hashedPassword,
      familyId: familyId,
      // memberId: 1, // I made it optional in the schema
    }).returning();

    return {
      id: insertResult.id,
      // email: insertResult.email!,
      // password: insertResult.password,
      mfaSecret: insertResult.twoFactorSecret!,
      mfaActivated: insertResult.twoFactorActivated!
    }

}

export async function updateUserPassword(email: string, password: string) 
: Promise<ErrorReturnType> {
  const normalizedEmail = email.trim().toLowerCase();
  const hashedPassword = hashUserPassword(password);
  let returnedResult;
  try {
      await db.update(user)
        .set({password: hashedPassword})
        .where(sql`lower(${user.email}) = ${normalizedEmail}`)
      ;
      returnedResult = {
        error: false,
      }      
      
    } catch {
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

  const normalizedEmail = email.trim().toLowerCase();
 
  try {
    const findFamilyResult = await findRegisteredFamily(family);
    // console.log("queries-user->getFullUserCredsByEmail->findFamilyResult: ", findFamilyResult);
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
          sql`lower(${user.email}) = ${normalizedEmail}`,
          eq(user.familyId, findFamilyResult.familyId as number)
        )
      ); 
      
      if (selectedUser) {
        const passwordParts = selectedUser.password.split(':');
    
        const returnedUser = {
          success: true,
          id: selectedUser.id,
          email: selectedUser.email as string,
          password: passwordParts[0],
          salt: passwordParts[1],
          isActivated: selectedUser.isActivated as boolean,
          secret: selectedUser.secret as string,
          familyId: findFamilyResult.familyId,
          memberId: selectedUser.memberId ?? 0,
        }
        return returnedUser;
      }
  }
  catch (e: unknown) {
    console.error("queries-user->getFullUserCredsByEmail->error: ", e);
    return {
      success:false,
      message: 'Insert of user failed'
    }
  }
  return {
    success: false,
    message: "There were no users found matching that email and family combination."
  };
}

/* Retrieve user credential info by email */
export async function getUserByEmail(email: string) 
  : Promise<UserPasswordReturnType>  {
  const normalizedEmail = email.trim().toLowerCase();
  const [selectedUser] = await db
    .select({
      id: user.id,
      password: user.password,  
      memberId: user.memberId,
    })
    .from(user)
    .where(sql`lower(${user.email}) = ${normalizedEmail}`); 

    if (!selectedUser) 
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
        memberId: selectedUser.memberId as number,
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

/* Retrieve only user 2FA info */
export async function getUser2fa(email: string) 
  : Promise<GetUser2faReturnType>  {
  const normalizedEmail = email.trim().toLowerCase();
  const [selectedUser] = await db
    .select({
      id: user.id,
      secret: user.twoFactorSecret,
      isActivated: user.twoFactorActivated
    })
    .from(user)
    .where(sql`lower(${user.email}) = ${normalizedEmail}`); 

  if (!selectedUser) 
    return {
      success: false,
      message: "There were no users found matching that email."
    };

  return {
    success: true, 
    id: selectedUser.id,
    secret: selectedUser.secret ?? undefined,
    isActivated: selectedUser.isActivated ?? false,
  }
};

/* Update user's 2FA secret */
export async function updateUser2faSecret(args: Update2faSecretRecordType) 
  : Promise<ErrorReturnType>  {
  const normalizedEmail = args.email.trim().toLowerCase();
  const updateResult = await db
    .update(user)
    .set({twoFactorSecret: args.secret})
    .where(sql`lower(${user.email}) = ${normalizedEmail}`); 

  if (!updateResult) 
    return {
      error: false,
      message: "Unable to update 2fa string."
    };

  return {
    error: false, 
  }
};

/* Update the user's 2FA activated status */
export async function updateUser2faActivated(args: Update2faActivatedRecordType) 
  : Promise<ErrorReturnType>  {

  const normalizedEmail = args.email.trim().toLowerCase();

  const updateResult = await db
    .update(user)
    .set({twoFactorActivated: args.isActivated})
    .where(sql`lower(${user.email}) = ${normalizedEmail}`); 

  if (!updateResult) 
    return {
      error: false,
      message: "Unable to update 2fa boolean."
    };

  return {
    error: false, 
  }
};

export async function updateUserEmailByMemberId(memberId: number, email: string)
  : Promise<ErrorReturnType> {
  const normalizedEmail = email.trim().toLowerCase();

  const updateResult = await db
    .update(user)
    .set({ email: normalizedEmail })
    .where(eq(user.memberId, memberId));

  if (!updateResult) {
    return {
      error: true,
      message: 'Unable to update user email.',
    };
  }

  return {
    error: false,
  };
}

/* Retrieve user details by id */
export async function getEmailByUserId(userId: number) 
  : Promise<EmailByIdReturnType>  {
  const [selectedUser] = 
    await db
      .select({
        email: user.email,
      })
      .from(user)
      .where(eq(user.id, userId)); 

    if (!selectedUser) 
      return {
        success: false,
        message: "There was no user found matching that id."
      };
    
      return {
        success: true,
        email: selectedUser.email as string
      };
    };

/*---------------------- deleteUser ---------------------- */    
export async function deleteUserByUserId(userId: number) 
  : Promise<ErrorReturnType> {  
    
  const deleteUserResult = await db
    .delete(user)
    .where(eq(user.id, userId));

  if (!deleteUserResult) {
    return {
      error: true,
      message: `Failed to delete user with userId ${userId}`,
    };
  }
  return {
    error: false,
  }
}

export async function deleteUserByMemberId(memberId: number)
  : Promise<ErrorReturnType> {

  const deleteUserResult = await db
    .delete(user)
    .where(eq(user.memberId, memberId));

  if (!deleteUserResult) {
    return {
      error: true,
      message: `Failed to delete user for memberId ${memberId}`,
    };
  }

  return {
    error: false,
  };
}

type UpsertUser2faCodeArgs = {
  userId: number;
  codeNumber: number;
  expires: Date;
};

type ValidateUser2faCodeArgs = {
  userId: number;
  token: string;
};

export async function upsertUser2faCode(args: UpsertUser2faCodeArgs): Promise<ErrorReturnType> {
  try {
    await db.delete(user2faCode).where(eq(user2faCode.userId, args.userId));

    await db.insert(user2faCode).values({
      userId: args.userId,
      code2fa: args.codeNumber,
      expires: args.expires,
    });

    return {
      error: false,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown database error";
    console.error("queries-user->upsertUser2faCode->error:", message);

    if (message.includes("relation \"family_schema.user_2fa_code\" does not exist")) {
      return {
        error: true,
        message: "2FA code table is missing in the database. Please run family schema migrations.",
      };
    }

    return {
      error: true,
      message: `Unable to save 2FA code. ${message}`,
    };
  }
}

export async function validateAndConsumeUser2faCode(args: ValidateUser2faCodeArgs): Promise<{ error: boolean; isValid?: boolean; message?: string; }> {
  const parsedToken = Number.parseInt(args.token, 10);
  if (!Number.isInteger(parsedToken)) {
    return {
      error: true,
      isValid: false,
      message: "Invalid one-time passcode",
    };
  }

  const [foundCode] = await db
    .select({
      id: user2faCode.id,
      code2fa: user2faCode.code2fa,
      expires: user2faCode.expires,
    })
    .from(user2faCode)
    .where(eq(user2faCode.userId, args.userId))
    .orderBy(desc(user2faCode.id))
    .limit(1);

  if (!foundCode) {
    return {
      error: true,
      isValid: false,
      message: "No one-time passcode was found. Please request a new code.",
    };
  }

  const isExpired = foundCode.expires.getTime() < Date.now();
  if (isExpired) {
    return {
      error: true,
      isValid: false,
      message: "This one-time passcode has expired. Please request a new code.",
    };
  }

  if (foundCode.code2fa !== parsedToken) {
    return {
      error: true,
      isValid: false,
      message: "Invalid one-time passcode",
    };
  }

  await db.delete(user2faCode).where(eq(user2faCode.id, foundCode.id));

  return {
    error: false,
    isValid: true,
  };
}
