"use client";

import { useDeferredValue, useState, useTransition } from "react";
import { Search, Lock, Globe, Eye, EyeOff, Archive, Reply, PencilLine, ArchiveRestore, CheckCircle2, CircleOff, Send, ImageIcon, ArrowLeft, Inbox } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConvoSummary } from "@/components/db/types/thread-convos";
import { archiveReadThreadsAction, archiveSenderThreadAction, updateThreadArchiveStateAction, updateThreadReadStateAction } from "@/app/(features)/(threads)/threads/actions";

type ThreadsHomePageProps = {
  summaries: ConvoSummary[];
  memberId: number;
  firstName: string;
};

function formatDate(date: Date | null): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(date));
}

export function ThreadsHomePage({ summaries, memberId, firstName }: ThreadsHomePageProps) {
  const router = useRouter();
  const [isArchiving, startArchivingTransition] = useTransition();
  const [isUpdatingRowState, startRowUpdateTransition] = useTransition();
  const [searchValue, setSearchValue] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "sent" | "received">("all");
  const [readFilter, setReadFilter] = useState<"all" | "read" | "unread" | "archived">("all");
  const [timeFilter, setTimeFilter] = useState<"all" | "newest" | "oldest">("newest");

  const roleFilterLabel = roleFilter === "all"
    ? "All"
    : roleFilter === "sent"
      ? "Sent"
      : "Received";
  const readFilterLabel = readFilter === "all"
    ? "All"
    : readFilter === "read"
      ? "Read"
      : readFilter === "unread"
        ? "Unread"
        : "Archived";
  const timeFilterLabel = timeFilter === "oldest" ? "Oldest" : "Newest";

  const deferredSearch = useDeferredValue(searchValue);

  const filtered = summaries
    .filter((s) => {
      const isRecipientRow = s.recipientMemberId === memberId;
      const isSenderOnly = s.senderMemberId === memberId && !isRecipientRow;
      // derive archived: recipient rows use recipient archivedAt; sender-only rows use conversation archivedAt
      const isArchived = isRecipientRow ? !!s.archivedAt : !!s.conversationArchivedAt;
      // archive filter
      if (readFilter === "archived") {
        if (!isArchived) return false;
      } else {
        // exclude archived from all non-archived views
        if (isArchived) return false;
        // read filter (only applies to recipient rows)
        if (readFilter !== "all" && !isRecipientRow) return false;
        if (readFilter === "read" && !s.readAt) return false;
        if (readFilter === "unread" && !!s.readAt) return false;
      }
      // role filter
      if (roleFilter === "sent" && s.senderMemberId !== memberId) return false;
      if (roleFilter === "received" && s.recipientMemberId !== memberId) return false;
      // text search
      const q = deferredSearch.trim().toLowerCase();
      if (q) {
        const haystack = [
          s.title,
          s.senderFirstName,
          s.senderLastName,
          s.recipientNames.join(" "),
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

  function handleToggleSenderArchive(conversationId: number, shouldArchive: boolean) {
    startRowUpdateTransition(async () => {
      const result = await archiveSenderThreadAction({ conversationId, shouldArchive });

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
    <section className="font-app w-full px-4 pb-8 pt-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">

        {/* ── Hero banner ─────────────────────────────────────────────── */ }
        <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,rgba(90,20,120,0.95),rgba(130,40,170,0.86)_56%,rgba(190,100,220,0.78))] px-4 py-5 text-white shadow-[0_28px_80px_-40px_rgba(60,0,90,0.95)] sm:px-8 sm:py-8 sm:pr-24 lg:px-10 lg:pr-28">
          <div className="flex flex-col gap-3 sm:gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.28em] text-[#e8c0ff] sm:text-[0.72rem] sm:tracking-[0.34em]">
                Family Mail Box
              </p>
              <Link
                href="/"
                className="mt-2 inline-flex items-center rounded-full border border-white/35 bg-white/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#f0d8ff] transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:mt-3 sm:px-4 sm:py-2 sm:text-xs sm:tracking-[0.2em]"
              >
                <ArrowLeft className="font-app mr-1.5 size-3.5 sm:mr-2 sm:size-4" />
                Go Home
              </Link>
              {/* <h1 className="mt-3 text-base font-black leading-snug tracking-tight sm:mt-4 sm:text-3xl">
                Your family messages are here.
              </h1> */}
            </div>
          </div>
        </div>

        {/* ── Conversation list card ───────────────────────────────────── */ }
        <div className="overflow-hidden rounded-[1.9rem] border border-white/70 bg-white/82 shadow-[0_24px_70px_-40px_rgba(90,20,120,0.75)] backdrop-blur">

          {/* Toolbar */ }
          <div className="border-b border-[#e8d0f8] bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(250,240,255,0.85))] px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-3 pr-2 sm:pr-3">
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#8840b0]">
                    Thread Directory
                  </p>
                  <div className="ml-auto flex items-center justify-end gap-3 text-[#7a4a9a] sm:gap-4">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <EyeOff className="size-3.5 sm:size-4 md:size-5" aria-hidden="true" />
                      <span className="text-sm font-black leading-none sm:text-base md:text-xl">{ unreadCount }</span>
                      <span className="text-[10px] font-bold uppercase tracking-[0.16em]">Unread</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Eye className="size-3.5 sm:size-4 md:size-5" aria-hidden="true" />
                      <span className="text-sm font-black leading-none sm:text-base md:text-xl">{ filtered.length }</span>
                      <span className="text-[10px] font-bold uppercase tracking-[0.16em]">Showing</span>
                    </div>
                  </div>
                </div>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-[#4a1a6a]">
                  Message Finder
                </h2>
                {/* <p className="mt-2 max-w-2xl text-sm leading-6 text-[#7a4a9a]">
                  Search and filter your mail box messages by sender, recipient, read status, or time.
                </p> */}
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button asChild size="xs" className="rounded-full bg-[#8840b0] text-white hover:bg-[#6d2f93]">
                  <Link href="/threads/compose">
                    <PencilLine className="mr-1 size-3" />
                    Compose
                  </Link>
                </Button>
                <Button
                  type="button"
                  size="xs"
                  onClick={ handleArchiveReadThreads }
                  disabled={ isArchiving }
                  className="rounded-full bg-[#6d2f93] text-white hover:bg-[#5a2679]"
                >
                  <Archive className="mr-1 size-3" />
                  { isArchiving ? "Archiving..." : "Archive All" }
                </Button>


                {/* <div className="rounded-full border border-[#e8d0f8] bg-[#faf5ff] px-4 py-2 text-sm font-semibold text-[#7a4a9a]">
                  { filtered.length } thread{ filtered.length !== 1 ? "s" : "" } found
                </div> */}
              </div>
            </div>

            {/* Filters */ }
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-nowrap sm:items-center sm:gap-2">
              <div className="relative min-w-0 flex-1">
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

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" className="h-10 shrink-0 rounded-full border-[#d0a8f0] bg-white px-4 text-sm font-semibold text-[#4a1a6a] shadow-sm hover:bg-[#faf5ff] hover:text-[#4a1a6a]">
                    { `Filters: ${ roleFilterLabel } / ${ readFilterLabel } / ${ timeFilterLabel }` }
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 rounded-2xl border-[#e8d0f8] bg-white p-2 text-[#4a1a6a]">
                  <DropdownMenuLabel className="text-xs uppercase tracking-[0.18em] text-[#8840b0]">Sender or Recipient</DropdownMenuLabel>
                  <DropdownMenuItem onClick={ () => setRoleFilter("all") }>All — Sent & Received</DropdownMenuItem>
                  <DropdownMenuItem onClick={ () => setRoleFilter("sent") }>Sent by me</DropdownMenuItem>
                  <DropdownMenuItem onClick={ () => setRoleFilter("received") }>Received by me</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs uppercase tracking-[0.18em] text-[#8840b0]">Read Status</DropdownMenuLabel>
                  <DropdownMenuItem onClick={ () => setReadFilter("all") }>All — Read & Unread</DropdownMenuItem>
                  <DropdownMenuItem onClick={ () => setReadFilter("unread") }>Unread only</DropdownMenuItem>
                  <DropdownMenuItem onClick={ () => setReadFilter("read") }>Read only</DropdownMenuItem>
                  <DropdownMenuItem onClick={ () => setReadFilter("archived") }>Archived only</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs uppercase tracking-[0.18em] text-[#8840b0]">Sort by Time</DropdownMenuLabel>
                  <DropdownMenuItem onClick={ () => setTimeFilter("newest") }>Newest first</DropdownMenuItem>
                  <DropdownMenuItem onClick={ () => setTimeFilter("oldest") }>Oldest first</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Table */ }
          <div className="px-4 py-4 sm:px-6 sm:py-5">
            <div className="overflow-hidden rounded-[1.4rem] border border-[#e8d0f8]">
              <div className="max-h-128 overflow-auto">
                <table className="w-full min-w-4xl border-collapse text-left">
                  <thead className="sticky top-0 z-10 bg-[#faf5ff] text-xs uppercase tracking-[0.18em] text-[#8840b0]">
                    <tr>
                      <th className="px-4 py-3 font-bold">Sent</th>
                      <th className="px-4 py-3 font-bold">Title</th>
                      <th className="px-4 py-3 font-bold">Sender</th>
                      <th className="px-4 py-3 font-bold">Recipients</th>
                      <th className="px-4 py-3 font-bold">Visibility</th>
                      <th className="px-4 py-3 font-bold">Activity</th>
                      <th className="px-4 py-3 font-bold">Message</th>
                      <th className="px-4 py-3 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    { filtered.map((s) => {
                      const isRecipientRow = s.recipientMemberId === memberId;
                      const isSenderOnly = s.senderMemberId === memberId && !isRecipientRow;
                      const isUnread = isRecipientRow && !s.readAt;
                      const isArchived = isRecipientRow ? !!s.archivedAt : !!s.conversationArchivedAt;

                      return (
                        <tr
                          key={ s.id }
                          className={ [
                            "border-t border-[#f0e0ff] transition hover:bg-[#fdf8ff]",
                            isUnread ? "bg-[#fdf5ff]" : "bg-white",
                          ].join(" ") }
                        >
                          {/* Sent timestamp */ }
                          <td className="whitespace-nowrap px-4 py-3 text-sm text-[#9a7ab8]">
                            { formatDate(s.createdAt) }
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
                              ? s.senderFirstName
                              : <span className="text-[#b0a0c0]">—</span> }
                          </td>

                          {/* Recipient */ }
                          <td className="px-4 py-3 text-sm text-[#5c3a7a]">
                            { s.recipientNames.length > 0
                              ? s.recipientNames.join(", ")
                              : <span className="text-[#b0a0c0]">—</span> }
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

                          {/* Activity */ }
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap items-center gap-2 text-[0.72rem] font-semibold text-[#6b4a86]">
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#f5ecff] px-2 py-1 text-[#6d2f93]">
                                <Reply className="size-3" />
                                { s.replyCount }
                              </span>
                              { s.imageCount > 0 && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-[#eef6ff] px-2 py-1 text-[#2f5f93]">
                                  <ImageIcon className="size-3" />
                                  { s.imageCount }
                                </span>
                              ) }
                            </div>
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

                          {/* Status — dropdown trigger */ }
                          <td className="px-4 py-3">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  className="flex flex-col items-start gap-1 rounded-lg p-1 transition hover:bg-[#f5eeff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8840b0]"
                                  aria-label="Thread status actions"
                                >
                                  {/* Read / Unread badge */ }
                                  <span className={ [
                                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold",
                                    !isRecipientRow
                                      ? "bg-[#f5f0ff] text-[#8060a0]"
                                      : s.readAt
                                        ? "bg-[#e8f8e8] text-[#208040]"
                                        : "bg-[#fff0e0] text-[#a06020]",
                                  ].join(" ") }>
                                    { !isRecipientRow
                                      ? <><Send className="size-3" /> Sent</>
                                      : s.readAt
                                        ? <><Eye className="size-3" /> Read</>
                                        : <><EyeOff className="size-3" /> Unread</> }
                                  </span>
                                  {/* Archived / Active / Closed badge */ }
                                  <span className={ [
                                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold",
                                    isArchived
                                      ? "bg-[#f0e8ff] text-[#7050a0]"
                                      : s.status === "active"
                                        ? "bg-[#e8f0ff] text-[#2060c0]"
                                        : "bg-[#f0f0f0] text-[#606060]",
                                  ].join(" ") }>
                                    { isArchived
                                      ? <><Archive className="size-3" /> Archived</>
                                      : s.status === "active"
                                        ? <><CheckCircle2 className="size-3" /> Active</>
                                        : <><CircleOff className="size-3" /> Closed</> }
                                  </span>
                                </button>
                              </DropdownMenuTrigger>

                              { (isRecipientRow || isSenderOnly) && (
                                <DropdownMenuContent align="start" className="w-44">
                                  <DropdownMenuLabel className="text-[0.68rem] uppercase tracking-wide text-[#8840b0]">
                                    Actions
                                  </DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  { isRecipientRow && (
                                    <DropdownMenuItem
                                      disabled={ isUpdatingRowState }
                                      onClick={ () => handleToggleRowRead(s.id, !isUnread) }
                                      className="gap-2 text-sm"
                                    >
                                      { isUnread
                                        ? <><Eye className="size-4" /> Mark Read</>
                                        : <><EyeOff className="size-4" /> Mark Unread</> }
                                    </DropdownMenuItem>
                                  ) }
                                  { isRecipientRow && (
                                    <DropdownMenuItem
                                      disabled={ isUpdatingRowState }
                                      onClick={ () => handleToggleRowArchive(s.id, !isArchived) }
                                      className="gap-2 text-sm"
                                    >
                                      { isArchived
                                        ? <><ArchiveRestore className="size-4" /> Unarchive</>
                                        : <><Archive className="size-4" /> Archive</> }
                                    </DropdownMenuItem>
                                  ) }
                                  { isSenderOnly && (
                                    <DropdownMenuItem
                                      disabled={ isUpdatingRowState }
                                      onClick={ () => handleToggleSenderArchive(s.id, !isArchived) }
                                      className="gap-2 text-sm"
                                    >
                                      { isArchived
                                        ? <><ArchiveRestore className="size-4" /> Unarchive</>
                                        : <><Archive className="size-4" /> Archive</> }
                                    </DropdownMenuItem>
                                  ) }
                                </DropdownMenuContent>
                              ) }
                            </DropdownMenu>
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
