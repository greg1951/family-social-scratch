"use server";

import { count, eq, and } from 'drizzle-orm';
import { family, member, user } from '../schema/family-social-schema-tables';
import db from '@/components/db/drizzle';
import { GetMemberDetailsReturn, GetFamilyReturn } from '../types/family-member';
import { success } from 'zod';
import { AccountDetails, UpdateMemberReturn, UpdateAccountDetails } from '@/features/auth/auth-types';

/*
  Using family name, return the familyId 
*/
export async function findRegisteredFamily(familyName: string)
  :(Promise<GetFamilyReturn>) {

  // console.log("queries-family-members->findRegisteredFamily->familyName: ", familyName)
  const result = 
    await db
    .select({familyId: family.id})
    .from(family)
    .where(eq(family.name, familyName)); 
  
  if (result[0]) 
    return {
      success: true,
      familyId: result[0].familyId,
      familyName: familyName,
    }
  else {
    // console.log("queries-family-member->findRegisteredFamily->NOT FOUND")
    return {
      success: false,
      message: "Family name was not found",
    }
  }
}

/*
  Query member table using familyId and memberEmail related to a member must include family ID 
*/
export async function findFamilyMember(familyId: number, memberEmail: string) {
  const result = await db
    .select({count: count(), memberId: member.id})
    .from(member)
    .where(
      and(
        eq(member.familyId, familyId),
        eq(member.email, memberEmail)
      )
    ); 

  // console.log('queries-family-members->findFamilyMember->count: ',result[0].count);
  
  if (result[0].count > 0) 
    return {
      error: false,
      memberId: result[0].memberId
    }
  else
    return {
      error: true,
    }
  }

/* Get member details using one SQL statement on family and member tables */
export async function getMemberDetailsByUserId(userId:number)
  :(Promise<GetMemberDetailsReturn>) {

  const [selectResult] = await db.select(
    {
      memberId: member.id,
      familyId: user.familyId,
      firstName: member.firstName,
      lastName: member.lastName,
      nickName: member.nickName,
      birthday: member.birthday,
      cellPhone: member.cellPhone,
      mfaActive: user.twoFactorActivated,
    })
    .from(user).innerJoin(member, eq(user.memberId, member.id))
    .where(eq(user.id, userId)
  );

  if (!selectResult) {
    return {
      success: false,
      message: `Member details NOT FOUND on ${userId}`
    }
  }

  const memberDetails:GetMemberDetailsReturn = {
    success: true,
    familyId: selectResult.familyId,
    memberId: selectResult.memberId,
    userId: userId, 
    firstName: selectResult.firstName, 
    lastName: selectResult.lastName,
    nickName: selectResult?.nickName!,
    birthday: selectResult.birthday,
    cellPhone: selectResult?.cellPhone!,
    mfaActive: selectResult.mfaActive!,
  }  
  return memberDetails;
}

export async function updateMemberDetailsDml(updateAccountDetails: UpdateAccountDetails)
  : Promise<UpdateMemberReturn> {

  // console.log("queries-family-member-udateMemberDetailsDml->memberDetails: ", updateAccountDetails);
  const updateResult = await db.update(member)
     .set({
        firstName: updateAccountDetails.firstName,
        lastName: updateAccountDetails.lastName,
        nickName: updateAccountDetails.nickName!,
        birthday: updateAccountDetails.birthday,
        cellPhone: updateAccountDetails.cellPhone!,
    })
    .where(eq(member.id, updateAccountDetails.memberId));

  if (!updateResult) {
    return {
      success: false,
      message: "Account update failed",
    }
  }

  return {
    success: true,
  }
}
