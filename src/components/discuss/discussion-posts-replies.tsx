"use client";
import type { JSONContent } from "@tiptap/core";
import LinkExtension from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor } from "@tiptap/react";
import { useMemo, useState, useTransition } from "react";
import type { DiscussionPostReplyRecord } from "@/components/db/types/discuss-threads";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Bold, Italic, Link2, Underline as UnderlineIcon, Heart, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { addDiscussionReplyAction, toggleDiscussionReactionAction } from "@/components/discuss/discussion-actions";
import { createEmptyTipTapDocument, serializeTipTapDocument } from "@/components/db/types/poem-term-validation";

const TiptapRenderer = dynamic(() => import("./tiptap-renderer"), { ssr: false });

type ThreadEntry = DiscussionPostReplyRecord;

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function isPost(entry: ThreadEntry): boolean {
  return entry.postReplyType.toLowerCase() === "post";
}

function isReply(entry: ThreadEntry): boolean {
  return entry.postReplyType.toLowerCase() === "reply";
}

function compareByThreadOrder(left: ThreadEntry, right: ThreadEntry): number {
  const leftCreatedAt = +new Date(left.createdAt);
  const rightCreatedAt = +new Date(right.createdAt);

  if (left.seqNo !== right.seqNo) {
    return left.seqNo - right.seqNo;
  }

  if (leftCreatedAt !== rightCreatedAt) {
    return leftCreatedAt - rightCreatedAt;
  }

  return left.id - right.id;
}

export default function DiscussionPostsReplies({
  threadId,
  entries,
  currentMemberId,
  revalidatePaths,
}: {
  threadId: number;
  entries: DiscussionPostReplyRecord[];
  currentMemberId: number;
  revalidatePaths?: string[];
}) {
  const router = useRouter();
  const [isSubmittingReply, startSubmitReplyTransition] = useTransition();
  const [isTogglingReaction, startToggleReactionTransition] = useTransition();
  const [expandedEntryIds, setExpandedEntryIds] = useState<Set<number>>(new Set());
  const [replyTargetId, setReplyTargetId] = useState<number | null>(null);
  const [replyCaption, setReplyCaption] = useState("");

  const replyEditor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      LinkExtension.configure({
        autolink: true,
        defaultProtocol: "https",
        openOnClick: true,
      }),
    ],
    content: createEmptyTipTapDocument() as JSONContent,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "tiptap min-h-[8rem] text-sm leading-6 text-[#15384a] focus:outline-none",
      },
    },
  });

  const entryById = useMemo(() => {
    const map = new Map<number, ThreadEntry>();

    for (const entry of entries) {
      map.set(entry.id, entry as ThreadEntry);
    }

    return map;
  }, [entries]);

  // Collect all entry IDs for expand/collapse all
  const allEntryIds = useMemo(() => entries.map((e) => e.id), [entries]);

  const { posts, childRepliesByParentId, resolvedParentIdByReplyId, orphanReplies } = useMemo(() => {
    const threadEntries = (entries as ThreadEntry[]).slice().sort(compareByThreadOrder);
    const postsList = threadEntries.filter(isPost);
    const replies = threadEntries.filter(isReply);
    const postIds = new Set(postsList.map((post) => post.id));
    const childRepliesMap = new Map<number, ThreadEntry[]>();
    const parentByReplyId = new Map<number, number>();
    const unmatchedReplies: ThreadEntry[] = [];

    for (const reply of replies) {
      let resolvedParentId: number | null = null;

      if (reply.parentPostId && entryById.has(reply.parentPostId)) {
        resolvedParentId = reply.parentPostId;
      } else if (reply.rootPostId && postIds.has(reply.rootPostId)) {
        resolvedParentId = reply.rootPostId;
      } else {
        const fallbackPost = [...postsList].reverse().find((post) => post.seqNo < reply.seqNo);
        resolvedParentId = fallbackPost?.id ?? null;
      }

      if (!resolvedParentId) {
        unmatchedReplies.push(reply);
        continue;
      }

      parentByReplyId.set(reply.id, resolvedParentId);

      const currentReplies = childRepliesMap.get(resolvedParentId) ?? [];
      currentReplies.push(reply);
      childRepliesMap.set(resolvedParentId, currentReplies);
    }

    for (const repliesForParent of childRepliesMap.values()) {
      repliesForParent.sort(compareByThreadOrder);
    }

    return {
      posts: postsList,
      childRepliesByParentId: childRepliesMap,
      resolvedParentIdByReplyId: parentByReplyId,
      orphanReplies: unmatchedReplies.sort(compareByThreadOrder),
    };
  }, [entries, entryById]);

  function toggleExpanded(entryId: number) {
    setExpandedEntryIds((previous) => {
      const next = new Set(previous);
      if (next.has(entryId)) {
        next.delete(entryId);
      } else {
        next.add(entryId);
      }
      return next;
    });
  }

  function expandAll() {
    setExpandedEntryIds(new Set(allEntryIds));
  }

  function collapseAll() {
    setExpandedEntryIds(new Set());
  }

  function handleReplyClick(entryId: number) {
    const selectedEntry = entries.find((entry) => entry.id === entryId);

    if (!selectedEntry || selectedEntry.authorMemberId === currentMemberId) {
      return;
    }

    setReplyTargetId(entryId);
    setReplyCaption("");
    if (replyEditor) {
      replyEditor.commands.setContent(createEmptyTipTapDocument() as JSONContent);
      replyEditor.commands.focus("end");
    }
  }

  function handleCancelReply() {
    setReplyTargetId(null);
    setReplyCaption("");
    if (replyEditor) {
      replyEditor.commands.setContent(createEmptyTipTapDocument() as JSONContent);
    }
  }

  function handleSubmitReply(replyToEntryId: number) {
    if (!replyEditor) {
      toast.error("Reply editor is still loading.");
      return;
    }

    const summary = replyCaption.trim();
    if (!summary) {
      toast.error("Reply Caption is required.");
      return;
    }

    const contentJson = serializeTipTapDocument(replyEditor.getJSON() as JSONContent);

    startSubmitReplyTransition(async () => {
      const result = await addDiscussionReplyAction({
        threadId,
        replyToEntryId,
        summary,
        contentJson,
        revalidatePaths,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      setReplyTargetId(null);
      setReplyCaption("");
      replyEditor.commands.setContent(createEmptyTipTapDocument() as JSONContent);
      router.refresh();
    });
  }

  function handleToggleReaction(postId: number, reactionType: number) {
    startToggleReactionTransition(async () => {
      const result = await toggleDiscussionReactionAction({
        postId,
        reactionType,
        revalidatePaths,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      router.refresh();
    });
  }

  function handleSetReplyLink() {
    if (!replyEditor) {
      return;
    }

    const currentUrl = replyEditor.getAttributes("link").href as string | undefined;
    const nextUrl = window.prompt("Enter URL", currentUrl ?? "https://");

    if (nextUrl === null) {
      return;
    }

    const normalizedUrl = nextUrl.trim();

    if (!normalizedUrl) {
      replyEditor.chain().focus().unsetLink().run();
      return;
    }

    replyEditor.chain().focus().extendMarkRange("link").setLink({ href: normalizedUrl }).run();
  }

  function renderReplyComposer(replyToEntryId: number, panelClassName: string) {
    if (replyTargetId !== replyToEntryId) {
      return null;
    }

    return (
      <div className={ panelClassName }>
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[#4f7384]">
          Write Reply
        </p>
        <label className="block mb-2 text-xs font-semibold text-[#4f7384]" htmlFor="reply-caption-input">
          Reply Caption
        </label>
        <input
          id="reply-caption-input"
          type="text"
          value={ replyCaption }
          onChange={ (e) => setReplyCaption(e.target.value) }
          placeholder="Enter a short summary/caption for this reply"
          className="mb-4 w-full rounded border border-[#cfe3ec] bg-white px-3 py-2 text-sm text-[#15384a] focus:outline-none focus:ring-2 focus:ring-[#59cdf7]"
          maxLength={ 120 }
          disabled={ isSubmittingReply }
        />
        <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl border border-[#cfe3ec] bg-white px-2 py-2">
          <button
            type="button"
            onClick={ () => replyEditor?.chain().focus().toggleBold().run() }
            className={ [
              "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition",
              replyEditor?.isActive("bold")
                ? "border-[#2d87a8] bg-[#e4f4fb] text-[#1f5a70]"
                : "border-[#c9e2ec] bg-white text-[#2c5f75] hover:bg-[#eef8fc]",
            ].join(" ") }
            aria-label="Bold"
          >
            <Bold className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={ () => replyEditor?.chain().focus().toggleItalic().run() }
            className={ [
              "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition",
              replyEditor?.isActive("italic")
                ? "border-[#2d87a8] bg-[#e4f4fb] text-[#1f5a70]"
                : "border-[#c9e2ec] bg-white text-[#2c5f75] hover:bg-[#eef8fc]",
            ].join(" ") }
            aria-label="Italic"
          >
            <Italic className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={ () => replyEditor?.chain().focus().toggleUnderline().run() }
            className={ [
              "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition",
              replyEditor?.isActive("underline")
                ? "border-[#2d87a8] bg-[#e4f4fb] text-[#1f5a70]"
                : "border-[#c9e2ec] bg-white text-[#2c5f75] hover:bg-[#eef8fc]",
            ].join(" ") }
            aria-label="Underline"
          >
            <UnderlineIcon className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={ handleSetReplyLink }
            className={ [
              "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition",
              replyEditor?.isActive("link")
                ? "border-[#2d87a8] bg-[#e4f4fb] text-[#1f5a70]"
                : "border-[#c9e2ec] bg-white text-[#2c5f75] hover:bg-[#eef8fc]",
            ].join(" ") }
            aria-label="Link"
          >
            <Link2 className="size-3.5" />
          </button>
        </div>
        <label className="block mb-2 text-xs font-semibold text-[#4f7384]" htmlFor="reply-content-editor">
          Reply Content
        </label>
        <div className="mt-2 rounded-xl border border-[#cfe3ec] bg-white p-3 [&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-5 [&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:pl-5 [&_.tiptap_li]:my-1">
          <EditorContent id="reply-content-editor" editor={ replyEditor } />
        </div>
        <div className="mt-3 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={ handleCancelReply }
            disabled={ isSubmittingReply }
            className="rounded-full border border-[#c9e2ec] bg-white px-4 py-1.5 text-xs font-semibold text-[#2c5f75] transition hover:bg-[#eef8fc]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={ () => handleSubmitReply(replyToEntryId) }
            disabled={ isSubmittingReply }
            className="rounded-full bg-[#2d87a8] px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-[#256e89] disabled:opacity-60"
          >
            { isSubmittingReply ? "Posting..." : "Post Reply" }
          </button>
        </div>
      </div>
    );
  }

  function renderReplyNode(reply: ThreadEntry, depth: number) {
    const replyExpanded = expandedEntryIds.has(reply.id);
    const childReplies = childRepliesByParentId.get(reply.id) ?? [];
    const resolvedParentId = resolvedParentIdByReplyId.get(reply.id);
    const parentEntry = resolvedParentId ? entryById.get(resolvedParentId) : undefined;
    const replyTargetName = parentEntry?.authorName ?? "Unknown Member";
    const cappedDepth = Math.min(depth, 5);

    return (
      <div
        key={ reply.id }
        className="rounded-xl border border-[#d3e8f1] bg-white px-3 py-3"
        style={ { marginLeft: `${ cappedDepth * 16 }px` } }
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#5f7f8f]">
            Reply to { replyTargetName }
          </p>
          <div className="flex items-center gap-3">
            <p className="text-[0.65rem] uppercase tracking-[0.18em] text-[#5f7f8f]">
              { reply.authorName } · { formatDate(reply.createdAt) }
            </p>
            { reply.authorMemberId !== currentMemberId ? (
              <button
                type="button"
                onClick={ () => handleReplyClick(reply.id) }
                className="rounded-full border border-[#9dc2d1] bg-white px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-[#215066] transition hover:bg-[#e5f4fa]"
              >
                Reply
              </button>
            ) : null }
            <button
              type="button"
              onClick={ () => toggleExpanded(reply.id) }
              aria-expanded={ replyExpanded }
              aria-label={ replyExpanded ? "Collapse contentJson" : "Expand contentJson" }
              className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#9dc2d1] bg-white text-xs font-bold leading-none text-[#215066] transition hover:bg-[#e5f4fa]"
            >
              { replyExpanded ? "-" : "+" }
            </button>
          </div>
        </div>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#1f4255]">{ reply.summary }</p>
        { replyExpanded ? (
          <div className="mt-2 overflow-x-auto rounded-xl border border-[#cfe3ec] bg-[#f7fcff] px-3 py-3 text-xs leading-5 text-[#214457] prose prose-sm max-w-none">
            <TiptapRenderer contentJson={ reply.contentJson } />
          </div>
        ) : null }

        { reply.authorMemberId !== currentMemberId ? (
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={ () => handleToggleReaction(reply.id, 1) }
              disabled={ isTogglingReaction }
              className={ [
                "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[0.6rem] font-semibold transition",
                reply.userReactionType === 1
                  ? "border-[#2d87a8] bg-[#e4f4fb] text-[#1f5a70]"
                  : "border-[#c9e2ec] bg-white text-[#2c5f75] hover:bg-[#eef8fc]",
              ].join(" ") }
            >
              <ThumbsUp className={ `size-3 ${ reply.userReactionType === 1 ? "fill-current" : "" }` } />
              { (reply.likeCount ?? 0).toString().length > 1 ? reply.likeCount : "" }
            </button>
            <button
              type="button"
              onClick={ () => handleToggleReaction(reply.id, 2) }
              disabled={ isTogglingReaction }
              className={ [
                "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[0.6rem] font-semibold transition",
                reply.userReactionType === 2
                  ? "border-[#cf3f7f] bg-[#fde4ee] text-[#aa3368]"
                  : "border-[#e8c9d9] bg-white text-[#7a4a5f] hover:bg-[#fff0f5]",
              ].join(" ") }
            >
              <Heart className={ `size-3 ${ reply.userReactionType === 2 ? "fill-current" : "" }` } />
              { (reply.loveCount ?? 0).toString().length > 1 ? reply.loveCount : "" }
            </button>
          </div>
        ) : null }

        { renderReplyComposer(reply.id, "mt-3 rounded-xl border border-[#cfe3ec] bg-[#f2fbff] p-3") }

        { childReplies.length > 0 ? (
          <div className="mt-3 space-y-3">
            { childReplies.map((childReply) => renderReplyNode(childReply, depth + 1)) }
          </div>
        ) : null }
      </div>
    );
  }

  return (
    <div className="space-y-3 px-5 py-5 sm:px-6">
      { entries.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[#d7ebf3] bg-[#f8fcff] px-4 py-3 text-sm text-[#5f7987]">
          This thread does not have posts or replies yet.
        </p>
      ) : (
        <>
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={ expandAll }
              className="inline-flex items-center rounded-full border border-[#9dc2d1] bg-white px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#215066] transition hover:bg-[#e5f4fa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9dc2d1]"
              disabled={ expandedEntryIds.size === allEntryIds.length }
            >
              Expand All
            </button>
            <button
              type="button"
              onClick={ collapseAll }
              className="inline-flex items-center rounded-full border border-[#9dc2d1] bg-white px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#215066] transition hover:bg-[#e5f4fa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9dc2d1]"
              disabled={ expandedEntryIds.size === 0 }
            >
              Collapse All
            </button>
            <span className="ml-2 text-xs text-[#5f7987]">{ expandedEntryIds.size } expanded</span>
          </div>
          { posts.map((post) => {
            const postReplies = childRepliesByParentId.get(post.id) ?? [];
            const postExpanded = expandedEntryIds.has(post.id);

            return (
              <article key={ post.id } className="rounded-2xl border border-[#d7ebf3] bg-[#f8fcff] px-4 py-4 text-sm text-[#3f6576] shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#4f7384]">Post</p>
                  <div className="flex items-center gap-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-[#4f7384]">
                      { post.authorName } · { formatDate(post.createdAt) }
                    </p>
                    { post.authorMemberId !== currentMemberId ? (
                      <button
                        type="button"
                        onClick={ () => handleReplyClick(post.id) }
                        className="rounded-full border border-[#9dc2d1] bg-white px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[#215066] transition hover:bg-[#e5f4fa]"
                      >
                        Reply
                      </button>
                    ) : null }
                    <button
                      type="button"
                      onClick={ () => toggleExpanded(post.id) }
                      aria-expanded={ postExpanded }
                      aria-label={ postExpanded ? "Collapse contentJson" : "Expand contentJson" }
                      className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[#9dc2d1] bg-white text-sm font-bold leading-none text-[#215066] transition hover:bg-[#e5f4fa]"
                    >
                      { postExpanded ? "-" : "+" }
                    </button>
                  </div>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-base leading-6 text-[#15384a]">{ post.summary }</p>
                { postExpanded ? (
                  <div className="mt-3 overflow-x-auto rounded-xl border border-[#cfe3ec] bg-white px-3 py-3 text-xs leading-5 text-[#214457] prose prose-sm max-w-none">
                    <TiptapRenderer contentJson={ post.contentJson } />
                  </div>
                ) : null }

                { post.authorMemberId !== currentMemberId ? (
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={ () => handleToggleReaction(post.id, 1) }
                      disabled={ isTogglingReaction }
                      className={ [
                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                        post.userReactionType === 1
                          ? "border-[#2d87a8] bg-[#e4f4fb] text-[#1f5a70]"
                          : "border-[#c9e2ec] bg-white text-[#2c5f75] hover:bg-[#eef8fc]",
                      ].join(" ") }
                    >
                      <ThumbsUp className={ `size-3.5 ${ post.userReactionType === 1 ? "fill-current" : "" }` } />
                      { post.likeCount ?? 0 }
                    </button>
                    <button
                      type="button"
                      onClick={ () => handleToggleReaction(post.id, 2) }
                      disabled={ isTogglingReaction }
                      className={ [
                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                        post.userReactionType === 2
                          ? "border-[#cf3f7f] bg-[#fde4ee] text-[#aa3368]"
                          : "border-[#e8c9d9] bg-white text-[#7a4a5f] hover:bg-[#fff0f5]",
                      ].join(" ") }
                    >
                      <Heart className={ `size-3.5 ${ post.userReactionType === 2 ? "fill-current" : "" }` } />
                      { post.loveCount ?? 0 }
                    </button>
                  </div>
                ) : null }

                { renderReplyComposer(post.id, "mt-3 rounded-xl border border-[#cfe3ec] bg-[#f2fbff] p-3") }

                { postReplies.length > 0 ? (
                  <div className="mt-4 space-y-3 border-l-2 border-[#c7e6f1] pl-4">
                    { postReplies.map((reply) => renderReplyNode(reply, 1)) }
                  </div>
                ) : null }
              </article>
            );
          }) }

          { orphanReplies.length > 0 ? (
            <div className="space-y-3">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-[#4f7384]">
                Replies Without Matched Post
              </p>
              { orphanReplies.map((reply) => {
                const replyExpanded = expandedEntryIds.has(reply.id);

                return (
                  <article key={ reply.id } className="rounded-2xl border border-[#f0d3c8] bg-[#fff8f5] px-4 py-4 text-sm text-[#7b4d3c] shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9a5b44]">Reply</p>
                      <div className="flex items-center gap-3">
                        <p className="text-xs uppercase tracking-[0.16em] text-[#9a5b44]">
                          { reply.authorName } · { formatDate(reply.createdAt) }
                        </p>
                        { reply.authorMemberId !== currentMemberId ? (
                          <button
                            type="button"
                            onClick={ () => handleReplyClick(reply.id) }
                            className="rounded-full border border-[#e7b8a8] bg-white px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[#9a5b44] transition hover:bg-[#fff0ea]"
                          >
                            Reply
                          </button>
                        ) : null }
                        <button
                          type="button"
                          onClick={ () => toggleExpanded(reply.id) }
                          aria-expanded={ replyExpanded }
                          aria-label={ replyExpanded ? "Collapse contentJson" : "Expand contentJson" }
                          className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[#e7b8a8] bg-white text-sm font-bold leading-none text-[#9a5b44] transition hover:bg-[#fff0ea]"
                        >
                          { replyExpanded ? "-" : "+" }
                        </button>
                      </div>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-base leading-6 text-[#7b4d3c]">{ reply.summary }</p>
                    { replyExpanded ? (
                      <div className="mt-3 overflow-x-auto rounded-xl border border-[#eec8bc] bg-[#fffdfb] px-3 py-3 text-xs leading-5 text-[#7b4d3c] prose prose-sm max-w-none">
                        <TiptapRenderer contentJson={ reply.contentJson } />
                      </div>
                    ) : null }

                    { reply.authorMemberId !== currentMemberId ? (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={ () => handleToggleReaction(reply.id, 1) }
                          disabled={ isTogglingReaction }
                          className={ [
                            "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[0.6rem] font-semibold transition",
                            reply.userReactionType === 1
                              ? "border-[#b88060] bg-[#fff3ed] text-[#9a5b44]"
                              : "border-[#e7b8a8] bg-white text-[#9a5b44] hover:bg-[#fff0ea]",
                          ].join(" ") }
                        >
                          <ThumbsUp className={ `size-3 ${ reply.userReactionType === 1 ? "fill-current" : "" }` } />
                          { (reply.likeCount ?? 0).toString().length > 1 ? reply.likeCount : "" }
                        </button>
                        <button
                          type="button"
                          onClick={ () => handleToggleReaction(reply.id, 2) }
                          disabled={ isTogglingReaction }
                          className={ [
                            "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[0.6rem] font-semibold transition",
                            reply.userReactionType === 2
                              ? "border-[#d88080] bg-[#ffedea] text-[#aa3368]"
                              : "border-[#e7b8a8] bg-white text-[#9a5b44] hover:bg-[#fff0ea]",
                          ].join(" ") }
                        >
                          <Heart className={ `size-3 ${ reply.userReactionType === 2 ? "fill-current" : "" }` } />
                          { (reply.loveCount ?? 0).toString().length > 1 ? reply.loveCount : "" }
                        </button>
                      </div>
                    ) : null }

                    { renderReplyComposer(reply.id, "mt-3 rounded-xl border border-[#eec8bc] bg-[#fff2ec] p-3") }
                  </article>
                );
              }) }
            </div>
          ) : null }
        </>
      ) }
    </div>
  );
}
