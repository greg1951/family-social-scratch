import { getThreadTemplate } from "@/components/db/sql/queries-thread-templates";
import { ThreadTemplateEditWrapper } from "@/features/threads/components/thread-template-edit-wrapper";
import { redirect } from "next/navigation";
import { getMemberPageDetails } from "@/features/family/services/family-services";

export default async function ThreadTemplateEditPageRoute({ params }: { params: Promise<{ id: string }> }) {
  const memberKeyDetails = await getMemberPageDetails();

  if (!memberKeyDetails.isLoggedIn || !memberKeyDetails.isAdmin) {
    console.warn("Unauthorized access attempt to edit thread templates page");
    redirect("/");
  }


  const { id } = await params;
  const templateId = parseInt(id, 10);

  if (isNaN(templateId)) {
    return <div>Invalid template ID</div>;
  }

  const result = await getThreadTemplate(templateId);

  if (!result.success) {
    return <div>{ result.message }</div>;
  }

  return <ThreadTemplateEditWrapper initialTemplate={ result.template } />;
}
