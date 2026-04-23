"use client";

import { useDeferredValue, useState, useTransition } from "react";
import { MessageSquareText, Search, Lock, Globe, Eye, EyeOff, Archive, Reply, PencilLine, ArchiveRestore } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConvoSummary } from "@/components/db/types/thread-convos";
import { archiveReadThreadsAction, updateThreadArchiveStateAction, updateThreadReadStateAction } from "@/app/(features)/(threads)/threads/actions";

type ThreadsHomePageProps = {
  summaries: ConvoSummary[];
  memberId: number;
  firstName: string;
};

function formatDate(date: Date | null): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

export function ThreadsHomePage({ summaries, memberId, firstName }: ThreadsHomePageProps) {
  const router = useRouter();
  const [isArchiving, startArchivingTransition] = useTransition();
  const [isUpdatingRowState, startRowUpdateTransition] = useTransition();
  const [searchValue, setSearchValue] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "sent" | "received">("all");
  const [readFilter, setReadFilter] = useState<"all" | "read" | "unread">("all");
  const [timeFilter, setTimeFilter] = useState<"all" | "newest" | "oldest">("newest");

  const deferredSearch = useDeferredValue(searchValue);

  const filtered = summaries
    .filter((s) => {
      const isRecipientRow = s.recipientMemberId === memberId;
      // role filter
      if (roleFilter === "sent" && s.senderMemberId !== memberId) return false;
      if (roleFilter === "received" && s.recipientMemberId !== memberId) return false;
      // read filter
      if (readFilter !== "all" && !isRecipientRow) return false;
      if (readFilter === "read" && !s.readAt) return false;
      if (readFilter === "unread" && !!s.readAt) return false;
      // text search
      const q = deferredSearch.trim().toLowerCase();
      if (q) {
        const haystack = [
          s.title,
          s.senderFirstName,
          s.senderLastName,
          s.recipientFirstName,
          s.recipientLastName,
          s.postContent,
          s.visibility,
          s.status,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return timeFilter === "oldest" ? aTime - bTime : bTime - aTime;
    });

  const totalCount = summaries.length;
  const unreadCount = summaries.filter(
    (s) => s.recipientMemberId === memberId && !s.readAt,
  ).length;
  const privateCount = summaries.filter((s) => s.visibility === "private").length;

  function handleArchiveReadThreads() {
    startArchivingTransition(async () => {
      const result = await archiveReadThreadsAction();

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.refresh();
    });
  }

  function handleToggleRowArchive(conversationId: number, shouldArchive: boolean) {
    startRowUpdateTransition(async () => {
      const result = await updateThreadArchiveStateAction({ conversationId, shouldArchive });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.refresh();
    });
  }

  function handleToggleRowRead(conversationId: number, shouldMarkUnread: boolean) {
    startRowUpdateTransition(async () => {
      const result = await updateThreadReadStateAction({ conversationId, shouldMarkUnread });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.refresh();
    });
  }

  return (
    <section className="font-app w-full px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* ── Hero banner ─────────────────────────────────────────────── */ }
        <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,rgba(90,20,120,0.95),rgba(130,40,170,0.86)_56%,rgba(190,100,220,0.78))] px-6 py-8 text-white shadow-[0_28px_80px_-40px_rgba(60,0,90,0.95)] sm:px-8 lg:px-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.34em] text-[#e8c0ff]">
                Family Threads
              </p>
              <Link
                href="/"
                className="mt-3 inline-flex items-center rounded-full border border-white/35 bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#f0d8ff] transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                Back to Main Page
              </Link>
              <h1 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">
                Keep your family conversations in one place, { firstName }.
              </h1>
            </div>

            <div className="grid gap-3 rounded-[1.6rem] border border-white/20 bg-white/10 p-4 shadow-inner backdrop-blur sm:grid-cols-4 lg:min-w-120">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[#e8c0ff]">Total</p>
                <p className="mt-2 text-2xl font-black">{ totalCount }</p>
                <p className="text-sm text-[#f0d8ff]">conversations</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[#e8c0ff]">Unread</p>
                <p className="mt-2 text-2xl font-black">{ unreadCount }</p>
                <p className="text-sm text-[#f0d8ff]">waiting for you</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[#e8c0ff]">Showing</p>
                <p className="mt-2 text-2xl font-black">{ filtered.length }</p>
                <p className="text-sm text-[#f0d8ff]">after filters</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[#e8c0ff]">Private</p>
                <p className="mt-2 text-2xl font-black">{ privateCount }</p>
                <p className="text-sm text-[#f0d8ff]">secured threads</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Conversation list card ───────────────────────────────────── */ }
        <div className="overflow-hidden rounded-[1.9rem] border border-white/70 bg-white/82 shadow-[0_24px_70px_-40px_rgba(90,20,120,0.75)] backdrop-blur">

          {/* Toolbar */ }
          <div className="border-b border-[#e8d0f8] bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(250,240,255,0.85))] px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#8840b0]">
                  Thread Directory
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-[#4a1a6a]">
                  Conversation Finder
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#7a4a9a]">
                  Search and filter your family threads by sender, recipient, read status, or time.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={ handleArchiveReadThreads }
                  disabled={ isArchiving }
                  className="rounded-full bg-[#6d2f93] text-white hover:bg-[#5a2679]"
                >
                  <Archive className="mr-1 size-4" />
                  { isArchiving ? "Archiving..." : "Archive All Read" }
                </Button>

                <Button asChild size="sm" className="rounded-full bg-[#8840b0] text-white hover:bg-[#6d2f93]">
                  <Link href="/threads/compose">
                    <PencilLine className="mr-1 size-4" />
                    Compose
                  </Link>
                </Button>

                <div className="rounded-full border border-[#e8d0f8] bg-[#faf5ff] px-4 py-2 text-sm font-semibold text-[#7a4a9a]">
                  { filtered.length } thread{ filtered.length !== 1 ? "s" : "" } found
                </div>
              </div>
            </div>

            {/* Filters */ }
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {/* Text search */ }
              <div className="relative lg:col-span-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#8840b0]" />
                <Input
                  type="search"
                  value={ searchValue }
                  onChange={ (e) => setSearchValue(e.target.value) }
                  placeholder="Search threads…"
                  className="h-10 rounded-full border-[#d0a8f0] bg-white pl-11 pr-4 text-sm text-[#4a1a6a] shadow-sm"
                  aria-label="Search threads"
                />
              </div>

              {/* Sender / recipient */ }
              <Select value={ roleFilter } onValueChange={ (v) => setRoleFilter(v as typeof roleFilter) }>
                <SelectTrigger className="h-10 rounded-full border-[#d0a8f0] bg-white text-sm text-[#4a1a6a] shadow-sm">
                  <SelectValue placeholder="Sender or Recipient" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All — Sent &amp; Received</SelectItem>
                  <SelectItem value="sent">Sent by me</SelectItem>
                  <SelectItem value="received">Received by me</SelectItem>
                </SelectContent>
              </Select>

              {/* Read status */ }
              <Select value={ readFilter } onValueChange={ (v) => setReadFilter(v as typeof readFilter) }>
                <SelectTrigger className="h-10 rounded-full border-[#d0a8f0] bg-white text-sm text-[#4a1a6a] shadow-sm">
                  <SelectValue placeholder="Read status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All — Read &amp; Unread</SelectItem>
                  <SelectItem value="unread">Unread only</SelectItem>
                  <SelectItem value="read">Read only</SelectItem>
                </SelectContent>
              </Select>

              {/* Time */ }
              <Select value={ timeFilter } onValueChange={ (v) => setTimeFilter(v as typeof timeFilter) }>
                <SelectTrigger className="h-10 rounded-full border-[#d0a8f0] bg-white text-sm text-[#4a1a6a] shadow-sm">
                  <SelectValue placeholder="Sort by time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest first</SelectItem>
                  <SelectItem value="oldest">Oldest first</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */ }
          <div className="px-4 py-4 sm:px-6 sm:py-5">
            <div className="overflow-hidden rounded-[1.4rem] border border-[#e8d0f8]">
              <div className="max-h-128 overflow-auto">
                <table className="w-full min-w-4xl border-collapse text-left">
                  <thead className="sticky top-0 z-10 bg-[#faf5ff] text-xs uppercase tracking-[0.18em] text-[#8840b0]">
                    <tr>
                      <th className="px-4 py-3 font-bold">#</th>
                      <th className="px-4 py-3 font-bold">Title</th>
                      <th className="px-4 py-3 font-bold">Sender</th>
                      <th className="px-4 py-3 font-bold">Recipient</th>
                      <th className="px-4 py-3 font-bold">Visibility</th>
                      <th className="px-4 py-3 font-bold">Type</th>
                      <th className="px-4 py-3 font-bold">Message</th>
                      <th className="px-4 py-3 font-bold">Status</th>
                      <th className="px-4 py-3 font-bold">Sent</th>
                    </tr>
                  </thead>
                  <tbody>
                    { filtered.map((s) => {
                      const isRecipientRow = s.recipientMemberId === memberId;
                      const isUnread = s.recipientMemberId === memberId && !s.readAt;
                      const isArchived = !!s.archivedAt;
                      const canManageRecipientState = isRecipientRow;

                      return (
                        <tr
                          key={ s.id }
                          className={ [
                            "border-t border-[#f0e0ff] transition hover:bg-[#fdf8ff]",
                            isUnread ? "bg-[#fdf5ff]" : "bg-white",
                          ].join(" ") }
                        >
                          {/* ID */ }
                          <td className="px-4 py-3 text-xs font-mono text-[#9a6ab8]">
                            { s.id }
                          </td>

                          {/* Title */ }
                          <td className="px-4 py-3">
                            <Link href={ `/threads/${ s.id }` } className="font-semibold text-[#4a1a6a] underline-offset-4 hover:underline">
                              { s.title }
                            </Link>
                            { isUnread && (
                              <span className="ml-2 inline-block rounded-full bg-[#8840b0] px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-white">
                                New
                              </span>
                            ) }
                          </td>

                          {/* Sender */ }
                          <td className="px-4 py-3 text-sm text-[#5c3a7a]">
                            { s.senderFirstName
                              ? `${ s.senderFirstName } ${ s.senderLastName ?? "" }`.trim()
                              : <span className="text-[#b0a0c0]">—</span> }
                          </td>

                          {/* Recipient */ }
                          <td className="px-4 py-3 text-sm text-[#5c3a7a]">
                            { s.recipientFirstName
                              ? `${ s.recipientFirstName } ${ s.recipientLastName ?? "" }`.trim()
                              : <span className="text-[#b0a0c0]">All</span> }
                          </td>

                          {/* Visibility */ }
                          <td className="px-4 py-3">
                            { s.visibility === "private" ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#fff0e0] px-2 py-1 text-[0.68rem] font-semibold text-[#a06020]">
                                <Lock className="size-3" /> Private
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f8e8] px-2 py-1 text-[0.68rem] font-semibold text-[#208040]">
                                <Globe className="size-3" /> Public
                              </span>
                            ) }
                          </td>

                          {/* Type */ }
                          <td className="px-4 py-3">
                            { s.postType === "reply" ? (
                              <span className="inline-flex items-center gap-1 text-[0.72rem] font-semibold text-[#6060c0]">
                                <Reply className="size-3" /> Reply
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[0.72rem] font-semibold text-[#8840b0]">
                                <MessageSquareText className="size-3" /> Post
                              </span>
                            ) }
                          </td>

                          {/* Message preview */ }
                          <td className="max-w-[18rem] px-4 py-3 text-sm text-[#5c3a7a]">
                            { s.visibility === "private" ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f5ecff] px-2 py-1 text-[0.72rem] font-semibold text-[#7a4a9a]">
                                <Lock className="size-3" />
                                Private thread message hidden
                              </span>
                            ) : s.postContent ? (
                              <span className="line-clamp-2 leading-snug">{ s.postContent }</span>
                            ) : (
                              <span className="text-[#b0a0c0]">No message yet</span>
                            ) }
                          </td>

                          {/* Status badges */ }
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1">
                              <span className={ [
                                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold",
                                !isRecipientRow
                                  ? "bg-[#f5f0ff] text-[#8060a0]"
                                  : s.readAt
                                    ? "bg-[#e8f8e8] text-[#208040]"
                                    : "bg-[#fff0e0] text-[#a06020]",
                              ].join(" ") }>
                                { !isRecipientRow
                                  ? <>N/A</>
                                  : s.readAt
                                    ? <><Eye className="size-3" /> Read</>
                                    : <><EyeOff className="size-3" /> Unread</> }
                              </span>
                              { isArchived && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-[#f0e8ff] px-2 py-0.5 text-[0.65rem] font-semibold text-[#7050a0]">
                                  <Archive className="size-3" /> Archived
                                </span>
                              ) }
                              <span className={ [
                                "inline-flex rounded-full px-2 py-0.5 text-[0.65rem] font-semibold",
                                s.status === "active"
                                  ? "bg-[#e8f0ff] text-[#2060c0]"
                                  : s.status === "closed"
                                    ? "bg-[#f0f0f0] text-[#606060]"
                                    : "bg-[#f8f0e8] text-[#906030]",
                              ].join(" ") }>
                                { s.status }
                              </span>

                              { canManageRecipientState && (
                                <div className="mt-1 flex flex-wrap gap-1">
                                  <Button
                                    type="button"
                                    size="sm"
                                    disabled={ isUpdatingRowState }
                                    onClick={ () => handleToggleRowRead(s.id, !isUnread) }
                                    className="h-6 rounded-full bg-[#efe3fa] px-2 text-[0.62rem] font-semibold text-[#5a2a78] hover:bg-[#e1cff2]"
                                  >
                                    { isUnread ? <Eye className="mr-1 size-3" /> : <EyeOff className="mr-1 size-3" /> }
                                    { isUnread ? "Mark Read" : "Mark Unread" }
                                  </Button>

                                  <Button
                                    type="button"
                                    size="sm"
                                    disabled={ isUpdatingRowState }
                                    onClick={ () => handleToggleRowArchive(s.id, !isArchived) }
                                    className="h-6 rounded-full bg-[#efe3fa] px-2 text-[0.62rem] font-semibold text-[#5a2a78] hover:bg-[#e1cff2]"
                                  >
                                    { isArchived ? <ArchiveRestore className="mr-1 size-3" /> : <Archive className="mr-1 size-3" /> }
                                    { isArchived ? "Unarchive" : "Archive" }
                                  </Button>
                                </div>
                              ) }
                            </div>
                          </td>

                          {/* Sent timestamp */ }
                          <td className="whitespace-nowrap px-4 py-3 text-xs text-[#9a7ab8]">
                            { formatDate(s.createdAt) }
                          </td>
                        </tr>
                      );
                    }) }
                  </tbody>
                </table>
              </div>

              { filtered.length === 0 && (
                <div className="border-t border-[#f0e0ff] px-4 py-10 text-center text-sm text-[#8840b0]">
                  No threads match your current filters.
                </div>
              ) }
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
