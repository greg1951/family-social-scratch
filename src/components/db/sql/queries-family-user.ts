"use server";

import { count, eq, and } from 'drizzle-orm';
import { family, member, user } from '../schema/family-social-schema-tables';
import db from '@/components/db/drizzle';
import { UserFamilyReturn } from '../types/user';
import { success } from 'zod';
import { InsertFamilyReturn } from '../types/family-member';

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

