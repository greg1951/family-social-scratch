import { notFound, redirect } from "next/navigation";

import { getMemberSupportIssueResponseContextAction } from "@/app/(support)/(logged-in)/open-issue/actions";
import { MemberSupportResponseForm } from "@/features/support/components/member-support-response-form";
import { getMemberPageDetails } from "@/features/family/services/family-services";

export default async function SupportReplyPage({
  searchParams,
}: {
  searchParams: Promise<{ supportIssueId?: string; issueResponseId?: string }>;
}) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn) {
    redirect("/login");
  }

  const resolvedSearchParams = await searchParams;
  const supportIssueId = Number(resolvedSearchParams.supportIssueId);
  const issueResponseId = Number(resolvedSearchParams.issueResponseId);

  if (!Number.isFinite(supportIssueId) || !Number.isFinite(issueResponseId)) {
    notFound();
  }

  const contextResult = await getMemberSupportIssueResponseContextAction(supportIssueId, issueResponseId);

  if (!contextResult.success) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(138,187,206,0.24),transparent_34%),linear-gradient(180deg,#f5fbfd_0%,#edf5f8_100%)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <MemberSupportResponseForm
          memberName={ `${ memberDetails.firstName } ${ memberDetails.lastName }`.trim() }
          familyName={ memberDetails.familyName }
          supportIssueId={ contextResult.issue.id }
          issueResponseId={ contextResult.response.id }
          issueTitle={ contextResult.issue.issueTitle }
          issueStatus={ contextResult.issue.status }
          issueJson={ contextResult.issue.issueJson }
          responseJson={ contextResult.response.responseJson }
          isProposedSolution={ contextResult.response.isProposedSolution }
        />
      </div>
    </main>
  );
}
