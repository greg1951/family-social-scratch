"use client";

import LinkExtension from "@tiptap/extension-link";
import Link from "next/link";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, type Editor, useEditor } from "@tiptap/react";
import {
  ArrowLeft,
  Bold,
  ChevronRight,
  Italic,
  Link2,
  List,
  ListOrdered,
  RefreshCw,
  Underline as UnderlineIcon,
} from "lucide-react";
import { startTransition, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  createSupportResponseAction,
  getSupportIssueDetailAction,
  getSupportIssuesAction,
  updateIssueTeamAction,
} from "@/app/(support)/(logged-in)/issues-list/actions";
import {
  createEmptyTipTapDocument,
  parseSerializedTipTapDocument,
  serializeTipTapDocument,
} from "@/components/db/types/poem-term-validation";
import {
  createSupportResponseSchema,
  type CreateSupportResponseFormInput,
  type CreateSupportResponseInput,
  type SupportIssueDetail,
  type SupportIssueListItem,
  type SupportIssueResponse,
} from "@/components/db/types/support";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(value: Date | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function priorityBadgeClass(priority: string) {
  switch (priority.toLowerCase()) {
    case "high":
      return "bg-rose-100 text-rose-700";
    case "medium":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-emerald-100 text-emerald-700";
  }
}

function statusBadgeClass(status: string) {
  switch (status.toLowerCase()) {
    case "closed":
      return "bg-slate-100 text-slate-600";
    case "in_progress":
    case "in progress":
      return "bg-sky-100 text-sky-700";
    default:
      return "bg-violet-100 text-violet-700";
  }
}

function normalizeLinkUrl(value: string): string | null {
  const trimmedValue = value.trim();
  if (!trimmedValue) return null;
  const candidate = /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(trimmedValue)
    ? trimmedValue
    : `https://${ trimmedValue }`;
  try {
    const normalized = new URL(candidate);
    if (!["http:", "https:", "mailto:", "tel:"].includes(normalized.protocol)) return null;
    return normalized.toString();
  } catch {
    return null;
  }
}

function shortenFamilyName(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }

  return value.length > 30 ? `${ value.slice(0, 27) }...` : value;
}

const defaultResponseJson = serializeTipTapDocument(createEmptyTipTapDocument());

// ─── Toolbar Button ───────────────────────────────────────────────────────────

type ToolbarButtonProps = {
  label: string;
  active?: boolean;
  disabled?: boolean;
  preserveSelection?: boolean;
  onClick: () => void;
  children: React.ReactNode;
};

function ToolbarButton({
  label,
  active = false,
  disabled = false,
  preserveSelection = false,
  onClick,
  children,
}: ToolbarButtonProps) {
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={ disabled }
      onMouseDown={ preserveSelection ? (e) => e.preventDefault() : undefined }
      onClick={ onClick }
      aria-label={ label }
      className={ active ? "border-[#2b6a87] bg-[#ebf6fb] text-[#0d4056]" : "border-[#c7d7df]" }
    >
      { children }
      <span className="sr-only">{ label }</span>
    </Button>
  );
}

// ─── Issue Viewer (read-only TipTap) ─────────────────────────────────────────

function IssueViewer({ issueJson }: { issueJson: string }) {
  let initialContent = createEmptyTipTapDocument();

  try {
    const parsed = JSON.parse(issueJson) as { descriptionJson?: string };
    if (parsed.descriptionJson) {
      const doc = parseSerializedTipTapDocument(parsed.descriptionJson);
      if (doc.success) initialContent = doc.content;
    }
  } catch {
    // ignore
  }

  const viewer = useEditor({
    editable: false,
    extensions: [
      StarterKit,
      Underline,
      LinkExtension.configure({ autolink: true, defaultProtocol: "https", openOnClick: true }),
    ],
    content: initialContent,
    immediatelyRender: false,
    editorProps: {
      attributes: { class: "tiptap text-[#173848] focus:outline-none" },
    },
  });

  useEffect(() => {
    if (!viewer) return;
    let nextContent = createEmptyTipTapDocument();
    try {
      const parsed = JSON.parse(issueJson) as { descriptionJson?: string };
      if (parsed.descriptionJson) {
        const doc = parseSerializedTipTapDocument(parsed.descriptionJson);
        if (doc.success) nextContent = doc.content;
      }
    } catch {
      // ignore
    }
    viewer.commands.setContent(nextContent);
  }, [viewer, issueJson]);

  return (
    <div className="rounded-2xl border border-[#c6dcec] bg-white p-4 text-sm [&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-5 [&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:pl-5 [&_.tiptap_li]:my-1">
      <EditorContent editor={ viewer } />
    </div>
  );
}

// ─── Response Viewer ──────────────────────────────────────────────────────────

function ResponseViewer({ response }: { response: SupportIssueResponse }) {
  const initialContent = (() => {
    const doc = parseSerializedTipTapDocument(response.responseJson);
    return doc.success ? doc.content : createEmptyTipTapDocument();
  })();

  const viewer = useEditor({
    editable: false,
    extensions: [
      StarterKit,
      Underline,
      LinkExtension.configure({ autolink: true, defaultProtocol: "https", openOnClick: true }),
    ],
    content: initialContent,
    immediatelyRender: false,
    editorProps: {
      attributes: { class: "tiptap text-[#173848] focus:outline-none" },
    },
  });

  useEffect(() => {
    if (!viewer) return;
    const doc = parseSerializedTipTapDocument(response.responseJson);
    viewer.commands.setContent(doc.success ? doc.content : createEmptyTipTapDocument());
  }, [viewer, response.responseJson]);

  return (
    <div className="rounded-2xl border border-[#c6dcec] bg-white p-4 text-sm [&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-5 [&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:pl-5 [&_.tiptap_li]:my-1">
      <EditorContent editor={ viewer } />
    </div>
  );
}

// ─── Response Editor ──────────────────────────────────────────────────────────

type ResponseEditorProps = {
  issueId: number;
  onSaved: () => void;
};

function ResponseEditor({ issueId, onSaved }: ResponseEditorProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProposedSolution, setIsProposedSolution] = useState(false);
  const [responseJson, setResponseJson] = useState(defaultResponseJson);
  const [formError, setFormError] = useState<string | null>(null);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkValue, setLinkValue] = useState("https://");
  const [linkError, setLinkError] = useState<string | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
      }),
      Underline,
      LinkExtension.configure({
        autolink: true,
        defaultProtocol: "https",
        openOnClick: false,
      }),
    ],
    content: createEmptyTipTapDocument(),
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "tiptap min-h-[10rem] rounded-b-2xl border border-t-0 border-[#c7d7df] bg-white px-4 py-4 text-[#173848] shadow-xs outline-none focus:outline-none",
      },
    },
    onUpdate({ editor: currentEditor }) {
      setResponseJson(serializeTipTapDocument(currentEditor.getJSON()));
      setFormError(null);
    },
  });

  function openLinkDialog(currentEditor: Editor) {
    const linkAttrs = currentEditor.getAttributes("link") as { href?: string };
    setLinkValue(linkAttrs.href ?? "https://");
    setLinkError(null);
    setIsLinkDialogOpen(true);
  }

  function applyLink() {
    if (!editor) return;
    const trimmed = linkValue.trim();
    if (!trimmed) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      setIsLinkDialogOpen(false);
      setLinkError(null);
      return;
    }
    const normalizedUrl = normalizeLinkUrl(trimmed);
    if (!normalizedUrl) {
      setLinkError("Enter a valid URL, email address, or telephone link.");
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: normalizedUrl }).run();
    setLinkError(null);
    setIsLinkDialogOpen(false);
  }

  async function handleSubmit() {
    const values: CreateSupportResponseFormInput = { responseJson, isProposedSolution };
    const parsed = createSupportResponseSchema.safeParse(values);

    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Response is required.";
      setFormError(msg);
      toast.error(msg);
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    startTransition(async () => {
      const result = await createSupportResponseAction(issueId, parsed.data as CreateSupportResponseInput);
      setIsSubmitting(false);

      if (!result.success) {
        setFormError(result.message);
        toast.error(result.message);
        return;
      }

      editor?.commands.setContent(createEmptyTipTapDocument());
      setResponseJson(defaultResponseJson);
      setIsProposedSolution(false);
      toast.success(result.message);
      onSaved();
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#5d8191]">
        Compose Response
      </p>

      {/* Toolbar */ }
      <div className="flex flex-wrap gap-1 rounded-t-2xl border border-[#c7d7df] bg-[#f4f9fb] px-3 py-2">
        <ToolbarButton
          label="Bold"
          active={ editor?.isActive("bold") }
          preserveSelection
          onClick={ () => editor?.chain().focus().toggleBold().run() }
        >
          <Bold className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          active={ editor?.isActive("italic") }
          preserveSelection
          onClick={ () => editor?.chain().focus().toggleItalic().run() }
        >
          <Italic className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          label="Underline"
          active={ editor?.isActive("underline") }
          preserveSelection
          onClick={ () => editor?.chain().focus().toggleUnderline().run() }
        >
          <UnderlineIcon className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          label="Bulleted List"
          active={ editor?.isActive("bulletList") }
          preserveSelection
          onClick={ () => editor?.chain().focus().toggleBulletList().run() }
        >
          <List className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          label="Numbered List"
          active={ editor?.isActive("orderedList") }
          preserveSelection
          onClick={ () => editor?.chain().focus().toggleOrderedList().run() }
        >
          <ListOrdered className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          label="Insert Link"
          active={ editor?.isActive("link") }
          preserveSelection
          disabled={ !editor || editor.state.selection.empty }
          onClick={ () => editor && openLinkDialog(editor) }
        >
          <Link2 className="size-3.5" />
        </ToolbarButton>
      </div>

      <EditorContent editor={ editor } />

      {/* Proposed Resolution checkbox */ }
      <label className="flex cursor-pointer items-center gap-2.5 text-sm text-[#4b6978]">
        <Checkbox
          checked={ isProposedSolution }
          onCheckedChange={ (checked) => setIsProposedSolution(checked === true) }
          className="border-[#c7d7df] data-[state=checked]:border-[#2b6a87] data-[state=checked]:bg-[#2b6a87]"
        />
        Mark as proposed resolution
      </label>

      { formError && (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          { formError }
        </p>
      ) }

      <Button
        type="button"
        disabled={ isSubmitting }
        onClick={ handleSubmit }
        className="rounded-full bg-[#2b6a87] px-6 text-white hover:bg-[#1e4f66]"
      >
        { isSubmitting ? "Saving…" : "Save Response" }
      </Button>

      {/* Link Dialog */ }
      <Dialog open={ isLinkDialogOpen } onOpenChange={ setIsLinkDialogOpen }>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Insert Link</DialogTitle>
            <DialogDescription>Enter a URL, email (mailto:), or phone (tel:) link.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <input
              type="text"
              className="w-full rounded-xl border border-[#c7d7df] px-3 py-2 text-sm text-[#173848] outline-none focus:border-[#2b6a87] focus:ring-1 focus:ring-[#2b6a87]"
              value={ linkValue }
              onChange={ (e) => setLinkValue(e.target.value) }
              onKeyDown={ (e) => { if (e.key === "Enter") { e.preventDefault(); applyLink(); } } }
              placeholder="https://example.com"
              autoFocus
            />
            { linkError && <p className="text-xs text-rose-600">{ linkError }</p> }
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={ () => setIsLinkDialogOpen(false) }>Cancel</Button>
            <Button onClick={ applyLink } className="bg-[#2b6a87] text-white hover:bg-[#1e4f66]">Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Issue Detail Panel ───────────────────────────────────────────────────────

type IssueDetailPanelProps = {
  issue: SupportIssueDetail;
  onTeamChanged: () => void;
  onResponseSaved: () => void;
};

function IssueDetailPanel({ issue, onTeamChanged, onResponseSaved }: IssueDetailPanelProps) {
  const [isChangingTeam, setIsChangingTeam] = useState(false);
  const [teamError, setTeamError] = useState<string | null>(null);

  const currentLevel = issue.assignedTeamLevel ?? "L1";
  const targetLevel: "L1" | "L2" = currentLevel === "L1" ? "L2" : "L1";

  async function handleTeamChange() {
    setIsChangingTeam(true);
    setTeamError(null);

    startTransition(async () => {
      const result = await updateIssueTeamAction(issue.id, targetLevel);
      setIsChangingTeam(false);

      if (!result.success) {
        setTeamError(result.message);
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      onTeamChanged();
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */ }
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#5d8191]">
            Issue #{ issue.id }
          </p>
          <h2 className="mt-1 text-xl font-semibold text-[#153445]">
            { issue.issueTitle ?? "(No title)" }
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={ `rounded-full px-3 py-1 text-xs font-semibold ${ priorityBadgeClass(issue.priority) }` }>
            { issue.priority }
          </span>
          <span className={ `rounded-full px-3 py-1 text-xs font-semibold ${ statusBadgeClass(issue.status) }` }>
            { issue.status }
          </span>
        </div>
      </div>

      {/* Meta */ }
      <div className="grid grid-cols-1 gap-x-6 gap-y-4 rounded-2xl border border-[#dbe6eb] bg-[#f7fbfd] px-5 py-4 text-sm sm:grid-cols-2 xl:grid-cols-4">
        <div className="min-w-0 sm:col-span-2 xl:col-span-2">
          <p className="text-xs uppercase tracking-[0.22em] text-[#5d8191]">Family</p>
          <p className="mt-1 wrap-break-word font-medium leading-5 text-[#153445]">{ shortenFamilyName(issue.familyName) }</p>
        </div>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.22em] text-[#5d8191]">Category</p>
          <p className="mt-1 wrap-break-word font-medium leading-5 text-[#153445]">{ issue.issueType }</p>
        </div>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.22em] text-[#5d8191]">Assigned To</p>
          <p className="mt-1 wrap-break-word font-medium leading-5 text-[#153445]">{ issue.assignedPersonName ?? "—" }</p>
        </div>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.22em] text-[#5d8191]">Team</p>
          <p className="mt-1 wrap-break-word font-medium leading-5 text-[#153445]">{ issue.assignedTeamLevel ?? "—" }</p>
        </div>
      </div>

      {/* Team Change */ }
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={ isChangingTeam }
          onClick={ handleTeamChange }
          className="rounded-full border-[#c8d8df] text-[#2b6a87] hover:bg-[#eef5f8]"
        >
          <RefreshCw className="mr-2 size-3.5" />
          { isChangingTeam ? "Reassigning…" : `Move to ${ targetLevel }` }
        </Button>
        { teamError && <p className="text-xs text-rose-600">{ teamError }</p> }
      </div>

      {/* Issue Description */ }
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#5d8191]">
          Issue Description
        </p>
        <IssueViewer issueJson={ issue.issueJson } />
      </div>

      {/* Existing Responses */ }
      { issue.responses.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#5d8191]">
            Responses ({ issue.responses.length })
          </p>
          { issue.responses.map((response) => (
            <div
              key={ response.id }
              className="space-y-2 rounded-2xl border border-[#dbe6eb] bg-[#f7fbfd] p-4"
            >
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#5d8191]">
                <span className="font-medium">Response #{ response.id }</span>
                <span>·</span>
                <span>{ formatDate(response.updatedAt) }</span>
                { response.isProposedSolution && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-700">
                    Proposed Resolution
                  </span>
                ) }
                { response.wasAccepted && (
                  <span className="rounded-full bg-sky-100 px-2 py-0.5 font-semibold text-sky-700">
                    Accepted
                  </span>
                ) }
              </div>
              <ResponseViewer response={ response } />
            </div>
          )) }
        </div>
      ) }

      {/* New Response */ }
      <div className="rounded-2xl border border-[#dbe6eb] bg-white p-5">
        <ResponseEditor issueId={ issue.id } onSaved={ () => onResponseSaved() } />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type ListIssuesFormProps = {
  initialIssues: SupportIssueListItem[];
};

export default function ListIssuesForm({ initialIssues }: ListIssuesFormProps) {
  const [issues, setIssues] = useState<SupportIssueListItem[]>(initialIssues);
  const [selectedIssueId, setSelectedIssueId] = useState<number | null>(null);
  const [issueDetail, setIssueDetail] = useState<SupportIssueDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  async function loadDetail(issueId: number) {
    setIsLoadingDetail(true);
    setSelectedIssueId(issueId);

    startTransition(async () => {
      const detail = await getSupportIssueDetailAction(issueId);
      setIssueDetail(detail);
      setIsLoadingDetail(false);
    });
  }

  async function refreshList() {
    setIsRefreshing(true);

    startTransition(async () => {
      const updated = await getSupportIssuesAction();
      setIssues(updated);
      setIsRefreshing(false);

      if (selectedIssueId !== null) {
        const detail = await getSupportIssueDetailAction(selectedIssueId);
        setIssueDetail(detail);
      }
    });
  }

  return (
    <section className="font-app w-full px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,rgba(10,64,79,0.95),rgba(24,115,143,0.9)_50%,rgba(249,197,121,0.85))] px-6 py-8 text-white shadow-[0_28px_80px_-40px_rgba(6,34,52,0.9)] sm:px-8">
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.34em] text-[#def8ff]">
            Family Social Support
          </p>
          <h1 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">
            Support Issues
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#eafcff]">
            Review open support tickets, reassign teams, and compose responses.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center rounded-full border border-[#c8d8df] bg-[#eef5f8] px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#4f7a8c] transition hover:bg-[#dcedf4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5d8191]"
            >
              <ArrowLeft className="mr-2 size-4" />
              Back to Main Page
            </Link>
          </div>
        </div>

        <div className="font-app rounded-[2rem] border border-[#c8d8df] bg-white/95 p-6 shadow-[0_20px_80px_rgba(19,55,71,0.10)] sm:p-8">
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_2fr]">
            {/* Issues List */ }
            <div className="space-y-3">
              <div className="grid grid-cols-[1fr_auto] items-center gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#5d8191]">
                  All Issues ({ issues.length })
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={ isRefreshing }
                  onClick={ refreshList }
                  className="text-[#4f7a8c] hover:text-[#153445]"
                >
                  <RefreshCw className={ `size-3.5 ${ isRefreshing ? "animate-spin" : "" }` } />
                  <span className="sr-only">Refresh</span>
                </Button>
              </div>

              { issues.length === 0 ? (
                <p className="rounded-2xl border border-[#dbe6eb] bg-[#f7fbfd] px-5 py-8 text-center text-sm text-[#5d8191]">
                  No support issues found.
                </p>
              ) : (
                <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                  { issues.map((issue) => (
                    <li key={ issue.id }>
                      <button
                        type="button"
                        onClick={ () => loadDetail(issue.id) }
                        className={ `w-full rounded-2xl border px-4 py-3 text-left transition ${ selectedIssueId === issue.id
                          ? "border-[#2b6a87] bg-[#ebf6fb]"
                          : "border-[#dbe6eb] bg-[#f7fbfd] hover:border-[#a8c8d8] hover:bg-[#eef5f8]"
                          }` }
                      >
                        <div className="grid grid-cols-[1fr_auto] items-start gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-[#153445]">
                              { issue.issueTitle ?? "(No title)" }
                            </p>
                            <p className="mt-0.5 text-xs text-[#5d8191]">
                              { shortenFamilyName(issue.familyName) } · { issue.issueType }
                            </p>
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              <span className={ `rounded-full px-2 py-0.5 text-[10px] font-semibold ${ priorityBadgeClass(issue.priority) }` }>
                                { issue.priority }
                              </span>
                              <span className={ `rounded-full px-2 py-0.5 text-[10px] font-semibold ${ statusBadgeClass(issue.status) }` }>
                                { issue.status }
                              </span>
                              { issue.assignedTeamLevel && (
                                <span className="rounded-full bg-[#dbe6eb] px-2 py-0.5 text-[10px] font-semibold text-[#4f7a8c]">
                                  { issue.assignedTeamLevel }
                                </span>
                              ) }
                            </div>
                            <p className="mt-1 text-[10px] text-[#7a99a6]">
                              { formatDate(issue.updatedAt) }
                            </p>
                          </div>
                          <ChevronRight className="mt-0.5 size-4 shrink-0 text-[#a8c8d8]" />
                        </div>
                      </button>
                    </li>
                  )) }
                </ul>
              ) }
            </div>

            {/* Detail Panel */ }
            <div>
              { isLoadingDetail ? (
                <div className="flex h-64 items-center justify-center rounded-2xl border border-[#dbe6eb] bg-[#f7fbfd]">
                  <p className="text-sm text-[#5d8191]">Loading issue…</p>
                </div>
              ) : issueDetail ? (
                <IssueDetailPanel
                  issue={ issueDetail }
                  onTeamChanged={ refreshList }
                  onResponseSaved={ () => loadDetail(issueDetail.id) }
                />
              ) : (
                <div className="flex h-64 items-center justify-center rounded-2xl border border-[#dbe6eb] bg-[#f7fbfd]">
                  <p className="text-sm text-[#5d8191]">Select an issue to view details.</p>
                </div>
              ) }
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
