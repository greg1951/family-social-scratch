import { and, eq, inArray } from 'drizzle-orm';
import { memberOption } from '../schema/family-social-schema-tables';
import { memberOptionReference } from '../schema/global-schema-tables';
import db from '@/components/db/drizzle';
import { GetMemberNotificationsReturn, InsertMemberNotificationsReturn, GetAllOptionsRefReturn } from '../types/family-member';
import { NotificationFDirtyields, NotificationsFormValues } from "@/features/family/types/family-steps";

export async function getMemberNotifications(memberId: number)
  :(Promise<GetMemberNotificationsReturn>) {

  const syncResult = await syncMemberNotifications(memberId);
  if (!syncResult.success) {
    return {
      success: false,
      message: syncResult.message ?? `Failed to sync member notifications for memberId ${memberId}`,
    };
  }

  const notificationResult = await db
    .select()
    .from(memberOption).innerJoin(memberOptionReference, eq(memberOption.optionId, memberOptionReference.id))
    .where(eq(memberOption.memberId, memberId))
    .orderBy(memberOptionReference.category, memberOptionReference.seqNo, memberOptionReference.id);

  // Safety dedupe for any historical duplicate member_option rows.
  const dedupedNotificationResult = Array.from(
    new Map(
      notificationResult.map((notification) => [notification.member_option.optionId, notification])
    ).values()
  );
  
  if (dedupedNotificationResult[0]) 
    return {
      success: true,
      memberId: memberId,
      notifications: dedupedNotificationResult.map(notification => ({
        memberOptionId: notification.member_option.id as number,
        optionId: notification.member_option.optionId as number,
        optionName: notification.member_option_reference.optionName as string,
        optionCategory: notification.member_option_reference.category as string,
        optionSeqNo: notification.member_option_reference.seqNo as number,
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

  return syncMemberNotifications(memberId);
}

async function syncMemberNotifications(memberId: number)
: Promise<InsertMemberNotificationsReturn> {

  const optionsResult = await getAllOptionsRef();

  if (!optionsResult.success) {
    return optionsResult;
  }

  const options = optionsResult.options;
  if (options.length === 0) {
    return {
      success: true,
    }
  }

  const optionIds = options.map((option) => option.id);

  const dedupeResult = await dedupeMemberOptions(memberId, optionIds);
  if (!dedupeResult.success) {
    return dedupeResult;
  }

  const existingOptions = await db
    .select({ optionId: memberOption.optionId })
    .from(memberOption)
    .where(and(eq(memberOption.memberId, memberId), inArray(memberOption.optionId, optionIds)));

  const existingOptionIds = new Set(existingOptions.map((option) => option.optionId));
  const missingOptions = options.filter((option) => !existingOptionIds.has(option.id));

  if (missingOptions.length === 0) {
    return {
      success: true,
    }
  }

  const insertResult = await db
    .insert(memberOption)
    .values(
      missingOptions.map((option) => ({
        memberId,
        optionId: option.id,
        isSelected: option.isSelected,
      }))
    );

  if (!insertResult) {
    console.error("queries-family-member->syncMemberNotifications->FAILED to insert missing notifications for memberId: ", memberId);
    return {
      success: false,
      message: `Failed to insert missing notifications for memberId ${memberId}`,
    }
  }

  return {
    success: true,
  }
}

async function dedupeMemberOptions(memberId: number, optionIds: number[]): Promise<InsertMemberNotificationsReturn> {
  if (optionIds.length === 0) {
    return { success: true };
  }

  const existingRows = await db
    .select({
      id: memberOption.id,
      optionId: memberOption.optionId,
      isSelected: memberOption.isSelected,
    })
    .from(memberOption)
    .where(and(eq(memberOption.memberId, memberId), inArray(memberOption.optionId, optionIds)));

  const rowsByOption = new Map<number, typeof existingRows>();
  for (const row of existingRows) {
    const rows = rowsByOption.get(row.optionId) ?? [];
    rows.push(row);
    rowsByOption.set(row.optionId, rows);
  }

  for (const rows of rowsByOption.values()) {
    if (rows.length <= 1) {
      continue;
    }

    // Keep the latest row id and merge selection state so a selected duplicate is not lost.
    const sortedRows = [...rows].sort((a, b) => b.id - a.id);
    const keepRow = sortedRows[0];
    const hasAnySelected = sortedRows.some((row) => row.isSelected);

    if (hasAnySelected && !keepRow.isSelected) {
      const updateResult = await db
        .update(memberOption)
        .set({ isSelected: true })
        .where(eq(memberOption.id, keepRow.id));

      if (!updateResult) {
        return {
          success: false,
          message: `Failed to merge duplicate selected state for memberOptionId ${keepRow.id}`,
        };
      }
    }

    const duplicateIds = sortedRows.slice(1).map((row) => row.id);
    if (duplicateIds.length > 0) {
      const deleteResult = await db
        .delete(memberOption)
        .where(inArray(memberOption.id, duplicateIds));

      if (!deleteResult) {
        return {
          success: false,
          message: `Failed to delete duplicate member options for memberId ${memberId}`,
        };
      }
    }
  }

  return {
    success: true,
  };
}

async function getAllOptionsRef()
: Promise<GetAllOptionsRefReturn> {

  const optionsResult = await db
    .select({
      id: memberOptionReference.id,
      optionName: memberOptionReference.optionName,
      optionCategory: memberOptionReference.category,
      optionSeqNo: memberOptionReference.seqNo,
      isSelected: memberOptionReference.isSelected,
    })
    .from(memberOptionReference)
    .orderBy(memberOptionReference.category, memberOptionReference.seqNo, memberOptionReference.id); 
    
    let options: Extract<GetAllOptionsRefReturn, { success: true }>["options"] = [];
    if (optionsResult) {
      options=optionsResult.map(option => ({
        id: option.id as number,
        optionName: option.optionName as string,
        optionCategory: option.optionCategory as string,
        optionSeqNo: option.optionSeqNo as number,
        isSelected: option.isSelected as boolean,
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
