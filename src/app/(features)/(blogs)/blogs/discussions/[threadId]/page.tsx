import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";

import DiscussionPostsReplies from "@/components/discuss/discussion-posts-replies";
import InitialPostComposer from "@/components/discuss/initial-post-composer";
import { getDiscussionThreadDetail } from "@/components/db/sql/queries-discuss-threads";
import { getMemberPageDetails } from "@/features/family/services/family-services";

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default async function BlogDiscussionThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const memberKeyDetails = await getMemberPageDetails();

  if (!memberKeyDetails.isLoggedIn) {
    redirect("/");
  }

  const resolvedParams = await params;
  const threadId = Number(resolvedParams.threadId);

  if (!Number.isFinite(threadId)) {
    notFound();
  }

  const detailResult = await getDiscussionThreadDetail(threadId, memberKeyDetails.familyId, {
    targetType: "blog",
    currentMemberId: memberKeyDetails.memberId,
  });

  if (!detailResult.success) {
    notFound();
  }

  const thread = detailResult.thread;

  return (
    <section className="font-app w-full px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-[#d8e7cf] bg-[linear-gradient(135deg,rgba(63,111,45,0.95),rgba(89,138,68,0.86)_56%,rgba(116,164,92,0.78))] px-6 py-8 text-white shadow-[0_28px_80px_-40px_rgba(37,74,27,0.9)] sm:px-8 lg:px-10">
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.34em] text-[#e8f4dc]">
            Blog Discussion
          </p>
          <Link
            href="/blogs"
            className="mt-5 inline-flex items-center rounded-full border border-white/35 bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#f2faeb] transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <ArrowLeftIcon className="mr-2 h-3 w-3" />
            Back to Blogs
          </Link>
          <h1 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">
            { thread.discussTopic }
          </h1>
          <p className="mt-2 text-sm text-[#f2faeb]">
            Started by { thread.postMemberFirstName } on { formatDate(thread.createdAt) }
          </p>
        </div>

        <div className="overflow-hidden rounded-[1.9rem] border border-[#d8e7cf] bg-white shadow-[0_24px_70px_-40px_rgba(37,74,27,0.65)]">
          <div className="border-b border-[#d8e7cf] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,251,238,0.95))] px-5 py-5 sm:px-6">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#5a7d42]">
              Thread Posts and Replies
            </p>
          </div>
          { thread.postsAndReplies.length === 0 ? (
            <div className="px-5 py-5 sm:px-6">
              <InitialPostComposer
                threadId={ thread.id }
                threadTopic={ thread.discussTopic }
                revalidatePaths={ ["/blogs", `/blogs/discussions/${ thread.id }`] }
              />
            </div>
          ) : (
            <DiscussionPostsReplies
              threadId={ thread.id }
              entries={ thread.postsAndReplies }
              currentMemberId={ memberKeyDetails.memberId }
              revalidatePaths={ ["/blogs", `/blogs/discussions/${ thread.id }`] }
            />
          ) }
        </div>
      </div>
    </section>
  );
}
