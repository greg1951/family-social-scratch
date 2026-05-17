import { getThreadTemplates } from "@/components/db/sql/queries-thread-templates";
import { ThreadTemplateListPage } from "@/features/threads/components/thread-template-list-page";
import { redirect } from "next/navigation";
import { getMemberPageDetails } from "@/features/family/services/family-services";

export default async function ThreadTemplatePage() {
  const memberKeyDetails = await getMemberPageDetails();

  if (!memberKeyDetails.isLoggedIn || !memberKeyDetails.isAdmin) {
    console.warn("Unauthorized access attempt to thread templates page");
    redirect("/");
  }

  const result = await getThreadTemplates();

  if (!result.success) {
    return <div>Error loading templates: { result.message }</div>;
  }

  return <ThreadTemplateListPage initialTemplates={ result.templates } />;
}
