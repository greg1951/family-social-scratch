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
  Underline as UnderlineIcon,
  Unlink,
  Undo2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { savePoetryHomePoemAction } from "@/app/(features)/(poetry)/poetry/actions";
import {
  createEmptyTipTapDocument,
  parseSerializedTipTapDocument,
  serializeTipTapDocument,
} from "@/components/db/types/poem-term-validation";
import { PoemTagOption, PoetryHomePoem } from "@/components/db/types/poem-verses";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

function getSeqNoRange(seqNo: number) {
  const rangeStart = Math.floor(seqNo / 10) * 10;

  return {
    rangeStart,
    rangeEnd: rangeStart + 9,
  };
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
    status: "draft",
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
  const [isSaving, startSaveTransition] = useTransition();
  const [draft, setDraft] = useState<PoemDraft>(() => (
    initialPoem ? createDraftFromPoem(initialPoem) : createEmptyDraft(member)
  ));
  const [verseLineCount, setVerseLineCount] = useState(1);

  const activePoemTags = poemTags.filter((tagOption) => tagOption.status !== "archived");
  const categoryTags = activePoemTags
    .filter((tagOption) => tagOption.tagType === "category")
    .sort((a, b) => a.seqNo - b.seqNo || a.tagName.localeCompare(b.tagName));

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

  function getTagsForCategory(categoryTag: PoemTagOption) {
    const categoryRange = getSeqNoRange(categoryTag.seqNo);

    return activePoemTags
      .filter((tagOption) => (
        tagOption.seqNo >= categoryRange.rangeStart
        && tagOption.seqNo <= categoryRange.rangeEnd
      ))
      .sort((a, b) => a.seqNo - b.seqNo || a.tagName.localeCompare(b.tagName));
  }

  function getSelectedTagForCategory(categoryTag: PoemTagOption) {
    const categoryRange = getSeqNoRange(categoryTag.seqNo);

    return draft.selectedTagIds.find((selectedTagId) => {
      const tagOption = activePoemTags.find((candidateTag) => candidateTag.id === selectedTagId);

      if (!tagOption) {
        return false;
      }

      return tagOption.seqNo >= categoryRange.rangeStart && tagOption.seqNo <= categoryRange.rangeEnd;
    });
  }

  function handleCategoryTagSelect(categoryTag: PoemTagOption, selectedValue: string) {
    const categoryRange = getSeqNoRange(categoryTag.seqNo);
    const nextTagId = selectedValue === "none" ? null : Number(selectedValue);

    setDraft((currentDraft) => {
      const nextSelectedTagIds = currentDraft.selectedTagIds.filter((selectedTagId) => {
        const tagOption = activePoemTags.find((candidateTag) => candidateTag.id === selectedTagId);

        if (!tagOption) {
          return false;
        }

        return !(tagOption.seqNo >= categoryRange.rangeStart && tagOption.seqNo <= categoryRange.rangeEnd);
      });

      if (nextTagId === null) {
        return {
          ...currentDraft,
          selectedTagIds: nextSelectedTagIds,
        };
      }

      if (nextSelectedTagIds.length >= 3) {
        toast.error("Select no more than three poem tags.");
        return currentDraft;
      }

      return {
        ...currentDraft,
        selectedTagIds: [...nextSelectedTagIds, nextTagId],
      };
    });
  }

  function handleSave() {
    const normalizedTitle = draft.poemTitle.trim();
    const normalizedPoetName = draft.poetName.trim();
    const normalizedYear = draft.poemYear.trim();

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

    startSaveTransition(async () => {
      const result = await savePoetryHomePoemAction({
        id: draft.id > 0 ? draft.id : undefined,
        poemTitle: normalizedTitle,
        poetName: normalizedPoetName,
        poemSource: draft.poemSource,
        poemYear: Number(normalizedYear),
        status: draft.status,
        verseJson: verseEditor ? serializeTipTapDocument(verseEditor.getJSON()) : draft.verseJson,
        analysisJson: analysisEditor ? serializeTipTapDocument(analysisEditor.getJSON()) : draft.analysisJson,
        selectedTagIds: draft.selectedTagIds,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
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
                Family Poetry Cafe
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                <Link
                  href="/poetry"
                  className="inline-flex items-center rounded-full border border-white/35 bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#f6ebff] transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <ArrowLeft className="mr-2 size-4" />
                  Back to Poetry Cafe
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

            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={ () => router.push("/poetry") }
                disabled={ isSaving }
                className="rounded-full border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              >
                <X className="size-4" />
                Cancel
              </Button>

              <Button
                type="button"
                onClick={ handleSave }
                disabled={ isSaving }
                className="rounded-full bg-white text-[#4e2374] hover:bg-[#f6ebff]"
              >
                <Save className="size-4" />
                { isSaving ? "Saving..." : "Save Poem" }
              </Button>
            </div>
          </div>
        </div>

        {/* Poem Metadata */ }
        <div className="overflow-hidden rounded-[1.9rem] border border-white/70 bg-white/90 shadow-[0_24px_70px_-40px_rgba(57,27,88,0.7)]">
          <div className="border-b border-[#e4d9ee] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(249,244,255,0.86))] px-5 py-5 sm:px-6">
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

          <div className="space-y-5 px-5 py-5 sm:px-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#5d426f]">Poem Title</label>
                <Input
                  value={ draft.poemTitle }
                  onChange={ (event) => setDraft((currentDraft) => ({ ...currentDraft, poemTitle: event.target.value })) }
                  placeholder="Enter the poem title"
                  disabled={ isSaving }
                  className="border-[#d7d0ea] text-[#43245d]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#5d426f]">Poet Name</label>
                <Input
                  value={ draft.poetName }
                  onChange={ (event) => setDraft((currentDraft) => ({ ...currentDraft, poetName: event.target.value })) }
                  placeholder="Enter the poet's name"
                  disabled={ isSaving }
                  className="border-[#d7d0ea] text-[#43245d]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#5d426f]">Poem Year</label>
                <Input
                  value={ draft.poemYear }
                  onChange={ (event) => setDraft((currentDraft) => ({ ...currentDraft, poemYear: event.target.value })) }
                  placeholder="e.g. 1923"
                  disabled={ isSaving }
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
                  disabled={ isSaving }
                  className="border-[#d7d0ea] text-[#43245d]"
                />
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
              Choose 1-3 tags from different poetry categories.
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
                  { draft.selectedTagIds.length } / 3 selected
                </div>
              </div>

              { activePoemTags.length === 0 ? (
                <p className="rounded-3xl border border-dashed border-[#d7d0ea] bg-white px-4 py-3 text-sm text-[#7a5f91]">
                  No poem tag options are available.
                </p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  { categoryTags.map((categoryTag) => {
                    const categoryOptions = getTagsForCategory(categoryTag);
                    const selectedTagId = getSelectedTagForCategory(categoryTag);
                    const categoryOption = categoryOptions.find((tagOption) => tagOption.seqNo === categoryTag.seqNo) ?? null;
                    const qualifierOptions = categoryOptions.filter((tagOption) => tagOption.seqNo !== categoryTag.seqNo);

                    return (
                      <div key={ categoryTag.id } className="space-y-2 rounded-2xl border border-[#e4d9ee] bg-white p-3">
                        <label className="text-sm font-semibold text-[#5d426f]">
                          { categoryTag.tagName }
                        </label>
                        <Select
                          value={ selectedTagId ? String(selectedTagId) : "none" }
                          onValueChange={ (value) => handleCategoryTagSelect(categoryTag, value) }
                        >
                          <SelectTrigger className="border-[#d7d0ea] text-[#43245d]">
                            <SelectValue placeholder={ `Select ${ categoryTag.tagName } tag` } />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No selection</SelectItem>
                            { categoryOption ? (
                              <SelectGroup>
                                <SelectLabel>Category</SelectLabel>
                                <SelectItem value={ String(categoryOption.id) }>
                                  { categoryOption.tagName }
                                </SelectItem>
                              </SelectGroup>
                            ) : null }
                            { qualifierOptions.length > 0 ? (
                              <SelectGroup>
                                <SelectLabel>Qualifiers</SelectLabel>
                                { qualifierOptions.map((tagOption) => (
                                  <SelectItem key={ tagOption.id } value={ String(tagOption.id) }>
                                    { tagOption.tagName }
                                  </SelectItem>
                                )) }
                              </SelectGroup>
                            ) : null }
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  }) }
                </div>
              ) }
            </div>
          </div>
        </div>

        {/* Bottom Save / Cancel */ }
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
            onClick={ handleSave }
            disabled={ isSaving }
            className="rounded-full bg-[#5a2f85] text-white hover:bg-[#47216b]"
          >
            <BookOpen className="size-4" />
            { isSaving ? "Saving..." : "Save Poem" }
          </Button>
        </div>
      </div>

    </section>
  );
}
