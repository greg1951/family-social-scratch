import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getThreadConversationDetail } from "@/components/db/sql/queries-thread-convos";
import { ThreadConversationDetailPage } from "@/features/threads/components/thread-conversation-detail-page";
import { getMemberPageDetails } from "@/features/family/services/family-services";

function formatDate(value: Date | null): string {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default async function ThreadConversationDetailRoutePage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const memberKeyDetails = await getMemberPageDetails();

  if (!memberKeyDetails.isLoggedIn) {
    redirect("/");
  }

  const resolvedParams = await params;
  const conversationId = Number(resolvedParams.conversationId);

  if (!Number.isFinite(conversationId)) {
    notFound();
  }

  const detailResult = await getThreadConversationDetail(
    conversationId,
    memberKeyDetails.familyId,
    memberKeyDetails.memberId,
  );

  if (!detailResult.success) {
    notFound();
  }

  const conversation = detailResult.conversation;

  return (
    <section className="font-app w-full px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="overflow-hidden rounded-[1.9rem] border border-white/70 bg-[linear-gradient(135deg,rgba(90,20,120,0.95),rgba(130,40,170,0.86)_56%,rgba(190,100,220,0.78))] px-6 py-8 text-white shadow-[0_28px_80px_-40px_rgba(60,0,90,0.95)] sm:px-8 lg:px-10">
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.34em] text-[#e8c0ff]">
            Family Threads
          </p>
          <h1 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">{ conversation.title }</h1>
          { conversation.subject && (
            <p className="mt-2 text-sm text-[#f0d8ff]">{ conversation.subject }</p>
          ) }
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#edd0ff]">
            <span>{ conversation.visibility }</span>
            <span>{ conversation.status }</span>
            <span>{ formatDate(conversation.createdAt) }</span>
          </div>
          <Link
            href="/threads"
            className="mt-5 inline-flex items-center rounded-full border border-white/35 bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#f0d8ff] transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Back to Threads
          </Link>
        </div>

        <ThreadConversationDetailPage conversation={ conversation } />
      </div>
    </section>
  );
}
