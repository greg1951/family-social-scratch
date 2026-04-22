"use client";

import type { JSONContent } from "@tiptap/core";
import LinkExtension from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor } from "@tiptap/react";
import {
  Bold,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Redo2,
  Send,
  Underline as UnderlineIcon,
  Undo2,
  Unlink,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createThreadConversationAction } from "@/app/(features)/(threads)/threads/actions";
import { createEmptyTipTapDocument, parseSerializedTipTapDocument, serializeTipTapDocument } from "@/components/db/types/poem-term-validation";
import { ThreadRecipientOption } from "@/components/db/types/thread-convos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const MAX_IMAGE_SIZE_BYTES = 4 * 1024 * 1024;

function getEditorDocument(value?: string): JSONContent {
  const parsed = parseSerializedTipTapDocument(value);
  return parsed.success ? parsed.content : createEmptyTipTapDocument();
}

function slugifyFileSegment(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

type ThreadComposePageProps = {
  memberId: number;
  firstName: string;
  isFounder: boolean;
  recipients: ThreadRecipientOption[];
};

export function ThreadComposePage({ memberId, firstName, isFounder, recipients }: ThreadComposePageProps) {
  const router = useRouter();
  const [isSubmitting, startSubmitTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [audience, setAudience] = useState<"private" | "public" | "family_broadcast">("private");
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<number[]>([]);
  const [emailAlso, setEmailAlso] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const filteredRecipients = useMemo(
    () => recipients.filter((recipient) => recipient.memberId !== memberId),
    [memberId, recipients],
  );

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      LinkExtension.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
      }),
    ],
    content: getEditorDocument(),
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "tiptap min-h-[12rem]",
      },
    },
  });

  const selectedRecipientCount = selectedRecipientIds.length;
  const isPublicAudience = audience === "public" || audience === "family_broadcast";

  const recipientLabel = useMemo(() => {
    if (isPublicAudience) {
      return `All active family members (${ filteredRecipients.length }) except you`;
    }

    if (selectedRecipientCount === 0) {
      return "No recipients selected";
    }

    return `${ selectedRecipientCount } recipient${ selectedRecipientCount === 1 ? "" : "s" } selected`;
  }, [filteredRecipients.length, isPublicAudience, selectedRecipientCount]);

  function toggleRecipient(recipientId: number) {
    setSelectedRecipientIds((currentIds) => (
      currentIds.includes(recipientId)
        ? currentIds.filter((id) => id !== recipientId)
        : [...currentIds, recipientId]
    ));
  }

  function handleFileSelection(event: React.ChangeEvent<HTMLInputElement>) {
    const pickedFiles = Array.from(event.target.files ?? []);

    if (pickedFiles.length === 0) {
      return;
    }

    const validFiles: File[] = [];

    for (const file of pickedFiles) {
      if (!["image/png", "image/jpeg", "image/jpg"].includes(file.type)) {
        toast.error(`Unsupported file type for ${ file.name }. Only PNG and JPEG are allowed.`);
        continue;
      }

      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        toast.error(`${ file.name } is larger than 4MB.`);
        continue;
      }

      validFiles.push(file);
    }

    setSelectedFiles((currentFiles) => [...currentFiles, ...validFiles]);
    event.target.value = "";
  }

  function removeFile(fileName: string) {
    setSelectedFiles((currentFiles) => currentFiles.filter((file) => file.name !== fileName));
  }

  async function uploadAttachments() {
    const uploadedAttachments: Array<{
      attachmentType: string;
      s3ObjectKey: string;
      displayUrl: string | null;
      fileName: string;
      fileSizeBytes: number;
      mimeType: string;
    }> = [];

    for (let index = 0; index < selectedFiles.length; index += 1) {
      const file = selectedFiles[index];
      const extension = file.type === "image/png" ? "png" : "jpg";
      const safeStem = slugifyFileSegment(file.name.replace(/\.[^.]+$/, "")) || "thread-image";
      const fileName = `thread-${ memberId }-${ Date.now() }-${ index }-${ safeStem }.${ extension }`;

      const signResponse = await fetch("/api/s3-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "upload",
          folder: "threads",
          fileName,
          contentType: file.type,
        }),
      });

      if (!signResponse.ok) {
        throw new Error(`Unable to create an upload URL for ${ file.name }.`);
      }

      const body = await signResponse.json();
      const uploadResponse = await fetch(body.url, {
        method: "PUT",
        headers: {
          "Content-Type": body.signedContentType ?? file.type,
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload ${ file.name }.`);
      }

      uploadedAttachments.push({
        attachmentType: "image",
        s3ObjectKey: body.s3Key,
        displayUrl: body.fileUrl ?? null,
        fileName: file.name,
        fileSizeBytes: file.size,
        mimeType: file.type,
      });
    }

    return uploadedAttachments;
  }

  function handleSubmit() {
    if (!editor) {
      toast.error("Editor is still loading.");
      return;
    }

    const normalizedTitle = title.trim();

    if (!normalizedTitle) {
      toast.error("Thread title is required.");
      return;
    }

    const contentText = editor.getText().trim();

    if (!contentText) {
      toast.error("Message body is required.");
      return;
    }

    if (!isPublicAudience && selectedRecipientIds.length === 0) {
      toast.error("Choose at least one recipient for a private thread.");
      return;
    }

    startSubmitTransition(async () => {
      try {
        const attachments = await uploadAttachments();
        const result = await createThreadConversationAction({
          title: normalizedTitle,
          subject: subject.trim() || undefined,
          visibility: isPublicAudience ? "public" : "private",
          primaryCategory: audience === "family_broadcast" ? "family_broadcast" : null,
          recipientMemberIds: isPublicAudience ? [] : selectedRecipientIds,
          content: contentText,
          contentJson: serializeTipTapDocument(editor.getJSON()),
          attachments,
        });

        if (!result.success) {
          toast.error(result.message);
          return;
        }

        toast.success(emailAlso ? `${ result.message } Email notifications will be added in phase 2.` : result.message);
        router.push("/threads");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to send thread right now.");
      }
    });
  }

  function handleSetLink() {
    if (!editor) {
      return;
    }

    const currentUrl = editor.getAttributes("link").href as string | undefined;
    const nextUrl = window.prompt("Enter URL", currentUrl ?? "https://");

    if (nextUrl === null) {
      return;
    }

    const normalizedUrl = nextUrl.trim();

    if (!normalizedUrl) {
      editor.chain().focus().unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: normalizedUrl }).run();
  }

  return (
    <section className="font-app w-full px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="overflow-hidden rounded-[1.9rem] border border-white/70 bg-[linear-gradient(135deg,rgba(90,20,120,0.95),rgba(130,40,170,0.86)_56%,rgba(190,100,220,0.78))] px-6 py-8 text-white shadow-[0_28px_80px_-40px_rgba(60,0,90,0.95)] sm:px-8 lg:px-10">
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.34em] text-[#e8c0ff]">
            Family Threads
          </p>
          <h1 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">
            Start a new conversation, { firstName }.
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[#f0d8ff]">
            Write a rich message, choose recipients, and include images your family can open directly in Threads.
          </p>
          <Link
            href="/threads"
            className="mt-5 inline-flex items-center rounded-full border border-white/35 bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#f0d8ff] transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Back to Threads
          </Link>
        </div>

        <div className="rounded-[1.8rem] border border-white/70 bg-white/90 p-5 shadow-[0_24px_70px_-40px_rgba(90,20,120,0.7)] backdrop-blur sm:p-7">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-[#5a2a78]">Title</span>
              <Input
                value={ title }
                onChange={ (event) => setTitle(event.target.value) }
                placeholder="Weekend BBQ planning"
                className="border-[#d7b5ea]"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-[#5a2a78]">Subject (optional)</span>
              <Input
                value={ subject }
                onChange={ (event) => setSubject(event.target.value) }
                placeholder="Food, schedule, and ride sharing"
                className="border-[#d7b5ea]"
              />
            </label>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[16rem_1fr]">
            <div className="rounded-[1.2rem] border border-[#eddaf8] bg-[#fbf6ff] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#7a4a9a]">Audience</p>
              <div className="mt-3 space-y-2">
                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[#5a2a78]">
                  <input
                    type="radio"
                    checked={ audience === "private" }
                    onChange={ () => setAudience("private") }
                  />
                  Private
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[#5a2a78]">
                  <input
                    type="radio"
                    checked={ audience === "public" }
                    onChange={ () => setAudience("public") }
                  />
                  Public
                </label>
                { isFounder && (
                  <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[#5a2a78]">
                    <input
                      type="radio"
                      checked={ audience === "family_broadcast" }
                      onChange={ () => setAudience("family_broadcast") }
                    />
                    Family Broadcast
                  </label>
                ) }
              </div>

              <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#e0c8f0] bg-white px-3 py-1 text-xs font-semibold text-[#7a4a9a]">
                <Users className="size-3.5" />
                { recipientLabel }
              </p>

              <label className="mt-4 flex items-start gap-2 text-xs text-[#7a4a9a]">
                <input
                  type="checkbox"
                  checked={ emailAlso }
                  onChange={ (event) => setEmailAlso(event.target.checked) }
                  className="mt-0.5"
                />
                Also send as email (delivery option will be enabled in phase 2)
              </label>
            </div>

            <div className="rounded-[1.2rem] border border-[#eddaf8] bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#7a4a9a]">Recipients</p>
              { isPublicAudience ? (
                <p className="mt-3 text-sm text-[#6f4b86]">
                  { audience === "family_broadcast"
                    ? "Family Broadcast has public visibility and is shown to all members in Threads."
                    : "Public messages are visible in the Threads list for all family members." }
                </p>
              ) : (
                <div className="mt-3 grid max-h-44 gap-2 overflow-auto pr-1 sm:grid-cols-2">
                  { filteredRecipients.map((recipient) => {
                    const checked = selectedRecipientIds.includes(recipient.memberId);
                    return (
                      <label
                        key={ recipient.memberId }
                        className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#ead8f7] bg-[#fbf7ff] px-3 py-2 text-sm text-[#5a2a78]"
                      >
                        <input
                          type="checkbox"
                          checked={ checked }
                          onChange={ () => toggleRecipient(recipient.memberId) }
                        />
                        <span>
                          { recipient.firstName } { recipient.lastName }
                          { recipient.isFounder ? " (Family Founder)" : "" }
                        </span>
                      </label>
                    );
                  }) }
                </div>
              ) }
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-[1.2rem] border border-[#d9bdeb]">
            <div className="flex flex-wrap gap-2 border-b border-[#ead8f7] bg-[#f9f1ff] px-3 py-2">
              <Button type="button" size="sm" variant="outline" onClick={ () => editor?.chain().focus().toggleBold().run() }>
                <Bold className="size-4" />
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={ () => editor?.chain().focus().toggleItalic().run() }>
                <Italic className="size-4" />
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={ () => editor?.chain().focus().toggleUnderline().run() }>
                <UnderlineIcon className="size-4" />
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={ () => editor?.chain().focus().toggleHeading({ level: 2 }).run() }>
                <Heading2 className="size-4" />
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={ () => editor?.chain().focus().toggleHeading({ level: 3 }).run() }>
                <Heading3 className="size-4" />
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={ () => editor?.chain().focus().toggleOrderedList().run() }>
                <ListOrdered className="size-4" />
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={ () => editor?.chain().focus().toggleBulletList().run() }>
                <List className="size-4" />
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={ () => editor?.chain().focus().setHorizontalRule().run() }>
                <Minus className="size-4" />
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={ handleSetLink }>
                <Link2 className="size-4" />
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={ () => editor?.chain().focus().unsetLink().run() }>
                <Unlink className="size-4" />
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={ () => editor?.chain().focus().undo().run() }>
                <Undo2 className="size-4" />
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={ () => editor?.chain().focus().redo().run() }>
                <Redo2 className="size-4" />
              </Button>
            </div>
            <EditorContent
              editor={ editor }
              className="[&_.tiptap]:min-h-56 [&_.tiptap]:px-4 [&_.tiptap]:py-4 [&_.tiptap]:outline-none [&_.tiptap_h2]:mt-3 [&_.tiptap_h2]:text-xl [&_.tiptap_h2]:font-bold [&_.tiptap_h3]:mt-2 [&_.tiptap_h3]:text-lg [&_.tiptap_h3]:font-semibold [&_.tiptap_hr]:my-4 [&_.tiptap_hr]:border-[#d9bdeb] [&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:pl-5 [&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-5 [&_.tiptap_a]:text-[#6e3f90] [&_.tiptap_a]:underline"
            />
          </div>

          <div className="mt-5 rounded-[1.2rem] border border-[#eddaf8] bg-[#fbf7ff] p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#7a4a9a]">Images</p>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#d7b5ea] bg-white px-3 py-1.5 text-xs font-semibold text-[#6e3f90]">
                <ImagePlus className="size-3.5" />
                Add Images
                <input type="file" accept="image/png,image/jpeg,image/jpg" multiple className="hidden" onChange={ handleFileSelection } />
              </label>
            </div>

            { selectedFiles.length === 0 ? (
              <p className="mt-3 text-sm text-[#7a4a9a]">No images selected.</p>
            ) : (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                { selectedFiles.map((file) => (
                  <div key={ `${ file.name }-${ file.size }` } className="flex items-center justify-between rounded-lg border border-[#e7d2f5] bg-white px-3 py-2 text-sm text-[#5a2a78]">
                    <span className="line-clamp-1 pr-3">{ file.name }</span>
                    <button
                      type="button"
                      onClick={ () => removeFile(file.name) }
                      className="text-xs font-semibold text-[#8d55b2] hover:text-[#6e3f90]"
                    >
                      Remove
                    </button>
                  </div>
                )) }
              </div>
            ) }
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
            <Button asChild type="button" variant="outline" className="rounded-full border-[#d7b5ea] text-[#6e3f90]">
              <Link href="/threads">Cancel</Link>
            </Button>
            <Button
              type="button"
              onClick={ handleSubmit }
              disabled={ isSubmitting }
              className="rounded-full bg-[#7b3ca2] text-white hover:bg-[#643184]"
            >
              <Send className="mr-1 size-4" />
              { isSubmitting ? "Sending..." : "Send Thread" }
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
