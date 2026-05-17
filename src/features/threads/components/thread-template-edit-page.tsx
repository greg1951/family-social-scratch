"use client";

import type { JSONContent } from "@tiptap/core";
import Underline from "@tiptap/extension-underline";
import LinkExtension from "@tiptap/extension-link";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, type Editor, useEditor } from "@tiptap/react";
import {
  ArrowLeft,
  Bold,
  Heading2,
  Heading3,
  Italic,
  Link2,
  ListOrdered,
  List,
  Minus,
  Redo2,
  Save,
  Underline as UnderlineIcon,
  Undo2,
  Unlink,
  X,
} from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { saveThreadTemplateAction } from "@/app/(features)/(threads)/threads/thread-template/actions";
import {
  createEmptyTipTapDocument,
  parseSerializedTipTapDocument,
  serializeTipTapDocument,
} from "@/components/db/types/poem-term-validation";
import { ThreadTemplate } from "@/components/db/types/thread-templates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ThreadTemplateEditPageProps = {
  initialTemplate?: ThreadTemplate;
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
      onClick={ onClick }
      disabled={ disabled }
      className={ active
        ? "rounded-full border-[#7c4fa6] bg-[#f2e8ff] text-[#5a1e9b]"
        : "rounded-full border-[#d7c9e8] bg-white text-[#7c4fa6]" }
      aria-label={ label }
    >
      { children }
    </Button>
  );
}

function RichTextToolbar({ editor }: { editor: Editor | null }) {
  if (!editor) {
    return null;
  }

  const richEditor = editor;

  const canToggleBulletList = richEditor.isActive("taskList")
    ? richEditor.can().chain().focus().toggleTaskList().toggleBulletList().run()
    : richEditor.can().chain().focus().toggleBulletList().run();

  const canToggleOrderedList = richEditor.isActive("taskList")
    ? richEditor.can().chain().focus().toggleTaskList().toggleOrderedList().run()
    : richEditor.can().chain().focus().toggleOrderedList().run();

  // Always allow To-Do unless editor is empty
  const canToggleTaskList = richEditor.isEmpty ? false : true;

  function handleToggleBulletList() {
    const chain = richEditor.chain().focus();

    if (richEditor.isActive("taskList")) {
      chain.toggleTaskList();
    }

    chain.toggleBulletList().run();
  }

  function handleToggleOrderedList() {
    const chain = richEditor.chain().focus();

    if (richEditor.isActive("taskList")) {
      chain.toggleTaskList();
    }

    chain.toggleOrderedList().run();
  }

  function handleToggleTaskList() {
    const chain = richEditor.chain().focus();
    // If not allowed, force paragraph first
    if (!richEditor.can().chain().focus().toggleTaskList().run()) {
      chain.setParagraph();
    }
    chain.toggleTaskList().run();
  }

  return (
    <div className="flex flex-wrap gap-2 rounded-t-[1.4rem] border border-b-0 border-[#d7c9e8] bg-[#faf6ff] p-3">
      <ToolbarButton
        label="Normal"
        onClick={ () => richEditor.chain().focus().setParagraph().run() }
        active={ richEditor.isActive("paragraph") }
        disabled={ richEditor.isEmpty }
      >
        <span className="text-base font-normal">Normal</span>
      </ToolbarButton>
      <ToolbarButton
        label="Heading 2"
        onClick={ () => richEditor.chain().focus().toggleHeading({ level: 2 }).run() }
        active={ richEditor.isActive("heading", { level: 2 }) }
        disabled={ !richEditor.can().chain().focus().toggleHeading({ level: 2 }).run() }
      >
        <Heading2 className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Heading 3"
        onClick={ () => richEditor.chain().focus().toggleHeading({ level: 3 }).run() }
        active={ richEditor.isActive("heading", { level: 3 }) }
        disabled={ !richEditor.can().chain().focus().toggleHeading({ level: 3 }).run() }
      >
        <Heading3 className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Bold"
        onClick={ () => richEditor.chain().focus().toggleBold().run() }
        active={ richEditor.isActive("bold") }
        disabled={ !richEditor.can().chain().focus().toggleBold().run() }
      >
        <Bold className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Italic"
        onClick={ () => richEditor.chain().focus().toggleItalic().run() }
        active={ richEditor.isActive("italic") }
        disabled={ !richEditor.can().chain().focus().toggleItalic().run() }
      >
        <Italic className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Underline"
        onClick={ () => richEditor.chain().focus().toggleUnderline().run() }
        active={ richEditor.isActive("underline") }
        disabled={ !richEditor.can().chain().focus().toggleUnderline().run() }
      >
        <UnderlineIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Bullet list"
        onClick={ handleToggleBulletList }
        active={ richEditor.isActive("bulletList") }
        disabled={ !canToggleBulletList }
      >
        <List className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Numbered list"
        onClick={ handleToggleOrderedList }
        active={ richEditor.isActive("orderedList") }
        disabled={ !canToggleOrderedList }
      >
        <ListOrdered className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="To-do list"
        onClick={ handleToggleTaskList }
        active={ richEditor.isActive("taskList") }
        disabled={ !canToggleTaskList }
      >
        <span className="text-[0.66rem] font-bold uppercase tracking-wide">To-do</span>
      </ToolbarButton>
      <ToolbarButton
        label="Horizontal line"
        onClick={ () => richEditor.chain().focus().setHorizontalRule().run() }
        disabled={ !richEditor.can().chain().focus().setHorizontalRule().run() }
      >
        <Minus className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Undo"
        onClick={ () => richEditor.chain().focus().undo().run() }
        disabled={ !richEditor.can().chain().focus().undo().run() }
      >
        <Undo2 className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Redo"
        onClick={ () => richEditor.chain().focus().redo().run() }
        disabled={ !richEditor.can().chain().focus().redo().run() }
      >
        <Redo2 className="size-4" />
      </ToolbarButton>
    </div>
  );
}

export function ThreadTemplateEditPage({ initialTemplate }: ThreadTemplateEditPageProps) {
  const router = useRouter();
  const [isSaving, startSaveTransition] = useTransition();
  const [templateName, setTemplateName] = useState(initialTemplate?.templateName ?? "");
  const [templateCategory, setTemplateCategory] = useState<"global" | "thread">(
    initialTemplate?.templateCategory ?? "thread",
  );
  const [templateStatus, setTemplateStatus] = useState<"draft" | "active" | "archived">(
    initialTemplate?.status ?? "draft",
  );

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      LinkExtension.configure({
        autolink: true,
        defaultProtocol: "https",
        openOnClick: false,
      }),
    ],
    content: getEditorDocument(initialTemplate?.templateJson),
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "tiptap min-h-[20rem]",
      },
    },
  });

  function handleSave() {
    const normalizedName = templateName.trim();

    if (!normalizedName) {
      toast.error("Enter a template name before saving.");
      return;
    }

    if (!editor) {
      toast.error("Editor is not ready.");
      return;
    }

    const editorJson = serializeTipTapDocument(editor.getJSON());

    startSaveTransition(async () => {
      const result = await saveThreadTemplateAction({
        id: initialTemplate?.id,
        templateName: normalizedName,
        templateCategory,
        templateJson: editorJson,
        status: templateStatus,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.push("/threads/thread-template");
      router.refresh();
    });
  }

  function handleCancel() {
    router.back();
  }

  return (
    <section className="font-app w-full px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */ }
        <div className="rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,rgba(124,79,166,0.96),rgba(179,135,202,0.9)_52%,rgba(217,199,229,0.82))] px-6 py-8 text-white shadow-[0_28px_80px_-40px_rgba(92,30,155,0.95)] sm:px-8 lg:px-10">
          <div className="flex flex-col gap-5">
            <div className="max-w-3xl">
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.34em] text-[#f0e1ff]">
                Thread Templates
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={ () => router.push("/threads/thread-template") }
                disabled={ isSaving }
                className="mt-3 rounded-full border-white/50 bg-white/10 text-white hover:bg-white/20"
              >
                <ArrowLeft className="size-4" />
                Back to Templates
              </Button>
              <h1 className="mt-4 text-lg font-black tracking-tight sm:text-2xl">
                { initialTemplate ? "Edit Template" : "Create New Template" }
              </h1>
              <p className="mt-2 text-sm text-[#e8d7ff]">
                Design a rich text template with H2, H3, bold, italic, underline, bullets, numbers, and lines. Use !! as variable delimiters for placeholders.
              </p>
            </div>
          </div>
        </div>

        {/* Form */ }
        <div className="space-y-4 rounded-[1.9rem] border border-white/70 bg-white/90 shadow-[0_24px_70px_-40px_rgba(124,79,166,0.7)] p-6">
          {/* Template Info */ }
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#5d426f]">
                  Template Name
                </label>
                <Input
                  value={ templateName }
                  onChange={ (event) => setTemplateName(event.target.value) }
                  placeholder="e.g., Support Response, Member Departure"
                  className="border-[#d7c9e8] text-[#43245d]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#5d426f]">
                  Category
                </label>
                <Select value={ templateCategory } onValueChange={ (value) => setTemplateCategory(value as "global" | "thread") }>
                  <SelectTrigger className="border-[#d7c9e8] text-[#43245d]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">Global</SelectItem>
                    <SelectItem value="thread">Thread</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#5d426f]">
                  Status
                </label>
                <Select value={ templateStatus } onValueChange={ (value) => setTemplateStatus(value as "draft" | "active" | "archived") }>
                  <SelectTrigger className="border-[#d7c9e8] text-[#43245d]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Editor */ }
          <div className="space-y-3">
            <label className="text-sm font-semibold text-[#5d426f]">
              Template Content
            </label>
            <div className="overflow-hidden rounded-[1.4rem] shadow-inner">
              <RichTextToolbar editor={ editor } />
              <EditorContent
                editor={ editor }
                className="[&_.tiptap]:min-h-80 [&_.tiptap]:rounded-b-[1.4rem] [&_.tiptap]:border [&_.tiptap]:border-[#d7c9e8] [&_.tiptap]:bg-white [&_.tiptap]:px-4 [&_.tiptap]:py-4 [&_.tiptap]:text-[#43245d] [&_.tiptap]:outline-none [&_.tiptap_ul:not([data-type='taskList'])]:list-disc [&_.tiptap_ul:not([data-type='taskList'])]:pl-5 [&_.tiptap_blockquote]:border-l-4 [&_.tiptap_blockquote]:border-[#b89dd9] [&_.tiptap_blockquote]:pl-4"
              />
            </div>
          </div>

          {/* Help Text */ }
          <div className="rounded-[1.2rem] border border-[#e4d9ee] bg-[#fcfaff] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7b54a0]">
              Variable Syntax
            </p>
            <p className="mt-2 text-sm text-[#5d426f]">
              Use !! as a delimiter for variables. Example: !!member_name!! or !!support_issue!!
            </p>
          </div>

          {/* Actions */ }
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={ handleCancel }
              disabled={ isSaving }
              className="rounded-full border-[#d7c9e8] text-[#7c4fa6]"
            >
              <X className="size-4" />
              Cancel
            </Button>
            <Button
              type="button"
              onClick={ handleSave }
              disabled={ isSaving }
              className="rounded-full bg-[#7c4fa6] text-white hover:bg-[#6a3d94]"
            >
              <Save className="size-4" />
              { isSaving ? "Saving..." : "Save Template" }
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
