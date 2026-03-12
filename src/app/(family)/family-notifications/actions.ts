'use server';

import { updateMemberNotifications } from "@/components/db/sql/queries-family-member";
import { NotificationFDirtyields, NotificationsFormValues } from "@/features/family/types/family-steps";

export async function updateNotifications({notificationFormValues, notificationDirtyFields}
  : { notificationFormValues: NotificationsFormValues, notificationDirtyFields: NotificationFDirtyields }  ) {
  console.log("updateNotifications->notificationFormValues: ", notificationFormValues  );
  console.log("updateNotifications->notificationDirtyFields: ", notificationDirtyFields  ); 

  const updateResult = updateMemberNotifications({ notificationFormValues, notificationDirtyFields });
  console.log("updateNotifications->updateResult: ", updateResult  );



}