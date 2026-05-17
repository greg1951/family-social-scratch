"use client";

import { ThreadTemplateEditPage } from "@/features/threads/components/thread-template-edit-page";
import { ThreadTemplate } from "@/components/db/types/thread-templates";

type ThreadTemplateEditWrapperProps = {
  initialTemplate?: ThreadTemplate;
};

export function ThreadTemplateEditWrapper({ initialTemplate }: ThreadTemplateEditWrapperProps) {
  return <ThreadTemplateEditPage initialTemplate={ initialTemplate } />;
}
