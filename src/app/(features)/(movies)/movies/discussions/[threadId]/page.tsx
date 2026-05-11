import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getDiscussionThreadDetail } from "@/components/db/sql/queries-discuss-threads";
import { getMemberPageDetails } from "@/features/family/services/family-services";
import DiscussionPostsReplies from "@/components/discuss/discussion-posts-replies";
import InitialPostComposer from "@/components/discuss/initial-post-composer";
import { ArrowLeftIcon } from "lucide-react";

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default async function MovieDiscussionThreadPage({
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
    targetType: "movie",
    currentMemberId: memberKeyDetails.memberId,
  });

  if (!detailResult.success) {
    notFound();
  }

  const thread = detailResult.thread;

  return (
    <section className="font-app w-full px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,rgba(96,32,0,0.95),rgba(140,56,12,0.86)_56%,rgba(184,88,24,0.78))] px-6 py-8 text-white shadow-[0_28px_80px_-40px_rgba(60,20,0,0.95)] sm:px-8 lg:px-10">
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.34em] text-[#ffd9b5]">
            Movie Discussion
          </p>
          <Link
            href="/movies"
            className="mt-5 inline-flex items-center rounded-full border border-white/35 bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#ffe8d1] transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <ArrowLeftIcon className="mr-2 h-3 w-3" />
            Back to Movies
          </Link>
          <h1 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">
            { thread.discussTopic }
          </h1>
          <p className="mt-2 text-sm text-[#ffe8d1]">
            Started by { thread.postMemberFirstName } on { formatDate(thread.createdAt) }
          </p>
          {/* <div className="mt-4 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#ffe8d1]">
            <span>{ thread.status }</span>
            <span>Movie #{ thread.targetId }</span>
          </div> */}
        </div>

        <div className="overflow-hidden rounded-[1.9rem] border border-white/70 bg-white/90 shadow-[0_24px_70px_-40px_rgba(96,32,0,0.75)]">
          <div className="border-b border-[#f0d9c4] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,248,240,0.86))] px-5 py-5 sm:px-6">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#a85a3a]">
              Thread Posts and Replies
            </p>
          </div>
          { thread.postsAndReplies.length === 0 ? (
            <div className="px-5 py-5 sm:px-6">
              <InitialPostComposer
                threadId={ thread.id }
                threadTopic={ thread.discussTopic }
                revalidatePaths={ ["/movies", `/movies/discussions/${ thread.id }`] }
              />
            </div>
          ) : (
            <DiscussionPostsReplies
              threadId={ thread.id }
              entries={ thread.postsAndReplies }
              currentMemberId={ memberKeyDetails.memberId }
              revalidatePaths={ ["/movies", `/movies/discussions/${ thread.id }`] }
            />
          ) }
        </div>
      </div>
    </section>
  );
}
