"use server";

import { count, eq, and } from 'drizzle-orm';
import { family, member, user } from '../schema/family-social-schema-tables';
import db from '@/components/db/drizzle';
import { UserFamilyReturn } from '../types/user';

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
