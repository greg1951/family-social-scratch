'use server';

import { updateMemberNotifications } from "@/components/db/sql/queries-family-notifications";
import { NotificationFDirtyields, NotificationsFormValues } from "@/features/family/types/family-steps";

export async function updateNotifications({notificationFormValues, notificationDirtyFields}
  : { notificationFormValues: NotificationsFormValues, notificationDirtyFields: NotificationFDirtyields }  ) {

  const updateResult = updateMemberNotifications({ notificationFormValues, notificationDirtyFields });

}