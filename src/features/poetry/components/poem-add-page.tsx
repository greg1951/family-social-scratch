"use client";

import type { JSONContent } from "@tiptap/core";
import Underline from "@tiptap/extension-underline";
import LinkExtension from "@tiptap/extension-link";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, type Editor, useEditor } from "@tiptap/react";
import {
  ArrowLeft,
  Bold,
  BookOpen,
  Heading3,
  Italic,
  Link2,
  List,
  Redo2,
  Save,
  Tags,
  Trash2,
  Underline as UnderlineIcon,
  Unlink,
  Undo2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { savePoetryHomePoemAction, deletePoetryHomePoemAction } from "@/app/(features)/(poetry)/poetry/actions";
import {
  createEmptyTipTapDocument,
  parseSerializedTipTapDocument,
  serializeTipTapDocument,
} from "@/components/db/types/poem-term-validation";
import { PoemTagOption, PoetryHomePoem } from "@/components/db/types/poem-verses";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MemberKeyDetails } from "@/features/family/types/family-steps";

type PoemDraft = {
  id: number;
  poemTitle: string;
  poetName: string;
  poemYear: string;
  poemSource: string;
  verseJson: string;
  analysisJson: string;
  selectedTagIds: number[];
  status: string;
  memberId: number;
  familyId: number;
};

type ToolbarButtonProps = {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
};

function getEditorDocument(value?: string): JSONContent {
  const parsed = parseSerializedTipTapDocument(value);

  if (parsed.success) {
    return parsed.content;
  }

  return createEmptyTipTapDocument();
}

function ToolbarButton({ label, active = false, disabled = false, onClick, children }: ToolbarButtonProps) {
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onMouseDown={ (event) => event.preventDefault() }
      onClick={ onClick }
      disabled={ disabled }
      className={ active
        ? "rounded-full border-[#8c62b5] bg-[#f2e8ff] text-[#4e2374]"
        : "rounded-full border-[#d7d0ea] bg-white text-[#6a4f83]" }
      aria-label={ label }
    >
      { children }
    </Button>
  );
}

function RichTextToolbar({
  editor,
  showExtended = false,
}: {
  editor: Editor | null;
  showExtended?: boolean;
}) {
  if (!editor) {
    return null;
  }

  function handleSetLink() {
    if (!editor) {
      return;
    }

    const activeEditor = editor;

    const currentHref = (activeEditor.getAttributes("link") as { href?: string | null }).href ?? "https://";
    const enteredValue = window.prompt("Enter a URL for the selected text", currentHref);

    if (enteredValue === null) {
      return;
    }

    const trimmedValue = enteredValue.trim();

    if (!trimmedValue) {
      activeEditor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    const normalizedHref = /^(https?:|mailto:|tel:)/i.test(trimmedValue)
      ? trimmedValue
      : `https://${ trimmedValue }`;

    activeEditor.chain().focus().extendMarkRange("link").setLink({
      href: normalizedHref,
      target: "_blank",
      rel: "noopener noreferrer nofollow",
    }).run();
  }

  return (
    <div className="flex flex-wrap gap-2 rounded-t-[1.4rem] border border-b-0 border-[#d7d0ea] bg-[#faf6ff] p-3">
      { showExtended ? (
        <ToolbarButton
          label="Heading 3"
          onClick={ () => editor.chain().focus().toggleHeading({ level: 3 }).run() }
          active={ editor.isActive("heading", { level: 3 }) }
          disabled={ !editor.can().chain().focus().toggleHeading({ level: 3 }).run() }
        >
          <Heading3 className="size-4" />
        </ToolbarButton>
      ) : null }
      <ToolbarButton
        label="Bold"
        onClick={ () => editor.chain().focus().toggleBold().run() }
        active={ editor.isActive("bold") }
        disabled={ !editor.can().chain().focus().toggleBold().run() }
      >
        <Bold className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Italic"
        onClick={ () => editor.chain().focus().toggleItalic().run() }
        active={ editor.isActive("italic") }
        disabled={ !editor.can().chain().focus().toggleItalic().run() }
      >
        <Italic className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Underline"
        onClick={ () => editor.chain().focus().toggleUnderline().run() }
        active={ editor.isActive("underline") }
        disabled={ !editor.can().chain().focus().toggleUnderline().run() }
      >
        <UnderlineIcon className="size-4" />
      </ToolbarButton>
      { showExtended ? (
        <ToolbarButton
          label="Bullet list"
          onClick={ () => editor.chain().focus().toggleBulletList().run() }
          active={ editor.isActive("bulletList") }
          disabled={ !editor.can().chain().focus().toggleBulletList().run() }
        >
          <List className="size-4" />
        </ToolbarButton>
      ) : null }
      { showExtended ? (
        <ToolbarButton
          label="Set link"
          onClick={ handleSetLink }
          active={ editor.isActive("link") }
        >
          <Link2 className="size-4" />
        </ToolbarButton>
      ) : null }
      { showExtended ? (
        <ToolbarButton
          label="Remove link"
          onClick={ () => editor.chain().focus().extendMarkRange("link").unsetLink().run() }
          disabled={ !editor.isActive("link") }
        >
          <Unlink className="size-4" />
        </ToolbarButton>
      ) : null }
      <ToolbarButton
        label="Undo"
        onClick={ () => editor.chain().focus().undo().run() }
        disabled={ !editor.can().chain().focus().undo().run() }
      >
        <Undo2 className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Redo"
        onClick={ () => editor.chain().focus().redo().run() }
        disabled={ !editor.can().chain().focus().redo().run() }
      >
        <Redo2 className="size-4" />
      </ToolbarButton>
    </div>
  );
}

function RichTextField({
  editor,
  minHeightClass,
  showExtended = false,
  lineCount,
}: {
  editor: Editor | null;
  minHeightClass: string;
  showExtended?: boolean;
  lineCount?: number;
}) {
  const showLineNumbers = typeof lineCount === "number";

  return (
    <div className="overflow-hidden rounded-[1.4rem] shadow-inner">
      <RichTextToolbar editor={ editor } showExtended={ showExtended } />
      <div className="rounded-b-[1.4rem] border border-[#d7d0ea] bg-white">
        <div className={ showLineNumbers ? "flex max-h-120 overflow-auto" : "" }>
          { showLineNumbers ? (
            <div className="w-11 shrink-0 border-r border-[#e6deef] bg-[#faf7ff] py-4 text-base text-[#8b69ab]">
              { Array.from({ length: Math.max(lineCount ?? 1, 1) }, (_, index) => (
                <div key={ index + 1 } className="h-5 text-center leading-5 tabular-nums">
                  { index + 1 }
                </div>
              )) }
            </div>
          ) : null }

          <EditorContent
            editor={ editor }
            className={ `min-w-0 flex-1 [&_.tiptap]:${ minHeightClass } [&_.tiptap]:bg-white [&_.tiptap]:px-4 [&_.tiptap]:py-4 [&_.tiptap]:text-[#43245d] [&_.tiptap]:leading-6 [&_.tiptap]:outline-none [&_.tiptap_p:first-child]:mt-0 [&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-5 [&_.tiptap_blockquote]:border-l-4 [&_.tiptap_blockquote]:border-[#cfbbe3] [&_.tiptap_blockquote]:pl-4` }
          />
        </div>
      </div>
    </div>
  );
}

function getEditorLineCount(editor: Editor | null) {
  if (!editor) {
    return 1;
  }

  const editorText = editor.getText({ blockSeparator: "\n" });

  if (!editorText.trim()) {
    return 1;
  }

  return editorText.split("\n").length;
}

function extractTipTapText(content: unknown): string {
  const parsed = extractTipTapTextFromNode(content);

  return parsed.replace(/\s+/g, " ").trim();
}

function extractTipTapTextFromNode(node: unknown): string {
  if (!node || typeof node !== "object") {
    return "";
  }

  const candidate = node as {
    text?: string;
    content?: unknown[];
  };

  let text = "";

  if (typeof candidate.text === "string") {
    text += candidate.text;
  }

  if (Array.isArray(candidate.content)) {
    text += candidate.content.map((childNode) => extractTipTapTextFromNode(childNode)).join(" ");
  }

  return text;
}

function createEmptyDraft(member: MemberKeyDetails): PoemDraft {
  return {
    id: 0,
    poemTitle: "",
    poetName: "",
    poemYear: "",
    poemSource: "Unknown",
    verseJson: JSON.stringify(createEmptyTipTapDocument()),
    analysisJson: JSON.stringify(createEmptyTipTapDocument()),
    selectedTagIds: [],
    status: "published",
    memberId: member.memberId,
    familyId: member.familyId,
  };
}

function createDraftFromPoem(poemRecord: PoetryHomePoem): PoemDraft {
  return {
    id: poemRecord.id,
    poemTitle: poemRecord.poemTitle,
    poetName: poemRecord.poetName,
    poemYear: poemRecord.poemYear ? String(poemRecord.poemYear) : "",
    poemSource: poemRecord.poemSource ?? "Unknown",
    verseJson: poemRecord.verseJson ?? JSON.stringify(createEmptyTipTapDocument()),
    analysisJson: poemRecord.analysisJson ?? JSON.stringify(createEmptyTipTapDocument()),
    selectedTagIds: poemRecord.selectedTagIds ?? [],
    status: poemRecord.status,
    memberId: poemRecord.memberId,
    familyId: poemRecord.familyId,
  };
}

export function PoemAddPage({
  poemTags = [],
  member,
  initialPoem = null,
}: {
  poemTags?: PoemTagOption[];
  member: MemberKeyDetails;
  initialPoem?: PoetryHomePoem | null;
}) {
  const router = useRouter();
  const isEditMode = Boolean(initialPoem);
  const isOwner = initialPoem && member.memberId === initialPoem.memberId;
  const canModerate = isOwner || member.isFounder;
  const isFounderModerating = isEditMode && member.isFounder && !isOwner;
  const [isSaving, startSaveTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [draft, setDraft] = useState<PoemDraft>(() => (
    initialPoem ? createDraftFromPoem(initialPoem) : createEmptyDraft(member)
  ));
  const [verseLineCount, setVerseLineCount] = useState(1);

  const activePoemTags = poemTags.filter((tagOption) => tagOption.status !== "archived");

  const tagsByCategory = useMemo(() => {
    const groupedTags = new Map<number, { categoryId: number; categoryName: string; tags: PoemTagOption[] }>();

    for (const tagOption of activePoemTags) {
      if (!tagOption.poemCategoryId) {
        continue;
      }

      const categoryId = tagOption.poemCategoryId;
      const categoryName = tagOption.categoryName?.trim() || `Category ${ categoryId }`;
      const currentGroup = groupedTags.get(categoryId) ?? {
        categoryId,
        categoryName,
        tags: [],
      };

      currentGroup.tags.push(tagOption);
      groupedTags.set(categoryId, currentGroup);
    }

    return Array.from(groupedTags.values())
      .map((group) => ({
        ...group,
        tags: [...group.tags].sort((leftTag, rightTag) => leftTag.tagName.localeCompare(rightTag.tagName)),
      }))
      .sort((leftCategory, rightCategory) => leftCategory.categoryName.localeCompare(rightCategory.categoryName));
  }, [activePoemTags]);

  const verseEditor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      LinkExtension.configure({
        autolink: true,
        defaultProtocol: "https",
        openOnClick: false,
      }),
    ],
    content: getEditorDocument(draft.verseJson),
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "tiptap min-h-[18rem]",
      },
    },
    onUpdate({ editor }) {
      setVerseLineCount(getEditorLineCount(editor));
      setDraft((currentDraft) => ({
        ...currentDraft,
        verseJson: serializeTipTapDocument(editor.getJSON()),
      }));
    },
  });

  const analysisEditor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      LinkExtension.configure({
        autolink: true,
        defaultProtocol: "https",
        openOnClick: false,
      }),
    ],
    content: getEditorDocument(draft.analysisJson),
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "tiptap min-h-[14rem]",
      },
    },
    onUpdate({ editor }) {
      setDraft((currentDraft) => ({
        ...currentDraft,
        analysisJson: serializeTipTapDocument(editor.getJSON()),
      }));
    },
  });

  useEffect(() => {
    setVerseLineCount(getEditorLineCount(verseEditor));
  }, [verseEditor]);

  useEffect(() => {
    if (verseEditor) {
      verseEditor.setEditable(!isFounderModerating);
    }
  }, [verseEditor, isFounderModerating]);

  useEffect(() => {
    if (analysisEditor) {
      analysisEditor.setEditable(!isFounderModerating);
    }
  }, [analysisEditor, isFounderModerating]);

  function handleToggleTag(tagId: number, isChecked: boolean) {
    setDraft((currentDraft) => {
      const isAlreadySelected = currentDraft.selectedTagIds.includes(tagId);

      if (isChecked && !isAlreadySelected) {
        return {
          ...currentDraft,
          selectedTagIds: [...currentDraft.selectedTagIds, tagId],
        };
      }

      if (!isChecked && isAlreadySelected) {
        return {
          ...currentDraft,
          selectedTagIds: currentDraft.selectedTagIds.filter((selectedTagId) => selectedTagId !== tagId),
        };
      }

      return currentDraft;
    });
  }

  function getTagDescriptionText(tagJson?: string | null) {
    const parsedTagJson = parseSerializedTipTapDocument(tagJson ?? undefined);

    if (!parsedTagJson.success) {
      return "No tag description available.";
    }

    const tagDescriptionText = extractTipTapText(parsedTagJson.content);

    return tagDescriptionText || "No tag description available.";
  }

  function handleSave(overrideDraft?: PoemDraft) {
    const currentDraft = overrideDraft || draft;
    const normalizedTitle = currentDraft.poemTitle.trim();
    const normalizedPoetName = currentDraft.poetName.trim();
    const normalizedYear = currentDraft.poemYear.trim();

    if (!normalizedTitle) {
      toast.error("Enter a poem name before saving.");
      return;
    }

    if (!normalizedPoetName) {
      toast.error("Enter a poet name before saving.");
      return;
    }

    if (!/^\d{1,4}$/.test(normalizedYear)) {
      toast.error("Enter a valid numeric poem year.");
      return;
    }

    if (currentDraft.selectedTagIds.length === 0) {
      toast.error("Select at least one poem tag before saving.");
      return;
    }

    startSaveTransition(async () => {
      const result = await savePoetryHomePoemAction({
        id: currentDraft.id > 0 ? currentDraft.id : undefined,
        poemTitle: normalizedTitle,
        poetName: normalizedPoetName,
        poemSource: currentDraft.poemSource,
        poemYear: Number(normalizedYear),
        status: currentDraft.status,
        verseJson: verseEditor ? serializeTipTapDocument(verseEditor.getJSON()) : currentDraft.verseJson,
        analysisJson: analysisEditor ? serializeTipTapDocument(analysisEditor.getJSON()) : currentDraft.analysisJson,
        selectedTagIds: currentDraft.selectedTagIds,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.push("/poetry");
    });
  }

  function handleDelete() {
    if (!initialPoem?.id) {
      return;
    }

    setIsDeleteConfirmOpen(false);
    startDeleteTransition(async () => {
      const result = await deletePoetryHomePoemAction({ poemId: initialPoem.id });
      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success("Poem deleted.");
      router.push("/poetry");
    });
  }

  return (
    <section className="font-app w-full px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-8xl space-y-6">
        {/* Header */ }
        <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,rgba(57,27,88,0.96),rgba(104,53,148,0.88)_56%,rgba(195,150,110,0.84))] px-6 py-8 text-white shadow-[0_28px_80px_-40px_rgba(46,18,70,0.95)] sm:px-8 lg:px-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.34em] text-[#f1deff]">
                Family Poetry Nook
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                <Link
                  href="/poetry"
                  className="inline-flex items-center rounded-full border border-white/35 bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#f6ebff] transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <ArrowLeft className="mr-2 size-4" />
                  Back to Poetry Nook
                </Link>
              </div>
              <h1 className="mt-4 text-lg font-black tracking-tight sm:text-2xl">
                { isEditMode ? `Edit Poem: ${ initialPoem?.poemTitle }` : "Add a New Poem" }
              </h1>
              <p className="mt-2 text-sm text-[#f3e8ff]">
                { isEditMode
                  ? "Update the poem details, verse, analysis, and tags below."
                  : "Provide the poem title, poet name, year, verse, and optional analysis." }
              </p>
            </div>
          </div>
        </div>

        {/* Poem Metadata */ }
        <div className="overflow-hidden rounded-[1.9rem] border border-white/70 bg-white/90 shadow-[0_24px_70px_-40px_rgba(57,27,88,0.7)]">
          <div className="border-b border-[#e4d9ee] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(249,244,255,0.86))] px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#8154a3]">
                  Poem Details
                </p>
                <h2 className="mt-2 text-xl font-black tracking-tight text-[#43245d]">
                  Poem Information
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#77578f]">
                  Enter the poem title, the name of the poet, and the year it was written.
                </p>
              </div>

              { isEditMode && canModerate ? (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={ () => {
                      const newStatus = draft.status === "archived" ? "published" : "archived";
                      setDraft((currentDraft) => ({ ...currentDraft, status: newStatus }));
                      if (isFounderModerating) {
                        const updatedDraft = { ...draft, status: newStatus };
                        handleSave(updatedDraft);
                      }
                    } }
                    disabled={ isSaving || isDeleting }
                    className="rounded-full border-[#d7d0ea] text-[#5d426f]"
                  >
                    { draft.status === "archived" ? "Unarchive" : "Archive" }
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={ () => setIsDeleteConfirmOpen(true) }
                    disabled={ isSaving || isDeleting }
                  >
                    <Trash2 className="size-4" />
                    Delete
                  </Button>
                  { !isFounderModerating ? (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={ () => router.push("/poetry") }
                        disabled={ isSaving }
                        className="rounded-full border-[#d7d0ea] text-[#6d5384]"
                      >
                        <X className="size-4" />
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        onClick={ () => handleSave() }
                        disabled={ isSaving }
                        className="rounded-full bg-[#5a2f85] text-white hover:bg-[#47216b]"
                      >
                        <BookOpen className="size-4" />
                        { isSaving ? "Saving..." : "Save Poem" }
                      </Button>
                    </>
                  ) : null }
                </div>
              ) : !isFounderModerating ? (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={ () => handleSave() }
                    disabled={ isSaving || isDeleting }
                    className="rounded-full bg-[#5a2f85] text-white hover:bg-[#47216b]"
                  >
                    <Save className="size-4" />
                    { isSaving ? "Saving..." : "Save Poem" }
                  </Button>
                </div>
              ) : null }
            </div>
          </div>

          <div className="space-y-5 px-5 py-5 sm:px-6">
            { isFounderModerating && (
              <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4 text-yellow-900">
                <p className="text-sm font-medium">
                  As the family founder, you can archive this poem if it doesn't follow guidelines. However, only the original author can edit their own posts.
                </p>
              </div>
            ) }

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#5d426f]">Poem Title</label>
                <Input
                  value={ draft.poemTitle }
                  onChange={ (event) => setDraft((currentDraft) => ({ ...currentDraft, poemTitle: event.target.value })) }
                  placeholder="Enter the poem title"
                  disabled={ isSaving || isFounderModerating }
                  className="border-[#d7d0ea] text-[#43245d]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#5d426f]">Poet Name</label>
                <Input
                  value={ draft.poetName }
                  onChange={ (event) => setDraft((currentDraft) => ({ ...currentDraft, poetName: event.target.value })) }
                  placeholder="Enter the poet's name"
                  disabled={ isSaving || isFounderModerating }
                  className="border-[#d7d0ea] text-[#43245d]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#5d426f]">Poem Year</label>
                <Input
                  value={ draft.poemYear }
                  onChange={ (event) => setDraft((currentDraft) => ({ ...currentDraft, poemYear: event.target.value })) }
                  placeholder="e.g. 1923"
                  disabled={ isSaving || isFounderModerating }
                  inputMode="numeric"
                  className="border-[#d7d0ea] text-[#43245d]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#5d426f]">Poem Source</label>
                <Input
                  value={ draft.poemSource }
                  onChange={ (event) => setDraft((currentDraft) => ({ ...currentDraft, poemSource: event.target.value })) }
                  placeholder="e.g. Published collection name"
                  disabled={ isSaving || isFounderModerating }
                  className="border-[#d7d0ea] text-[#43245d]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#5d426f]">Status</label>
                <Select
                  value={ draft.status }
                  onValueChange={ (nextStatus) => setDraft((currentDraft) => ({ ...currentDraft, status: nextStatus })) }
                  disabled={ isSaving || isFounderModerating }
                >
                  <SelectTrigger className="w-full border-[#d7d0ea] text-[#43245d]">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Poem Verse + Poem Analysis side by side */ }
        <div className="grid gap-6 xl:grid-cols-2">
          {/* Poem Verse */ }
          <div className="overflow-hidden rounded-[1.9rem] border border-white/70 bg-white/90 shadow-[0_24px_70px_-40px_rgba(57,27,88,0.7)]">
            <div className="border-b border-[#e4d9ee] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(249,244,255,0.86))] px-5 py-5 sm:px-6">
              {/* <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#8154a3]">
                Poem Verse
              </p> */}
              <h2 className="mt-2 text-xl font-black tracking-tight text-[#43245d]">
                Poem Text
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#77578f]">
                Write or paste the poem verse here.
              </p>
            </div>

            <div className="space-y-3 px-5 py-5 sm:px-6">
              <RichTextField
                editor={ verseEditor }
                minHeightClass="min-h-[18rem]"
                lineCount={ verseLineCount }
              />
            </div>
          </div>

          {/* Poem Analysis */ }
          <div className="overflow-hidden rounded-[1.9rem] border border-white/70 bg-white/90 shadow-[0_24px_70px_-40px_rgba(57,27,88,0.7)]">
            <div className="border-b border-[#e4d9ee] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(249,244,255,0.86))] px-5 py-5 sm:px-6">
              {/* <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#8154a3]">
                Poem Analysis
              </p> */}
              <h2 className="mt-2 text-xl font-black tracking-tight text-[#43245d]">
                Poem Analysis
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#77578f]">
                Provide your analysis of the poem.
              </p>
            </div>

            <div className="space-y-5 px-5 py-5 sm:px-6">
              <RichTextField
                editor={ analysisEditor }
                minHeightClass="min-h-[14rem]"
                showExtended
              />
            </div>
          </div>
        </div>

        {/* Tag Selection */ }
        <div className="overflow-hidden rounded-[1.9rem] border border-white/70 bg-white/90 shadow-[0_24px_70px_-40px_rgba(57,27,88,0.7)]">
          <div className="border-b border-[#e4d9ee] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(249,244,255,0.86))] px-5 py-5 sm:px-6">
            {/* <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#8154a3]">
              Poem Tags
            </p> */}
            <h2 className="mt-2 text-xl font-black tracking-tight text-[#43245d]">
              Tag Selection
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#77578f]">
              Select one or more tags by category before saving.
            </p>
          </div>

          <div className="px-5 py-5 sm:px-6">
            <div className="space-y-3 rounded-[1.4rem] border border-[#e4d9ee] bg-[#fcfaff] p-4">
              <div className="flex items-center justify-between gap-3">
                {/* <div>
                  <p className="text-sm font-semibold text-[#5d426f]">Poem Tags</p>
                  <p className="text-sm text-[#77578f]">Choose 1-3 tags from different poetry categories.</p>
                </div> */}
                <div className="inline-flex items-center rounded-full border border-[#d7d0ea] bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[#7b54a0]">
                  <Tags className="mr-2 size-3.5" />
                  { draft.selectedTagIds.length } selected
                </div>
              </div>

              { tagsByCategory.length === 0 ? (
                <p className="rounded-3xl border border-dashed border-[#d7d0ea] bg-white px-4 py-3 text-sm text-[#7a5f91]">
                  No poem tag options are available.
                </p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  { tagsByCategory.map((categoryGroup) => (
                    <div key={ categoryGroup.categoryId } className="space-y-3 rounded-2xl border border-[#e4d9ee] bg-white p-3">
                      <p className="text-sm font-semibold text-[#5d426f]">{ categoryGroup.categoryName }</p>

                      <div className="grid grid-cols-2 gap-2">
                        { categoryGroup.tags.map((tagOption) => {
                          const isSelected = draft.selectedTagIds.includes(tagOption.id);

                          return (
                            <div key={ tagOption.id } className="rounded-xl border border-[#ece4f3] bg-[#fefcff] px-3 py-2">
                              <div className="flex items-start gap-2">
                                <Checkbox
                                  id={ `poem-tag-${ tagOption.id }` }
                                  checked={ isSelected }
                                  onCheckedChange={ (checked) => handleToggleTag(tagOption.id, Boolean(checked)) }
                                  disabled={ isSaving }
                                  className="mt-0.5 border-[#b79ad1] data-[state=checked]:bg-[#5a2f85] data-[state=checked]:text-white"
                                />
                                <div className="min-w-0 flex-1">
                                  <label
                                    htmlFor={ `poem-tag-${ tagOption.id }` }
                                    className="cursor-pointer text-sm font-semibold text-[#4d3261]"
                                  >
                                    { tagOption.tagName }
                                  </label>
                                  <Accordion type="single" collapsible className="mt-1 w-full">
                                    <AccordionItem value={ `tag-${ tagOption.id }` } className="border-0">
                                      <AccordionTrigger className="py-1 text-xs text-[#7b54a0] hover:no-underline">
                                        View tag description
                                      </AccordionTrigger>
                                      <AccordionContent className="pb-0">
                                        <Textarea
                                          readOnly
                                          value={ getTagDescriptionText(tagOption.tagJson) }
                                          className="min-h-28 border-[#d7d0ea] bg-[#faf7ff] text-xs leading-5 text-[#5d426f]"
                                        />
                                      </AccordionContent>
                                    </AccordionItem>
                                  </Accordion>
                                </div>
                              </div>
                            </div>
                          );
                        }) }
                      </div>
                    </div>
                  )) }
                </div>
              ) }
            </div>
          </div>
        </div>

        {/* Bottom Save / Cancel - Only show when not in founder moderating mode */ }
        { !isFounderModerating && isEditMode && isOwner ? (
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={ () => router.push("/poetry") }
              disabled={ isSaving }
              className="rounded-full border-[#d7d0ea] text-[#6d5384]"
            >
              <X className="size-4" />
              Cancel
            </Button>

            <Button
              type="button"
              onClick={ () => handleSave() }
              disabled={ isSaving }
              className="rounded-full bg-[#5a2f85] text-white hover:bg-[#47216b]"
            >
              <BookOpen className="size-4" />
              { isSaving ? "Saving..." : "Save Poem" }
            </Button>
          </div>
        ) : null }
      </div>

      <Dialog open={ isDeleteConfirmOpen } onOpenChange={ setIsDeleteConfirmOpen }>
        <DialogContent className="border-red-200 bg-[#f8fcfe] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-700">Are you sure?</DialogTitle>
            <DialogDescription className="text-[#4a7388]">
              This permanently deletes the poem and its discussion thread. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={ () => setIsDeleteConfirmOpen(false) } disabled={ isSaving || isDeleting }>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={ handleDelete } disabled={ isSaving || isDeleting }>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
