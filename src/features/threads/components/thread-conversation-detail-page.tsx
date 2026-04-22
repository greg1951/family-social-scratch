"use client";

import type { JSONContent } from "@tiptap/core";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor } from "@tiptap/react";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArchiveRestore, Eye, EyeOff, MessageCircleReply, Bold, Italic, Underline as UnderlineIcon, List, Undo2, Redo2 } from "lucide-react";
import { toast } from "sonner";

import {
  addThreadReplyAction,
  updateThreadArchiveStateAction,
  updateThreadReadStateAction,
} from "@/app/(features)/(threads)/threads/actions";
import { createEmptyTipTapDocument, serializeTipTapDocument } from "@/components/db/types/poem-term-validation";
import { ThreadConversationDetail } from "@/components/db/types/thread-convos";
import { Button } from "@/components/ui/button";

type ThreadConversationDetailPageProps = {
  conversation: ThreadConversationDetail;
};

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

export function ThreadConversationDetailPage({ conversation }: ThreadConversationDetailPageProps) {
  const router = useRouter();
  const [isSaving, startSaveTransition] = useTransition();

  const replyEditor = useEditor({
    extensions: [StarterKit, Underline],
    content: createEmptyTipTapDocument() as JSONContent,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "tiptap min-h-[10rem]",
      },
    },
  });

  const hasRecipientState = Boolean(conversation.recipientStateId);
  const isArchived = Boolean(conversation.archivedAt);
  const isRead = Boolean(conversation.readAt);

  useEffect(() => {
    if (!hasRecipientState || conversation.readAt) {
      return;
    }

    void (async () => {
      const result = await updateThreadReadStateAction({
        conversationId: conversation.id,
        shouldMarkUnread: false,
      });

      if (result.success) {
        router.refresh();
      }
    })();
  }, [conversation.id, conversation.readAt, hasRecipientState, router]);

  function handleArchiveToggle() {
    if (!hasRecipientState) {
      toast.error("Only recipients can archive this thread.");
      return;
    }

    startSaveTransition(async () => {
      const result = await updateThreadArchiveStateAction({
        conversationId: conversation.id,
        shouldArchive: !isArchived,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.refresh();
    });
  }

  function handleReadToggle() {
    if (!hasRecipientState) {
      toast.error("Only recipients can change read status for this thread.");
      return;
    }

    startSaveTransition(async () => {
      const result = await updateThreadReadStateAction({
        conversationId: conversation.id,
        shouldMarkUnread: isRead,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.refresh();
    });
  }

  function handleReplySubmit() {
    if (!replyEditor) {
      toast.error("Reply editor is still loading.");
      return;
    }

    const normalizedReply = replyEditor.getText().trim();

    if (!normalizedReply) {
      toast.error("Reply cannot be empty.");
      return;
    }

    startSaveTransition(async () => {
      const result = await addThreadReplyAction({
        conversationId: conversation.id,
        content: normalizedReply,
        contentJson: serializeTipTapDocument(replyEditor.getJSON()),
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      replyEditor.commands.setContent(createEmptyTipTapDocument());
      toast.success(result.message);
      router.refresh();
    });
  }

  async function handleOpenAttachment(objectKey: string) {
    try {
      const response = await fetch("/api/s3-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "download",
          fileName: objectKey,
        }),
      });

      if (!response.ok) {
        toast.error("Unable to open attachment right now.");
        return;
      }

      const body = await response.json();
      if (!body?.url || typeof body.url !== "string") {
        toast.error("Attachment link is unavailable.");
        return;
      }

      window.open(body.url, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("Unable to open attachment right now.");
    }
  }

  return (
    <>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        { hasRecipientState && (
          <Button
            type="button"
            size="sm"
            onClick={ handleArchiveToggle }
            disabled={ isSaving }
            className="rounded-full bg-[#6d2f93] text-white hover:bg-[#582479]"
          >
            { isArchived ? <ArchiveRestore className="mr-1 size-4" /> : <Archive className="mr-1 size-4" /> }
            { isArchived ? "Unarchive" : "Archive" }
          </Button>
        ) }

        { hasRecipientState && (
          <Button
            type="button"
            size="sm"
            onClick={ handleReadToggle }
            disabled={ isSaving }
            className="rounded-full bg-[#4d2a66] text-white hover:bg-[#3d2052]"
          >
            { isRead ? <EyeOff className="mr-1 size-4" /> : <Eye className="mr-1 size-4" /> }
            { isRead ? "Mark Unread" : "Mark Read" }
          </Button>
        ) }
      </div>

      <div className="space-y-4">
        { conversation.posts.map((post) => (
          <article
            key={ post.id }
            className="rounded-[1.2rem] border border-[#e9d6f5] bg-white/92 p-5 shadow-[0_16px_45px_-35px_rgba(90,20,120,0.55)]"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-[#5b2b78]">
                { post.authorFirstName ?? "Member" } { post.authorLastName ?? "" }
              </p>
              <p className="text-xs font-medium text-[#8c62aa]">{ formatDate(post.createdAt) }</p>
            </div>

            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#4d2a66]">{ post.content }</p>

            { post.attachments.length > 0 && (
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                { post.attachments.map((attachment) => (
                  <button
                    type="button"
                    key={ attachment.id }
                    onClick={ () => handleOpenAttachment(attachment.s3ObjectKey) }
                    className="inline-flex items-center justify-between rounded-lg border border-[#e5d1f2] bg-[#faf5ff] px-3 py-2 text-sm text-[#5b2b78] hover:bg-[#f4e9ff]"
                  >
                    <span className="line-clamp-1 pr-3">{ attachment.fileName ?? attachment.s3ObjectKey }</span>
                    <span className="text-xs font-semibold text-[#8c62aa]">Open</span>
                  </button>
                )) }
              </div>
            ) }
          </article>
        )) }
      </div>

      <div className="rounded-[1.2rem] border border-[#e9d6f5] bg-white/92 p-5 shadow-[0_16px_45px_-35px_rgba(90,20,120,0.55)]">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#7a4a9a]">Reply</p>

        <div className="mt-3 overflow-hidden rounded-[1.1rem] border border-[#ddc5ee]">
          <div className="flex flex-wrap gap-2 border-b border-[#ead8f7] bg-[#f9f1ff] px-3 py-2">
            <Button type="button" size="sm" variant="outline" onClick={ () => replyEditor?.chain().focus().toggleBold().run() }>
              <Bold className="size-4" />
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={ () => replyEditor?.chain().focus().toggleItalic().run() }>
              <Italic className="size-4" />
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={ () => replyEditor?.chain().focus().toggleUnderline().run() }>
              <UnderlineIcon className="size-4" />
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={ () => replyEditor?.chain().focus().toggleBulletList().run() }>
              <List className="size-4" />
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={ () => replyEditor?.chain().focus().undo().run() }>
              <Undo2 className="size-4" />
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={ () => replyEditor?.chain().focus().redo().run() }>
              <Redo2 className="size-4" />
            </Button>
          </div>

          <EditorContent
            editor={ replyEditor }
            className="[&_.tiptap]:min-h-40 [&_.tiptap]:px-4 [&_.tiptap]:py-4 [&_.tiptap]:text-sm [&_.tiptap]:text-[#4d2a66] [&_.tiptap]:outline-none [&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-5"
          />
        </div>

        <div className="mt-3 flex justify-end">
          <Button
            type="button"
            onClick={ handleReplySubmit }
            disabled={ isSaving }
            className="rounded-full bg-[#7b3ca2] text-white hover:bg-[#633183]"
          >
            <MessageCircleReply className="mr-1 size-4" />
            { isSaving ? "Posting..." : "Post Reply" }
          </Button>
        </div>
      </div>
    </>
  );
}
