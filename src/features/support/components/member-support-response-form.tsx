"use client";

import LinkExtension from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor } from "@tiptap/react";
import { ArrowLeft, Bold, CheckCircle2, Italic, Link2, List, ListOrdered, Underline as UnderlineIcon } from "lucide-react";
import Link from "next/link";
import { startTransition, useEffect, useState } from "react";
import { toast } from "sonner";

import { createMemberSupportResponseAction } from "@/app/(support)/(logged-in)/open-issue/actions";
import {
  createEmptyTipTapDocument,
  parseSerializedTipTapDocument,
  serializeTipTapDocument,
} from "@/components/db/types/poem-term-validation";
import {
  createSupportResponseSchema,
  type CreateSupportResponseInput,
} from "@/components/db/types/support";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

type MemberSupportResponseFormProps = {
  memberName: string;
  familyName: string;
  supportIssueId: number;
  issueResponseId: number;
  issueTitle: string | null;
  issueStatus: string;
  issueJson: string;
  responseJson: string;
  isProposedSolution: boolean;
};

function normalizeLinkUrl(value: string): string | null {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const candidate = /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(trimmedValue)
    ? trimmedValue
    : `https://${ trimmedValue }`;

  try {
    const normalized = new URL(candidate);

    if (!["http:", "https:", "mailto:", "tel:"].includes(normalized.protocol)) {
      return null;
    }

    return normalized.toString();
  } catch {
    return null;
  }
}

function readIssueDescriptionJson(issueJson: string): string | null {
  try {
    const parsed = JSON.parse(issueJson) as { descriptionJson?: string };
    return parsed.descriptionJson ?? null;
  } catch {
    return null;
  }
}

function readViewerDocument(serializedJson: string | null) {
  const parsed = parseSerializedTipTapDocument(serializedJson ?? undefined);
  return parsed.success ? parsed.content : createEmptyTipTapDocument();
}

export function MemberSupportResponseForm({
  memberName,
  familyName,
  supportIssueId,
  issueResponseId,
  issueTitle,
  issueStatus,
  issueJson,
  responseJson,
  isProposedSolution,
}: MemberSupportResponseFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [wasAccepted, setWasAccepted] = useState(false);
  const [linkValue, setLinkValue] = useState("https://");
  const [linkError, setLinkError] = useState<string | null>(null);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);

  const issueDescriptionJson = readIssueDescriptionJson(issueJson);
  const isIssueResolved = issueStatus.trim().toLowerCase() === "resolved";

  const issueViewer = useEditor({
    editable: false,
    extensions: [
      StarterKit,
      Underline,
      LinkExtension.configure({ autolink: true, defaultProtocol: "https", openOnClick: true }),
    ],
    content: readViewerDocument(issueDescriptionJson),
    immediatelyRender: false,
    editorProps: {
      attributes: { class: "tiptap text-[#173848] focus:outline-none" },
    },
  });

  const supportResponseViewer = useEditor({
    editable: false,
    extensions: [
      StarterKit,
      Underline,
      LinkExtension.configure({ autolink: true, defaultProtocol: "https", openOnClick: true }),
    ],
    content: readViewerDocument(responseJson),
    immediatelyRender: false,
    editorProps: {
      attributes: { class: "tiptap text-[#173848] focus:outline-none" },
    },
  });

  const memberReplyEditor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
      }),
      Underline,
      LinkExtension.configure({ autolink: true, defaultProtocol: "https", openOnClick: false }),
    ],
    content: createEmptyTipTapDocument(),
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "tiptap min-h-[10rem] rounded-b-2xl border border-t-0 border-[#c7d7df] bg-white px-4 py-4 text-[#173848] shadow-xs outline-none focus:outline-none",
      },
    },
  });

  useEffect(() => {
    if (!issueViewer) {
      return;
    }

    issueViewer.commands.setContent(readViewerDocument(issueDescriptionJson));
  }, [issueViewer, issueDescriptionJson]);

  useEffect(() => {
    if (!supportResponseViewer) {
      return;
    }

    supportResponseViewer.commands.setContent(readViewerDocument(responseJson));
  }, [supportResponseViewer, responseJson]);

  function openLinkDialog() {
    if (!memberReplyEditor) {
      return;
    }

    const linkAttributes = memberReplyEditor.getAttributes("link") as { href?: string };
    setLinkValue(linkAttributes.href ?? "https://");
    setLinkError(null);
    setIsLinkDialogOpen(true);
  }

  function applyLink() {
    if (!memberReplyEditor) {
      return;
    }

    const trimmedValue = linkValue.trim();

    if (!trimmedValue) {
      memberReplyEditor.chain().focus().extendMarkRange("link").unsetLink().run();
      setIsLinkDialogOpen(false);
      setLinkError(null);
      return;
    }

    const normalizedUrl = normalizeLinkUrl(trimmedValue);

    if (!normalizedUrl) {
      setLinkError("Enter a valid URL, email address, or telephone link.");
      return;
    }

    memberReplyEditor.chain().focus().extendMarkRange("link").setLink({ href: normalizedUrl }).run();
    setLinkError(null);
    setIsLinkDialogOpen(false);
  }

  function handleSubmit() {
    if (!memberReplyEditor) {
      toast.error("Reply editor is still loading.");
      return;
    }

    const responseJsonValue = serializeTipTapDocument(memberReplyEditor.getJSON());
    const parsed = createSupportResponseSchema.safeParse({
      responseJson: responseJsonValue,
      isProposedSolution: false,
      wasAccepted,
    } satisfies CreateSupportResponseInput);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Please enter a valid reply.";
      setFormError(message);
      toast.error(message);
      return;
    }

    setFormError(null);
    setIsSubmitting(true);
    const acceptedOnSubmit = parsed.data.wasAccepted;

    startTransition(async () => {
      const result = await createMemberSupportResponseAction(supportIssueId, parsed.data);
      setIsSubmitting(false);

      if (!result.success) {
        setFormError(result.message);
        toast.error(result.message);
        return;
      }

      memberReplyEditor.commands.setContent(createEmptyTipTapDocument());
      setWasAccepted(false);
      toast.success(
        acceptedOnSubmit
          ? `${ result.message } The support issue has been marked resolved.`
          : result.message,
      );
    });
  }

  return (
    <div className="font-app rounded-[2rem] border border-[#c8d8df] bg-white/95 p-6 shadow-[0_20px_80px_rgba(19,55,71,0.10)] sm:p-8">
      <div className="flex flex-col gap-2 border-b border-[#dbe6eb] pb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#4f7a8c]">Family Social Support</p>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/threads" className="inline-flex items-center rounded-full border border-[#c8d8df] bg-[#eef5f8] px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#4f7a8c] transition hover:bg-[#dcedf4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5d8191]">
            <ArrowLeft className="mr-2 size-4" />
            Back to Threads
          </Link>
          <span className="inline-flex items-center rounded-full bg-[#e8f0ff] px-3 py-1 text-xs font-semibold text-[#365a77]">
            Issue #{ supportIssueId } / Response #{ issueResponseId }
          </span>
        </div>
        <h2 className="text-2xl font-semibold text-[#153445]">Reply To Support</h2>
        <p className="text-sm text-[#4b6978]">Signed in as { memberName } from { familyName }.</p>
      </div>

      <div className="mt-6 space-y-6">
        { formError && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            { formError }
          </div>
        ) }

        <section className="rounded-2xl border border-[#c6dcec] bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5d8191]">Support Issue</p>
          <h3 className="mt-2 text-base font-semibold text-[#153445]">{ issueTitle ?? "Untitled issue" }</h3>
          <div className="mt-3 rounded-2xl border border-[#c6dcec] bg-white p-4 text-sm [&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-5 [&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:pl-5 [&_.tiptap_li]:my-1">
            <EditorContent editor={ issueViewer } />
          </div>
        </section>

        <section className="rounded-2xl border border-[#c6dcec] bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5d8191]">Latest Support Response</p>
            { isProposedSolution && (
              <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                <CheckCircle2 className="mr-1 size-3" /> Proposed solution
              </span>
            ) }
          </div>
          <div className="mt-3 rounded-2xl border border-[#c6dcec] bg-white p-4 text-sm [&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-5 [&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:pl-5 [&_.tiptap_li]:my-1">
            <EditorContent editor={ supportResponseViewer } />
          </div>
        </section>

        { isIssueResolved ? (
          <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-800">Issue Closed</p>
            <p className="mt-2 text-sm text-emerald-900">
              This support issue is resolved, so replies are disabled on this page.
            </p>
          </section>
        ) : (
          <section className="rounded-2xl border border-[#c6dcec] bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5d8191]">Your Reply</p>
            <div className="mt-3 overflow-hidden rounded-[1.2rem] border border-[#c7d7df] bg-[#f4fafc] [&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-5 [&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:pl-5 [&_.tiptap_li]:my-1">
              <div className="flex flex-wrap gap-2 border-b border-[#dbe6eb] px-3 py-3">
                <Button type="button" size="sm" variant="outline" onClick={ () => memberReplyEditor?.chain().focus().toggleBold().run() }>
                  <Bold className="h-4 w-4" />
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={ () => memberReplyEditor?.chain().focus().toggleItalic().run() }>
                  <Italic className="h-4 w-4" />
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={ () => memberReplyEditor?.chain().focus().toggleUnderline().run() }>
                  <UnderlineIcon className="h-4 w-4" />
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={ () => memberReplyEditor?.chain().focus().toggleBulletList().run() }>
                  <List className="h-4 w-4" />
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={ () => memberReplyEditor?.chain().focus().toggleOrderedList().run() }>
                  <ListOrdered className="h-4 w-4" />
                </Button>
                <Button type="button" size="sm" variant="outline" onMouseDown={ (event) => event.preventDefault() } onClick={ openLinkDialog }>
                  <Link2 className="h-4 w-4" />
                </Button>
              </div>
              <EditorContent editor={ memberReplyEditor } className="[&_.tiptap]:min-h-40 [&_.tiptap]:px-4 [&_.tiptap]:py-4 [&_.tiptap]:text-sm [&_.tiptap]:text-[#173848] [&_.tiptap]:outline-none" />
            </div>

            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3">
              <label className="flex cursor-pointer items-start gap-3">
                <Checkbox
                  checked={ wasAccepted }
                  onCheckedChange={ (checked) => setWasAccepted(checked === true) }
                  className="mt-0.5"
                />
                <span className="text-sm leading-5 text-emerald-900">
                  I accept the support team's proposed solution. Mark this issue as resolved when I submit this reply.
                </span>
              </label>
            </div>

            <div className="mt-4 flex justify-end">
              <Button type="button" onClick={ handleSubmit } disabled={ isSubmitting } className="rounded-full bg-[#2b6a87] text-white hover:bg-[#23576f]">
                { isSubmitting ? "Sending..." : "Send Reply To Support" }
              </Button>
            </div>
          </section>
        ) }
      </div>

      { isLinkDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#d1e0e7] bg-white p-5 shadow-xl">
            <p className="text-base font-semibold text-[#153445]">Add Link</p>
            <p className="mt-1 text-sm text-[#5d8191]">Use a URL, email address, or telephone link.</p>
            <input
              value={ linkValue }
              onChange={ (event) => setLinkValue(event.target.value) }
              className="mt-3 w-full rounded-xl border border-[#c7d7df] px-3 py-2 text-sm text-[#173848]"
              placeholder="https://example.com"
            />
            { linkError && <p className="mt-2 text-sm text-rose-700">{ linkError }</p> }
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={ () => setIsLinkDialogOpen(false) }>
                Cancel
              </Button>
              <Button type="button" onClick={ applyLink }>
                Apply Link
              </Button>
            </div>
          </div>
        </div>
      ) }
    </div>
  );
}
