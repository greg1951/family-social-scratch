import { getMemberPageDetails } from "@/features/family/services/family-services";
import { redirect } from "next/navigation";

import { OpenIssueForm } from "@/features/support/components/open-issue-form";

export default async function OpenIssuePage() {
  const memberKeyDetails = await getMemberPageDetails();
  if (!memberKeyDetails.isLoggedIn) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(138,187,206,0.24),transparent_34%),linear-gradient(180deg,#f5fbfd_0%,#edf5f8_100%)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* <div className="mb-8 rounded-[2rem] border border-[#d6e5ec] bg-white/70 px-6 py-6 shadow-[0_18px_70px_rgba(21,52,69,0.10)] backdrop-blur-sm sm:px-8"> */ }
        {/* <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#5d8191]">Family Support</p>
          <h1 className="mt-3 text-3xl font-semibold text-[#153445] sm:text-4xl">Open Issue</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#4c6877] sm:text-base">
            Capture the problem, include context in the rich text editor, and optionally attach a supporting file. Your ticket will be saved against your family support record and assigned to an L1 support person.
          </p>
        </div> */}

        <OpenIssueForm
          memberName={ `${ memberKeyDetails.firstName } ${ memberKeyDetails.lastName }`.trim() }
          familyName={ memberKeyDetails.familyName }
        />
      </div>
    </main>
  );
}
