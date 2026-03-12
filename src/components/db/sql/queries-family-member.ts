"use server";

import { count, eq, and } from 'drizzle-orm';
import { family, familyInvitation, member, optionReference, user, memberOption } from '../schema/family-social-schema-tables';
import db from '@/components/db/drizzle';
import { GetMemberDetailsReturn, GetFamilyReturn, GetAllFamiliesReturn, GetAllFamilyMembersReturn, GetMemberNotificationsReturn } from '../types/family-member';
import { UpdateMemberReturn, UpdateAccountDetails } from '@/features/auth/auth-types';
import { NotificationFDirtyields, NotificationsFormValues, UpdateInviteTokenInput, UpdateInviteTokenResult } from "@/features/family/types/family-steps";

/*
  Using family name, return the familyId 
*/
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
/*
  Return all family names (for search purposes in the trial account setup)
*/
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
      firstName: member.firstName,
      lastName: member.lastName,
      nickName: member.nickName,
      birthday: member.birthday,
      cellPhone: member.cellPhone,
      isFounder: member.isFounder,
      status: member.status,
      memberId: member.id,
      familyId: user.familyId,
      mfaActive: user.twoFactorActivated,
    })
    .from(user).rightJoin(member, eq(user.memberId, member.id))
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
    memberId: selectResult.memberId,
    userId: userId, 
    status: selectResult.status,
    firstName: selectResult.firstName, 
    lastName: selectResult.lastName,
    nickName: selectResult?.nickName!,
    birthday: selectResult.birthday,
    cellPhone: selectResult?.cellPhone!,
    isFounder: selectResult.isFounder,
    mfaActive: selectResult.mfaActive as boolean,
  }  
  return memberDetails;
}

/* Get member details using one SQL statement on family and member tables */
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
    mfaActive: selectResult.mfaActive as boolean,
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

export async function getAllFamilyMembers(familyId: number)
  :(Promise<GetAllFamilyMembersReturn>) {

  const result = await db
    .select()
    .from(familyInvitation)
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

export async function getMemberNotifications(memberId: number)
  :(Promise<GetMemberNotificationsReturn>) {

  const notificationResult = await db
    .select()
    .from(memberOption).innerJoin(optionReference, eq(memberOption.optionId, optionReference.id))
    .where(eq(memberOption.memberId, memberId));
  
  if (notificationResult[0]) 
    return {
      success: true,
      memberId: memberId,
      notifications: notificationResult.map(notification => ({
        memberOptionId: notification.member_option.id as number,
        optionId: notification.member_option.optionId as number,
        optionName: notification.option_reference.optionName as string,
        optionDesc: notification.option_reference.optionDesc as string,
        isSelected: notification.member_option.isSelected as boolean,
      }))

    }
  else {
    return {
      success: true,
      memberId: memberId,
      notifications: [],
    }
  }
}

export async function updateMemberNotifications({notificationFormValues, notificationDirtyFields}
  : { notificationFormValues: NotificationsFormValues, notificationDirtyFields: NotificationFDirtyields }  ) {

    // console.log("queries-family-member->updateMemberNotifications->notificationFormValues: ", notificationFormValues  ); 
    // console.log("queries-family-member->updateMemberNotifications->notificationDirtyFields: ", notificationDirtyFields  );

    type UpdateNotification = {
      memberOptionId: number;
      isSelected: boolean;
    }

    const dirtyNotifications = notificationDirtyFields.notifications ?? [];
    const updatedNotifications: UpdateNotification[] = 
      dirtyNotifications.flatMap((dirtyField, index) => {
        if (dirtyField?.isSelected === undefined) {
          return [];
        }

        const formValue = notificationFormValues.notifications[index];
        if (!formValue) {
          return [];
        }

        return [{
          memberOptionId: formValue.memberOptionId,
          isSelected: formValue.isSelected,
        }];
    });

  // console.log("queries-family-member->updateMemberNotifications->updatedNotifications: ", updatedNotifications  );
  
  if (updatedNotifications.length > 0) {
    for (let ix=0; ix < updatedNotifications.length; ix++) {

      const updateResult = await db
        .update(memberOption)
        .set({isSelected: updatedNotifications[ix].isSelected})
        .where(eq(memberOption.id, updatedNotifications[ix].memberOptionId));

      if (!updateResult) {
        console.error("queries-family-member->updateMemberNotifications->FAILED to update notification with memberOptionId: ", updatedNotifications[ix].memberOptionId);
        return {
          success: false,
          message: `Failed to update notification with memberOptionId ${updatedNotifications[ix].memberOptionId}`, 
        }
      }
    }
    return {
      success: true,
    }
  }
  
  return {
    success: true,
  }
}

export async function updateFamilyInviteToken({inviteToken }: { inviteToken: UpdateInviteTokenInput })
: (Promise<UpdateInviteTokenResult>) {



  return {
    error: false,
  }
  }


