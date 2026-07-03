'use server';

import { updateMemberNotifications } from "@/components/db/sql/queries-family-notifications";
import { NotificationFDirtyields, NotificationsFormValues } from "@/features/family/types/family-steps";
import { revalidatePath } from "next/cache";

export async function updateNotifications({notificationFormValues, notificationDirtyFields}
  : { notificationFormValues: NotificationsFormValues, notificationDirtyFields: NotificationFDirtyields }  ) {

  const updateResult = await updateMemberNotifications({ notificationFormValues, notificationDirtyFields });

  if (updateResult.success) {
    revalidatePath("/family-founder-account");
    revalidatePath("/family-member-account");
    revalidatePath("/family-notifications");
  }

  return updateResult;

}