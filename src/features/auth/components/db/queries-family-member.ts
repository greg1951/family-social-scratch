"use server";

import { count, eq, and } from 'drizzle-orm';
import { family, member } from './family-social-schema-tables';
import db from '@/components/db/drizzle';

export async function findRegisteredFamily(familyName: string) {
  console.log("queries-family-members->findRegisteredFamily->familyName: ", familyName)
  const result = 
    await db
    .select({familyId: family.id})
    .from(family)
    .where(eq(family.name, familyName)); 
  
  if (result[0]) 
    return {
      error: false,
      familyId: result[0].familyId
    }
  else {
    console.log("queries-family-member->findRegisteredFamily->NOT FOUND")
    return {
      error: true,
    }

  }
  }

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

  console.log('queries-family-members->findFamilyMember->count: ',result[0].count);
  
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

