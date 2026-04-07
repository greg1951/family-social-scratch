import { count, eq, and } from 'drizzle-orm';
import { optionReference, memberOption } from '../schema/family-social-schema-tables';
import db from '@/components/db/drizzle';
import { GetMemberNotificationsReturn, GetFounderDetailsReturn, InsertInvitesInput, InsertInvitesReturn, InsertMemberNotificationsReturn, GetAllOptionsRefReturn } from '../types/family-member';
import { NotificationFDirtyields, NotificationsFormValues } from "@/features/family/types/family-steps";

export async function getMemberNotifications(memberId: number)
  :(Promise<GetMemberNotificationsReturn>) {

  const notificationResult = await db
    .select()
    .from(memberOption).innerJoin(optionReference, eq(memberOption.optionId, optionReference.id))
    .where(eq(memberOption.memberId, memberId))
    .orderBy(optionReference.id);
  
  if (notificationResult[0]) 
    return {
      success: true,
      memberId: memberId,
      notifications: notificationResult.map(notification => ({
        memberOptionId: notification.member_option.id as number,
        optionId: notification.member_option.optionId as number,
        optionName: notification.option_reference.optionName as string,
        optionDesc: notification.option_reference.category as string,
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

export async function insertMemberNotifications(memberId: number)
: Promise<InsertMemberNotificationsReturn> {

  const optionsResult = await getAllOptionsRef();

  if (!optionsResult.success) {
    return optionsResult;
  }
  else {
    const options = optionsResult.options;
    for (let ix=0; ix < options.length; ix++) {

      const insertResult = await db
        .insert(memberOption)
        .values({
          memberId: memberId,
          optionId: options[ix].id,
          isSelected: false,
        });

      if (!insertResult) {
        console.error("queries-family-member->insertMemberNotifications->FAILED to insert notification for memberId: ", memberId, " and optionId: ", options[ix].id);
        return {  
          success: false,
          message: `Failed to insert notification for memberId ${memberId} and optionId ${options[ix].id}`,
        }
      }
    }

    return {
      success: true,
    }
  }
}

async function getAllOptionsRef()
: Promise<GetAllOptionsRefReturn> {

  const optionsResult = await db
    .select()
    .from(optionReference); 
    
    let options=[];
    if (optionsResult) {
      options=optionsResult.map(option => ({
        id: option.id as number,
        optionName: option.optionName as string,
        optionDesc: option.category as string,
      }))
    return {
      success: true,
      options: options,
    }
  }
  return {
    success: false,
    message: "No options found",
  }
}
