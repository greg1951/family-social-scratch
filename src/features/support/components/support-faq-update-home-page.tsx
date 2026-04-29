"use client";

import type { JSONContent } from "@tiptap/core";
import LinkExtension from "@tiptap/extension-link";
import { Table } from "@tiptap/extension-table";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableRow } from "@tiptap/extension-table-row";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  MessageCircleQuestion,
  Plus,
  Quote,
  Redo2,
  Save,
  Table2,
  Trash2,
  Unlink,
  Undo2,
  PenSquare,
  X,
  Underline as UnderlineIcon,
} from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  createSupportFaqAction,
  deleteSupportFaqAction,
  updateSupportFaqAction,
} from "@/app/(support)/(logged-in)/faq-maintenance/actions";
import {
  createEmptyTipTapDocument,
  createTextTipTapDocument,
  isTipTapDocumentEmpty,
  parseSerializedTipTapDocument,
  serializeTipTapDocument,
} from "@/components/db/types/poem-term-validation";
import { SupportFaqItem, SupportFaqStatus } from "@/components/db/types/support";
import { Button } from "@/components/ui/button";
import { useEditor, EditorContent } from "@tiptap/react";


type SupportFaqUpdateHomePageProps = {
  faqItems: SupportFaqItem[];
  faqTypes: string[];
  loadError?: string;
};

type FaqDraft = {
  faqType: string;
  questionJson: string;
  answerJson: string;
  status: SupportFaqStatus;
  seqNo: number;
};

const SUPPORT_FAQ_STATUS_OPTIONS: SupportFaqStatus[] = ["draft", "published", "archived"];
const ADD_NEW_FAQ_TYPE_OPTION = "__add_new_faq_type__";

function toStatusLabel(status: SupportFaqStatus): string {
  if (status === "draft") {
    return "Draft";
  }

  if (status === "published") {
    return "Published";
  }

  return "Archived";
}

function toDrafts(items: SupportFaqItem[]): Record<number, FaqDraft> {
  return items.reduce<Record<number, FaqDraft>>((accumulator, item) => {
    accumulator[item.id] = {
      faqType: item.faqType,
      questionJson: item.questionJson,
      answerJson: item.answerJson,
      status: item.status,
      seqNo: item.seqNo,
    };
    return accumulator;
  }, {});
}

const EMPTY_ANSWER_JSON = serializeTipTapDocument(createEmptyTipTapDocument());
const EMPTY_QUESTION_JSON = serializeTipTapDocument(createEmptyTipTapDocument());

function getInitialEditorContent(contentJson: string): JSONContent {
  const parsed = parseSerializedTipTapDocument(contentJson);
  if (parsed.success) {
    return parsed.content;
  }
  // Fallback: if createTextTipTapDocument is not robust, return an empty document
  try {
    return createTextTipTapDocument(parsed.message);
  } catch {
    return createEmptyTipTapDocument();
  }
}

function normalizeFaqType(value: string): string {
  return value.trim();
}

type ToolbarButtonProps = {
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
};

function ToolbarButton({
  label,
  onClick,
  active = false,
  disabled = false,
  children,
}: ToolbarButtonProps) {
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onMouseDown={ (event) => event.preventDefault() }
      onClick={ onClick }
      disabled={ disabled }
      aria-label={ label }
      className={ active ? "border-[#2a778a] bg-[#dff4fb] text-[#114b5b]" : "border-[#c2d9e0]" }
    >
      { children }
      <span className="sr-only">{ label }</span>
    </Button>
  );
}

type FaqRichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  minHeightClass: string;
};

function FaqRichTextEditor({ value, onChange, minHeightClass }: FaqRichTextEditorProps) {
  const safeValue = typeof value === 'string' ? value : '';
  const editor = useEditor({
    extensions: [
      StarterKit,
      LinkExtension.configure({
        autolink: true,
        defaultProtocol: "https",
        openOnClick: false,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: getInitialEditorContent(safeValue),
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          `tiptap ${ minHeightClass } rounded-b-xl border border-t-0 border-[#c2d9e0] bg-white px-4 py-3 text-sm leading-6 text-[#164657] shadow-sm outline-none`,
      },
    },
    onUpdate({ editor: currentEditor }: { editor: import("@tiptap/core").Editor }) {
      onChange(serializeTipTapDocument(currentEditor.getJSON()));
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    const nextContent = getInitialEditorContent(value);
    const currentJson = serializeTipTapDocument(editor.getJSON());
    const nextJson = serializeTipTapDocument(nextContent);

    if (currentJson !== nextJson) {
      editor.commands.setContent(nextContent);
    }
  }, [editor, value]);

  // Helper: only show mark as active if selection is not empty and mark is active
  function isMarkActiveWithSelection(mark: string) {
    if (!editor) return false;
    const { empty } = editor.state.selection;
    if (empty) return false;
    return editor.isActive(mark);
  }

  return (
    <div className="grid gap-0.5">
      <div className="flex flex-wrap gap-2 rounded-t-xl border border-[#c2d9e0] bg-[#f6fcff] p-2">
        {/* ...existing code... */ }
        <ToolbarButton
          label="Bold"
          onClick={ () => editor?.chain().focus().toggleBold().run() }
          active={ editor?.isActive("bold") }
          disabled={ !editor }
        >
          <Bold />
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          onClick={ () => editor?.chain().focus().toggleItalic().run() }
          active={ editor?.isActive("italic") }
          disabled={ !editor }
        >
          <Italic />
        </ToolbarButton>
        <ToolbarButton
          label="Underline"
          onClick={ () => editor?.chain().focus().toggleUnderline().run() }
          active={ editor?.isActive("underline") }
          disabled={ !editor }
        >
          <UnderlineIcon />
        </ToolbarButton>
        {/* H2 and H3 buttons */ }
        <ToolbarButton
          label="Heading 2"
          onClick={ () => editor?.chain().focus().toggleHeading({ level: 2 }).run() }
          active={ editor?.isActive("heading", { level: 2 }) }
          disabled={ !editor }
        >
          <span className="font-bold text-base">H2</span>
        </ToolbarButton>
        <ToolbarButton
          label="Heading 3"
          onClick={ () => editor?.chain().focus().toggleHeading({ level: 3 }).run() }
          active={ editor?.isActive("heading", { level: 3 }) }
          disabled={ !editor }
        >
          <span className="font-bold text-base">H3</span>
        </ToolbarButton>
        <ToolbarButton
          label="Numbered list"
          onClick={ () => editor?.chain().focus().toggleOrderedList().run() }
          active={ editor?.isActive("orderedList") }
          disabled={ !editor }
        >
          <ListOrdered />
        </ToolbarButton>
        <ToolbarButton
          label="Quote"
          onClick={ () => editor?.chain().focus().toggleBlockquote().run() }
          active={ editor?.isActive("blockquote") }
          disabled={ !editor }
        >
          <Quote />
        </ToolbarButton>
        <ToolbarButton
          label="Set link"
          onClick={ () => {
            if (!editor) {
              return;
            }

            const currentHref = editor.getAttributes("link").href as string | undefined;
            const hrefInput = window.prompt("Enter URL", currentHref ?? "https://");

            if (hrefInput === null) {
              return;
            }

            const href = hrefInput.trim();
            if (!href) {
              editor.chain().focus().extendMarkRange("link").unsetLink().run();
              return;
            }

            editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
          } }
          active={ editor?.isActive("link") }
          disabled={ !editor }
        >
          <Link2 />
        </ToolbarButton>
        <ToolbarButton
          label="Remove link"
          onClick={ () => editor?.chain().focus().extendMarkRange("link").unsetLink().run() }
          disabled={ !editor }
        >
          <Unlink />
        </ToolbarButton>
        <ToolbarButton
          label="Insert table"
          onClick={ () => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() }
          active={ editor?.isActive("table") }
          disabled={ !editor }
        >
          <Table2 />
        </ToolbarButton>
        <ToolbarButton
          label="Add table row"
          onClick={ () => editor?.chain().focus().addRowAfter().run() }
          disabled={ !editor || !editor.isActive("table") }
        >
          <Plus />
        </ToolbarButton>
        <ToolbarButton
          label="Add table column"
          onClick={ () => editor?.chain().focus().addColumnAfter().run() }
          disabled={ !editor || !editor.isActive("table") }
        >
          <Plus />
        </ToolbarButton>
        <ToolbarButton
          label="Delete table"
          onClick={ () => editor?.chain().focus().deleteTable().run() }
          disabled={ !editor || !editor.isActive("table") }
        >
          <Trash2 />
        </ToolbarButton>
        <ToolbarButton
          label="Undo"
          onClick={ () => editor?.chain().focus().undo().run() }
          disabled={ !editor?.can().undo() }
        >
          <Undo2 />
        </ToolbarButton>
        <ToolbarButton
          label="Redo"
          onClick={ () => editor?.chain().focus().redo().run() }
          disabled={ !editor?.can().redo() }
        >
          <Redo2 />
        </ToolbarButton>
      </div>
      <div className="rounded-b-xl [&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-5 [&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:pl-5 [&_.tiptap_li]:my-1 [&_.tiptap_blockquote]:border-l-4 [&_.tiptap_blockquote]:border-[#b9d2dd] [&_.tiptap_blockquote]:pl-4 [&_.tiptap_a]:font-semibold [&_.tiptap_a]:text-[#0c6087] [&_.tiptap_a]:underline [&_.tiptap_table]:my-3 [&_.tiptap_table]:w-full [&_.tiptap_table]:border-collapse [&_.tiptap_table]:overflow-hidden [&_.tiptap_table]:rounded-lg [&_.tiptap_th]:border [&_.tiptap_th]:border-[#b9d2dd] [&_.tiptap_th]:bg-[#e9f6fb] [&_.tiptap_th]:px-2 [&_.tiptap_th]:py-1.5 [&_.tiptap_th]:text-left [&_.tiptap_td]:border [&_.tiptap_td]:border-[#c9dce4] [&_.tiptap_td]:px-2 [&_.tiptap_td]:py-1.5">
        <EditorContent editor={ editor } />
      </div>
    </div>
  );
}

export function SupportFaqUpdateHomePage({ faqItems, faqTypes, loadError }: SupportFaqUpdateHomePageProps) {
  // --- State and helpers ---
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [customFaqTypes, setCustomFaqTypes] = useState<string[]>([]);
  const [faqList, setFaqList] = useState(() => [...faqItems].sort((a, b) => a.seqNo - b.seqNo));
  const [selectedFaqId, setSelectedFaqId] = useState<number | null>(faqItems[0]?.id ?? null);
  const [composerMode, setComposerMode] = useState<'add' | 'edit' | 'view'>(faqItems.length > 0 ? 'view' : 'add');
  const [draft, setDraft] = useState<FaqDraft>(() => {
    if (faqItems[0]) return toDrafts([faqItems[0]])[faqItems[0].id];
    return {
      faqType: faqTypes[0] ?? 'global',
      questionJson: EMPTY_QUESTION_JSON,
      answerJson: EMPTY_ANSWER_JSON,
      status: 'published',
      seqNo: 1,
    };
  });
  const [isAddingFaqType, setIsAddingFaqType] = useState(false);
  const [newFaqTypeInput, setNewFaqTypeInput] = useState("");

  const baseDraftsById = useMemo(() => toDrafts(faqList), [faqList]);
  const faqCountLabel = useMemo(() => {
    const count = faqList.length;
    return `${ count } FAQ${ count === 1 ? '' : 's' }`;
  }, [faqList.length]);
  const availableFaqTypes = useMemo(() => {
    const baseTypes = faqTypes.length > 0 ? faqTypes : ["global"];
    const mergedTypes = [...baseTypes];
    for (const typeOption of customFaqTypes) {
      if (!mergedTypes.some((existingType) => existingType.toLocaleLowerCase() === typeOption.toLocaleLowerCase())) {
        mergedTypes.push(typeOption);
      }
    }
    return mergedTypes;
  }, [customFaqTypes, faqTypes]);

  // --- Handlers ---
  function handleSelectFaq(faqId: number) {
    setSelectedFaqId(faqId);
    setComposerMode('view');
    setDraft(baseDraftsById[faqId]);
  }
  function handleAddFaq() {
    setComposerMode('add');
    // Set seqNo to max(seqNo) + 1
    const maxSeqNo = faqList.length > 0 ? Math.max(...faqList.map(f => f.seqNo)) : 0;
    setDraft({
      faqType: faqTypes[0] ?? 'global',
      questionJson: EMPTY_QUESTION_JSON,
      answerJson: EMPTY_ANSWER_JSON,
      status: 'published',
      seqNo: maxSeqNo + 1,
    });
    setSelectedFaqId(null);
  }
  function handleEditFaq() {
    if (selectedFaqId == null) return;
    setComposerMode('edit');
    setDraft(baseDraftsById[selectedFaqId]);
  }
  function handleCancel() {
    if (selectedFaqId != null) {
      setComposerMode('view');
      setDraft(baseDraftsById[selectedFaqId]);
    } else {
      setComposerMode('add');
      // Set seqNo to max(seqNo) + 1
      const maxSeqNo = faqList.length > 0 ? Math.max(...faqList.map(f => f.seqNo)) : 0;
      setDraft({
        faqType: faqTypes[0] ?? 'global',
        questionJson: EMPTY_QUESTION_JSON,
        answerJson: EMPTY_ANSWER_JSON,
        status: 'published',
        seqNo: maxSeqNo + 1,
      });
    }
  }
  function handleSelectFaqType(value: string) {
    if (value === ADD_NEW_FAQ_TYPE_OPTION) {
      setIsAddingFaqType(true);
      return;
    }
    setIsAddingFaqType(false);
    setDraft((d) => ({ ...d, faqType: value }));
  }
  function handleApplyNewFaqType() {
    const normalizedValue = normalizeFaqType(newFaqTypeInput);
    if (!normalizedValue) {
      toast.error("Enter a FAQ type name first.", { position: "top-center", duration: 2200 });
      return;
    }
    const duplicate = availableFaqTypes.some(
      (existingType) => existingType.toLocaleLowerCase() === normalizedValue.toLocaleLowerCase(),
    );
    if (duplicate) {
      setDraft((d) => ({ ...d, faqType: normalizedValue }));
      setIsAddingFaqType(false);
      setNewFaqTypeInput("");
      return;
    }
    setCustomFaqTypes((currentTypes) => [...currentTypes, normalizedValue]);
    setDraft((d) => ({ ...d, faqType: normalizedValue }));
    setIsAddingFaqType(false);
    setNewFaqTypeInput("");
  }
  function handleCancelNewFaqType() {
    setIsAddingFaqType(false);
    setNewFaqTypeInput("");
  }
  function handleDraftChange(field: keyof FaqDraft, value: string | number) {
    setDraft((d) => ({ ...d, [field]: value }));
  }
  function handleCreateFaq() {
    const parsedQuestion = parseSerializedTipTapDocument(draft.questionJson);
    const parsedAnswer = parseSerializedTipTapDocument(draft.answerJson);
    if (!parsedQuestion.success || isTipTapDocumentEmpty(parsedQuestion.content) || !parsedAnswer.success || isTipTapDocumentEmpty(parsedAnswer.content)) {
      toast.error("Enter both a question and an answer.", { position: "top-center", duration: 2400 });
      return;
    }
    startTransition(async () => {
      const result = await createSupportFaqAction({
        faqType: draft.faqType,
        questionJson: serializeTipTapDocument(parsedQuestion.content),
        answerJson: serializeTipTapDocument(parsedAnswer.content),
        status: draft.status,
        seqNo: draft.seqNo,
      });
      if (!result.success) {
        toast.error(result.message, { position: "top-center", duration: 2600 });
        return;
      }
      toast.success(result.message, { position: "top-center", duration: 2200 });
      // Add new FAQ to local state and sort
      setFaqList(prev => [...prev, result.faqItem].sort((a, b) => a.seqNo - b.seqNo));
      setComposerMode('add');
      setSelectedFaqId(null);
      // Reset draft to next seqNo
      const maxSeqNo = faqList.length > 0 ? Math.max(...faqList.map(f => f.seqNo)) : 0;
      setDraft({
        faqType: faqTypes[0] ?? 'global',
        questionJson: EMPTY_QUESTION_JSON,
        answerJson: EMPTY_ANSWER_JSON,
        status: 'published',
        seqNo: maxSeqNo + 2, // +2 because we just added one
      });
    });
  }
  function handleSaveFaq() {
    if (selectedFaqId == null) return;
    const parsedQuestion = parseSerializedTipTapDocument(draft.questionJson);
    const parsedAnswer = parseSerializedTipTapDocument(draft.answerJson);
    if (!parsedQuestion.success || isTipTapDocumentEmpty(parsedQuestion.content) || !parsedAnswer.success || isTipTapDocumentEmpty(parsedAnswer.content)) {
      toast.error("Question and answer cannot be empty.", { position: "top-center", duration: 2400 });
      return;
    }
    startTransition(async () => {
      const result = await updateSupportFaqAction({
        id: selectedFaqId,
        faqType: draft.faqType,
        questionJson: serializeTipTapDocument(parsedQuestion.content),
        answerJson: serializeTipTapDocument(parsedAnswer.content),
        status: draft.status,
        seqNo: draft.seqNo,
      });
      if (!result.success) {
        toast.error(result.message, { position: "top-center", duration: 2600 });
        return;
      }
      toast.success(result.message, { position: "top-center", duration: 2200 });
      // Update local state and sort
      setFaqList(prev => prev.map(f => f.id === selectedFaqId ? result.faqItem : f).sort((a, b) => a.seqNo - b.seqNo));
      setComposerMode('view');
      setDraft(toDrafts([result.faqItem])[result.faqItem.id]);
    });
  }
  function handleDeleteFaq() {
    if (selectedFaqId == null) return;
    const shouldDelete = window.confirm("Delete this FAQ entry?");
    if (!shouldDelete) return;
    startTransition(async () => {
      const result = await deleteSupportFaqAction(selectedFaqId);
      if (!result.success) {
        toast.error(result.message, { position: "top-center", duration: 2600 });
        return;
      }
      toast.success(result.message, { position: "top-center", duration: 2200 });
      // Remove from local state and sort
      setFaqList(prev => prev.filter(f => f.id !== selectedFaqId).sort((a, b) => a.seqNo - b.seqNo));
      setComposerMode('add');
      setSelectedFaqId(null);
      // Set seqNo to max(seqNo) + 1
      const maxSeqNo = faqList.length > 0 ? Math.max(...faqList.map(f => f.seqNo)) : 0;
      setDraft({
        faqType: faqTypes[0] ?? 'global',
        questionJson: EMPTY_QUESTION_JSON,
        answerJson: EMPTY_ANSWER_JSON,
        status: 'published',
        seqNo: maxSeqNo + 1,
      });
    });
  }

  // --- Layout ---
  return (
    <section className="font-app w-full px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header (A) */ }
        <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,rgba(7,63,72,0.96),rgba(29,113,128,0.9)_54%,rgba(238,188,120,0.86))] px-6 py-8 text-white shadow-[0_28px_80px_-40px_rgba(3,36,49,0.95)] sm:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[0.7rem] font-bold uppercase tracking-[0.33em] text-[#d5f9ff]">Support Admin</p>
              <h1 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">FAQ Maintenance</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#e9fcff]">Add, revise, and remove frequently asked questions shown in the support experience.</p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <div className="inline-flex rounded-full border border-white/35 bg-white/15 px-4 py-2 text-sm font-semibold">{ faqCountLabel }</div>
                <Link href="/" className="inline-flex items-center rounded-full border border-white/40 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#edfcff] transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">Return to Main Page</Link>
              </div>
            </div>
          </div>
        </div>

        {/* Main grid: FAQ List (B) and FAQ Form (C) */ }
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          {/* FAQ List (B) */ }
          <div className="min-w-0 overflow-hidden rounded-[1.8rem] border border-[#d8e8ed] bg-white/90 shadow-[0_18px_50px_-36px_rgba(7,63,72,0.55)]">
            <div className="border-b border-[#e4d9ee] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(246,252,255,0.86))] px-5 py-5 sm:px-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#155f75]">FAQ Directory</p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-[#164657]">Select a FAQ</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[#4a6d79]">Select a FAQ to view or edit, or add a new FAQ using the form.</p>
                </div>
                <div className="rounded-full border border-[#e4d9ee] bg-[#f6fcff] px-4 py-2 text-sm font-semibold text-[#456674]">{ faqList.length } FAQ{ faqList.length !== 1 ? 's' : '' }</div>
              </div>
            </div>
            <div className="px-5 py-5 sm:px-6">
              { faqList.length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-[#c3d7de] bg-[#f8fcff] px-6 py-10 text-center text-[#4a6d79]">
                  <MessageCircleQuestion className="mx-auto mb-3 size-10 text-[#608f9d]" />
                  <p className="text-lg font-semibold text-[#164657]">No FAQs have been added yet.</p>
                  <p className="mt-2 text-sm">Use Add FAQ to create the first entry.</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  { [...faqList].sort((a, b) => a.seqNo - b.seqNo).map((faqItem) => {
                    const isSelected = faqItem.id === selectedFaqId;
                    return (
                      <button
                        key={ faqItem.id }
                        type="button"
                        onClick={ () => handleSelectFaq(faqItem.id) }
                        className={ `w-full rounded-[1.3rem] border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#155f75] ${ isSelected ? 'border-[#155f75] bg-[#e9f6fb] shadow-[0_18px_45px_-35px_rgba(21,95,117,0.13)]' : 'border-[#d5e4e9] bg-white hover:border-[#b9d2dd] hover:bg-[#f6fcff]' }` }
                      >
                        <div className="flex flex-col gap-1">
                          <span className="text-[0.64rem] font-bold uppercase tracking-[0.16em] text-[#155f75]">FAQ</span>
                          <span className="text-base font-bold text-[#164657]">{ faqItem.faqType }</span>
                          <span className="text-xs text-[#4a6d79]">{
                            (() => {
                              const parsed = parseSerializedTipTapDocument(faqItem.questionJson);
                              if (parsed.success) {
                                // Try to get the first text node for preview
                                const node = parsed.content?.content?.find((n: any) => n.type === 'paragraph' && Array.isArray(n.content));
                                if (node && Array.isArray(node.content)) {
                                  const textNode = node.content.find((c: any) => c.type === 'text');
                                  return textNode?.text?.slice(0, 60) ?? '';
                                }
                              }
                              return '';
                            })()
                          }</span>
                        </div>
                      </button>
                    );
                  }) }
                </div>
              ) }
              <div className="mt-6 flex flex-wrap gap-3">
                <Button type="button" onClick={ handleAddFaq } className="rounded-full bg-[#155f75] px-5 text-white hover:bg-[#0f4d5f]">
                  <Plus /> Add FAQ
                </Button>
                { selectedFaqId != null && (
                  <Button type="button" variant="outline" onClick={ handleEditFaq } className="rounded-full border-[#155f75] text-[#155f75] hover:bg-[#ecf8fc]">
                    <PenSquare /> Edit Selected
                  </Button>
                ) }
              </div>
            </div>
          </div>

          {/* FAQ Form (C) */ }
          <div className="min-w-0 overflow-hidden rounded-[1.8rem] border border-[#d8e8ed] bg-[#f6fcff] shadow-[0_18px_50px_-36px_rgba(7,63,72,0.65)]">
            <div className="border-b border-[#e4d9ee] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(246,252,255,0.86))] px-5 py-5 sm:px-6">
              <h2 className="text-xl font-black tracking-tight text-[#164657]">
                { composerMode === 'add' ? 'Add a New FAQ' : composerMode === 'edit' ? 'Edit FAQ' : 'View FAQ' }
              </h2>
              <p className="mt-2 text-sm text-[#4a6d79]">Keep answers concise and plain-language so members can resolve issues quickly.</p>
            </div>
            <div className="space-y-5 px-5 py-5 sm:px-6">
              { loadError ? (
                <p className="rounded-xl border border-[#f1d8d8] bg-[#fff6f6] px-4 py-3 text-sm text-[#8a3e3e]">{ loadError }</p>
              ) : null }
              <label className="grid gap-2 text-sm font-semibold text-[#164657] sm:max-w-56">
                FAQ Type
                <select
                  value={ draft.faqType }
                  onChange={ (event) => handleSelectFaqType(event.target.value) }
                  disabled={ composerMode === 'view' }
                  className="rounded-xl border border-[#c2d9e0] bg-white px-4 py-3 text-sm text-[#164657] shadow-sm outline-none transition focus:border-[#2a778a] focus:ring-2 focus:ring-[#d4edf4]"
                >
                  { availableFaqTypes.map((faqType) => (
                    <option key={ faqType } value={ faqType }>{ faqType }</option>
                  )) }
                  <option value={ ADD_NEW_FAQ_TYPE_OPTION }>+ Add new type...</option>
                </select>
              </label>
              { isAddingFaqType ? (
                <div className="grid gap-2 sm:max-w-80">
                  <label className="text-sm font-semibold text-[#164657]" htmlFor="new-faq-type-input">New FAQ Type</label>
                  <div className="flex gap-2">
                    <input
                      id="new-faq-type-input"
                      type="text"
                      value={ newFaqTypeInput }
                      onChange={ (event) => setNewFaqTypeInput(event.target.value) }
                      onKeyDown={ (event) => { if (event.key === 'Enter') { event.preventDefault(); handleApplyNewFaqType(); } } }
                      placeholder="Example: account-access"
                      className="w-full rounded-xl border border-[#c2d9e0] bg-white px-4 py-2.5 text-sm text-[#164657] shadow-sm outline-none transition focus:border-[#2a778a] focus:ring-2 focus:ring-[#d4edf4]"
                    />
                    <Button type="button" variant="outline" onClick={ handleApplyNewFaqType } className="rounded-full border-[#155f75] px-4 text-[#155f75] hover:bg-[#ecf8fc]">Use</Button>
                    <Button type="button" variant="outline" onClick={ handleCancelNewFaqType } className="rounded-full border-[#c2d9e0] px-4 text-[#456674] hover:bg-[#f2f8fb]">Cancel</Button>
                  </div>
                </div>
              ) : null }
              <label className="grid gap-2 text-sm font-semibold text-[#164657]">
                Question
                <FaqRichTextEditor value={ draft.questionJson } onChange={ (v) => handleDraftChange('questionJson', v) } minHeightClass="min-h-[7rem]" />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-[#164657]">
                Answer
                <FaqRichTextEditor value={ draft.answerJson } onChange={ (v) => handleDraftChange('answerJson', v) } minHeightClass="min-h-[10rem]" />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-[#164657] sm:max-w-56">
                Status
                <select
                  value={ draft.status }
                  onChange={ (event) => handleDraftChange('status', event.target.value as SupportFaqStatus) }
                  disabled={ composerMode === 'view' }
                  className="rounded-xl border border-[#c2d9e0] bg-white px-4 py-3 text-sm text-[#164657] shadow-sm outline-none transition focus:border-[#2a778a] focus:ring-2 focus:ring-[#d4edf4]"
                >
                  { SUPPORT_FAQ_STATUS_OPTIONS.map((statusOption) => (
                    <option key={ statusOption } value={ statusOption }>{ toStatusLabel(statusOption) }</option>
                  )) }
                </select>
              </label>
              <label className="grid gap-2 text-sm font-semibold text-[#164657] sm:max-w-56">
                Sequence Number
                <input
                  type="number"
                  min={ 1 }
                  value={ draft.seqNo }
                  onChange={ e => handleDraftChange('seqNo', Number(e.target.value)) }
                  disabled={ composerMode === 'view' }
                  className="rounded-xl border border-[#c2d9e0] bg-white px-4 py-3 text-sm text-[#164657] shadow-sm outline-none transition focus:border-[#2a778a] focus:ring-2 focus:ring-[#d4edf4]"
                />
              </label>
              <div className="flex flex-wrap gap-2 pt-1">
                { composerMode === 'add' && (
                  <Button type="button" onClick={ handleCreateFaq } disabled={ isPending } className="rounded-full bg-[#155f75] px-5 text-white hover:bg-[#0f4d5f]">
                    <Plus /> Add FAQ
                  </Button>
                ) }
                { composerMode === 'edit' && (
                  <Button type="button" onClick={ handleSaveFaq } disabled={ isPending } className="rounded-full bg-[#145f74] px-4 text-white hover:bg-[#0e4a5a]">
                    <Save /> Save
                  </Button>
                ) }
                { (composerMode === 'edit' || composerMode === 'add') && (
                  <Button type="button" variant="outline" onClick={ handleCancel } className="rounded-full border-[#c2d9e0] text-[#456674] hover:bg-[#f2f8fb]">
                    <X /> Cancel
                  </Button>
                ) }
                { composerMode === 'view' && selectedFaqId != null && (
                  <Button type="button" variant="outline" onClick={ handleEditFaq } className="rounded-full border-[#155f75] text-[#155f75] hover:bg-[#ecf8fc]">
                    <PenSquare /> Edit
                  </Button>
                ) }
                { composerMode === 'view' && selectedFaqId != null && (
                  <Button type="button" variant="outline" onClick={ handleDeleteFaq } className="rounded-full border-[#d7a6a6] text-[#8f3636] hover:bg-[#fff4f4]">
                    <Trash2 /> Delete
                  </Button>
                ) }
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}