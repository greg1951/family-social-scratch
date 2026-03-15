import { count, eq, and } from 'drizzle-orm';
import { optionReference, memberOption } from '../schema/family-social-schema-tables';
import db from '@/components/db/drizzle';
import { GetMemberNotificationsReturn, GetFounderDetailsReturn } from '../types/family-member';
import { NotificationFDirtyields, NotificationsFormValues } from "@/features/family/types/family-steps";

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
