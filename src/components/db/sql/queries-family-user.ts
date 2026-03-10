"use server";

import { eq } from 'drizzle-orm';
import { family, familyInvitation, member, user } from '../schema/family-social-schema-tables';
import db from '@/components/db/drizzle';
import { UserFamilyReturn } from '../types/user';
import { InsertFamilyReturn, 
         InsertInvitesInput, 
         InsertInvitesReturn, 
         InsertMemberInput, 
         InsertMemberReturn, 
         InsertUserInput, 
         InsertUserReturn } from '../types/family-member';
import { hashUserPassword } from '@/features/auth/services/hash';

/*
  Using family name, return the familyId 
*/
export async function getUserFamilyNameByEmail(email: string)
  : Promise<UserFamilyReturn> {

  const [selectResult] = await db.select({
      userId: user.id,
      familyId: user.familyId,
      familyName: family.name,
    })
    .from(user).innerJoin(family, eq(user.familyId, family.id))
    .where(eq(user.email, email)
  );

  if (!selectResult) {
    return {
      success: false,
      message: `User details NOT FOUND on ${email}`
    }
  }

  const userFamilyReturn = {
    success: true, 
    email: email,
    userId: selectResult.userId,
    familyName: selectResult.familyName, 
    familyId: selectResult.familyId,
  };
  return userFamilyReturn;
}

export async function insertFamily(familyName: string)
: Promise<InsertFamilyReturn> {

    console.log("insertFamily-> familyName: ", familyName);

    const [insertResult] = await db.insert(family).values({
      name: familyName,
    }).returning();
    if (!insertResult) {
      return {
        success: false,
        message: `Failed to insert family with name ${familyName}`,
      }
    } 
    
    console.log("insertFamily-> insertResult: ", insertResult);

    return {
      success: true,
      id: insertResult.id,
      name: insertResult.name,
      createdAt: insertResult.createdAt as Date,
    }
}


export async function insertMember(memberArg: InsertMemberInput)
: Promise<InsertMemberReturn> {

    console.log("insertMember-> member: ", memberArg);

    const [insertResult] = await db.insert(member).values({
      email: memberArg.email as string,
      firstName: memberArg.firstName as string,
      lastName: memberArg.lastName as string,
      nickName: memberArg.nickName as string | undefined,
      isFounder: memberArg.isFounder as boolean,
      familyId: memberArg.familyId as number,
    }).returning();
    if (!insertResult) {
      return {
        success: false,
        message: `Failed to insert member with name ${memberArg.firstName} ${memberArg.lastName}`,
      }
    } 
    
    console.log("insertMember-> insertResult: ", insertResult);

    return {
      success: true,
      id: insertResult.id,
      email: insertResult.email,
      firstName: insertResult.firstName,
      lastName: insertResult.lastName,
      nickName: insertResult.nickName!,
      isFounder: insertResult.isFounder,
      createdAt: insertResult.createdAt as Date,
    }
}

export async function insertUser(userArg: InsertUserInput)
: Promise<InsertUserReturn> {

    console.log("insertUser-> user: ", userArg);
    const password = userArg.password as string;
    const hashedPassword = await hashUserPassword(password);

    const [insertResult] = await db.insert(user).values({
      email: userArg.email as string,
      password: hashedPassword as string,
      memberId: userArg.memberId as number,
      familyId: userArg.familyId as number,
    }).returning();
    if (!insertResult) {
      return {
        success: false,
        message: `Failed to insert user with email ${userArg.email}`,
      }
    } 
    
    console.log("insertUser-> insertResult: ", insertResult);

    return {
      success: true,
      id: insertResult.id,
      email: insertResult.email,
      memberId: insertResult.memberId as number,
      familyId: insertResult.familyId as number,
      createdAt: insertResult.createdAt as Date,
    }
}

export async function insertInvites(invitesArg: InsertInvitesInput)
: Promise<InsertInvitesReturn> {

    console.log("insertInvites-> invites: ", invitesArg);

    const insertResult = await db.insert(familyInvitation).values(invitesArg).returning();
    if (!insertResult) {
      return {
        success: false,
        message: `Failed to insert invites`,
      }
    } 
    
    console.log("insertInvites-> insertResult: ", insertResult);
    const returnInvites = insertResult.map((invite) => ({
      id: invite.id,
      email: invite.email,
      firstName: invite.firstName,
      lastName: invite.lastName,
      familyId: invite.familyId,
      createdAt: invite.createdAt as Date,
    }));
    console.log("insertInvites-> returnInvites: ", returnInvites);

    return {
      success: true,
      invites: returnInvites,
    }
}
