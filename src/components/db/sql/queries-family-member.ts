"use server";

import { count, eq, and } from 'drizzle-orm';
import { family, familyInvitation, member, optionReference, user, memberOption } from '../schema/family-social-schema-tables';
import db from '@/components/db/drizzle';
import { GetMemberDetailsReturn, GetFamilyReturn, GetAllFamiliesReturn, GetAllFamilyMembersReturn, GetFounderDetailsReturn } from '../types/family-member';
import { UpdateMemberReturn, UpdateAccountDetails } from '@/features/auth/types/auth-types';
import { GetMemberDetailsByEmailReturn, UpdateInvite } from '@/features/family/types/family-members';

/*-------- findRegisteredFamily ------------------ */
export async function findRegisteredFamily(familyName: string)
  :(Promise<GetFamilyReturn>) {

  // console.log("queries-family-members->findRegisteredFamily->familyName: ", familyName)
  const [result] = 
    await db
    .select()
    .from(family)
    .where(eq(family.name, familyName)); 
  
  if (result) 
    return {
      success: true,
      familyId: result.id,
      status: result.status,
      expirationDate: result.expirationDate as Date,
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

/*-------- getAllFamilies ------------------ */
export async function getAllFamilies()
  :(Promise<GetAllFamiliesReturn>) {

  const result = 
    await db
    .select({name: family.name})
    .from(family);
  
  if (result[0]) 
    return {
      success: true,
      familyNames: result.map(r => r.name),
    }
  else {
    return {
      success: false,
      message: "No families found",
    }
  }
}

/*-------- findFamilyMember ------------------ */
export async function findFamilyMember(familyId: number, memberEmail: string) {
  const [result] = await db
    .select({memberId: member.id})
    .from(member)
    .where(
      and(
        eq(member.familyId, familyId),
        eq(member.email, memberEmail)
      )
    ); 

  // console.log('queries-family-members->findFamilyMember->count: ',result[0].count);
  
  if (result) 
    return {
      error: false,
      memberId: result.memberId
    }
  else
    return {
      error: true,
    }
  }

/*------------------ getMemberDetailsByUserId ------------------ */
export async function getMemberDetailsByUserId(userId:number)
  :(Promise<GetMemberDetailsReturn>) {

  const [selectResult] = await db.select(
    {
      email: member.email,
      userId: user.id,
      familyName: family.name,
      firstName: member.firstName,
      lastName: member.lastName,
      nickName: member.nickName,
      birthday: member.birthday,
      cellPhone: member.cellPhone,
      isFounder: member.isFounder,
      isAdmin: member.isAdmin,
      status: member.status,
      memberId: member.id,
      familyId: user.familyId,
      mfaActive: user.twoFactorActivated,
    })
    .from(user).rightJoin(member, eq(user.memberId, member.id)).innerJoin(family, eq(member.familyId, family.id))
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
      familyId: selectResult.familyId!,
      familyName: selectResult.familyName!,
      memberId: selectResult.memberId,
      email: selectResult.email!,
      userId: selectResult.userId!,
      status: selectResult.status,
      firstName: selectResult.firstName, 
      lastName: selectResult.lastName,
      nickName: selectResult?.nickName!,
      birthday: selectResult.birthday!,
      cellPhone: selectResult?.cellPhone!,
      isFounder: selectResult.isFounder,
      isAdmin: selectResult.isAdmin,
      mfaActive: selectResult.mfaActive as boolean,
    } ;
  return memberDetails;
}

/*----------------- getMemberDetailsByEmail ------------------ */
export async function getMemberDetailsByEmail(email:string)
  :(Promise<GetMemberDetailsReturn>) {

  const [selectResult] = await db.select(
    {
      memberId: member.id,
      familyId: user.familyId,
      email: member.email,
      familyName: family.name,
      userId: user.id,
      status: member.status,
      firstName: member.firstName,
      lastName: member.lastName,
      nickName: member.nickName,
      birthday: member.birthday,
      cellPhone: member.cellPhone,
      isFounder: member.isFounder,
      isAdmin: member.isAdmin,
      mfaActive: user.twoFactorActivated,
    })
    .from(user).rightJoin(member, eq(user.memberId, member.id)).leftJoin(family, eq(member.familyId, family.id))
    .where(eq(user.email, email)
  );

  if (!selectResult) {
    return {
      success: false,
      message: `Member details NOT FOUND for email ${email}`
    }
  }

  const memberDetails:GetMemberDetailsReturn = {
    success: true,
    email: selectResult.email!,
    userId: selectResult.userId!, 
    status: selectResult.status,
    firstName: selectResult.firstName, 
    lastName: selectResult.lastName,
    nickName: selectResult?.nickName!,
    birthday: selectResult.birthday,
    cellPhone: selectResult?.cellPhone!,
    familyId: selectResult.familyId!,
    familyName: selectResult.familyName!,
    memberId: selectResult.memberId,
    isFounder: selectResult.isFounder,
    isAdmin: selectResult.isAdmin,
    mfaActive: selectResult.mfaActive as boolean,
  }  
  return memberDetails;
}
export async function findMemberIdByEmail(email:string)
  :(Promise<GetMemberDetailsByEmailReturn>) { 
    
  const [selectResult] = await db.select({memberId: member.id})
    .from(member)
    .where(eq(member.email, email)
  );  
  if (!selectResult) {
    return {
      success: false,
      message: `MemberId NOT FOUND for email ${email}`
    }   
  }
  return {
    success: true,
    memberId: selectResult.memberId,
  }
}

/*----------------- getMemberImageDetailsByMemberId ------------------ */
export async function getMemberImageDetailsByMemberId(memberId: number) {
  const [result] = await db
    .select({
      memberId: member.id,
      firstName: member.firstName,
      lastName: member.lastName,
      memberImageUrl: member.memberImageUrl,
    })
    .from(member)
    .where(eq(member.id, memberId));

  if (!result) {
    return {
      success: false,
      message: `Member image details NOT FOUND for memberId ${memberId}`,
    };
  }

  return {
    success: true,
    memberId: result.memberId,
    firstName: result.firstName,
    lastName: result.lastName,
    memberImageUrl: result.memberImageUrl,
  };
}

/*----------------- updateMemberDetails ------------------ */
export async function updateMemberDetails(updateAccountDetails: UpdateAccountDetails)
  : Promise<UpdateMemberReturn> {

  // console.log("queries-family-member-updateMemberDetails->memberDetails: ", updateAccountDetails);
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

/*----------------- updateMemberImageUrl ------------------ */
export async function updateMemberImageUrl(memberId: number, memberImageUrl: string)
  : Promise<UpdateMemberReturn> {

  const [result] = await db
    .update(member)
    .set({
      memberImageUrl,
    })
    .where(eq(member.id, memberId))
    .returning({
      memberId: member.id,
    });

  if (!result) {
    return {
      success: false,
      message: `Failed to update memberImageUrl for memberId ${memberId}`,
    };
  }

  return {
    success: true,
  };
}

/*----------------- getAllFamilyMembers ------------------ */
export async function getAllFamilyMembers(familyId: number)
  :(Promise<GetAllFamilyMembersReturn>) {

  const result = await db
    .select({
      id: familyInvitation.id,
      email: familyInvitation.email,
      firstName: familyInvitation.firstName,
      lastName: familyInvitation.lastName,
      status: familyInvitation.status,
      inviteToken: familyInvitation.inviteToken,
      expirationDate: familyInvitation.expirationDate,
      createdAt: familyInvitation.createdAt,
      familyId: familyInvitation.familyId,
      memberImageUrl: member.memberImageUrl,
    })
    .from(familyInvitation)
    .leftJoin(
      member,
      and(
        eq(familyInvitation.familyId, member.familyId),
        eq(familyInvitation.email, member.email),
      ),
    )
    .where(eq(familyInvitation.familyId, familyId));
  
  if (result[0]) 
    return {
      success: true,
      members: result.map(member => ({
        id: member.id as number,
        email: member.email as string,
        firstName: member.firstName as string,
        lastName: member.lastName as string,
        status: member.status as string,
        memberImageUrl: member.memberImageUrl as string | null,
        inviteToken: member.inviteToken as string,
        expirationDate: member.expirationDate as Date,
        createdAt: member.createdAt as Date,
        familyId: member.familyId as number,
      }))

    }
  else {
    return {
      success: true,
      members: [],
    }
  }
}

/*------------------ getFamilyFounderDetails ------------------ */
export async function getFamilyFounderDetails(familyId:number)
  :(Promise<GetFounderDetailsReturn>) {

  const [selectResult] = await db.select(
    {
      firstName: member.firstName,
      lastName: member.lastName,
      nickName: member.nickName,
      birthday: member.birthday,
      cellPhone: member.cellPhone,
      isFounder: member.isFounder,
      status: member.status,
      memberId: member.id,
      email: member.email,
      familyId: family.id,
      familyName: family.name,
    })
    .from(family)
      .leftJoin(member, eq(family.id, member.familyId))
        .where(and(
          eq(family.id, familyId),
          eq(member.isFounder, true),
        ));

  if (!selectResult) {
    return {
      success: false,
      message: `Founder NOT FOUND for familyId ${familyId}`
    }
  }
  else {
    const founderDetails:GetFounderDetailsReturn = {
      success: true,
      memberId: selectResult.memberId!,
      email: selectResult.email!,
      status: selectResult.status!,
      firstName: selectResult.firstName!, 
      lastName: selectResult.lastName!,
      nickName: selectResult?.nickName!,
      birthday: selectResult.birthday!,
      cellPhone: selectResult?.cellPhone!,
      familyName: selectResult.familyName!,
    }  
    return founderDetails;
  }
}

/*----------------- deleteMember ------------------ */
export async function deleteMember(memberId:number) {
  const deleteResult = await db
    .delete(member)
    .where(eq(member.id, memberId));

  if (!deleteResult) {
    return {
      success: false,
      message: `Failed to delete member with memberId ${memberId}`,
    };
  }
  return {
    success: true,
  };
}
