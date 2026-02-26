"use server";

import { count, eq, and } from 'drizzle-orm';
import { family, member } from '../schema/family-social-schema-tables';
import db from '@/components/db/drizzle';
import { GetMemberDetailsReturn, GetFamilyReturn } from '../types/family-member';

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

/*
  Get member details using one SQL statement on family and member tables
*/
export async function getMemberDetailsByEmail(memberEmail:string)
  :(Promise<GetMemberDetailsReturn>) {



  const memberDetails:GetMemberDetailsReturn = {
    success: true,
    email: "", 
    familyName: "",
    familyId: 1,
    memberId: 1,
    userId: 1, 
    firstName: "", 
    lastName: "",
    nickName: "",
    birthday: "",
    cellPhone: "",
  }  
  return memberDetails;
}
