import type { Editor } from "@tiptap/react";
import { EditorContent } from "@tiptap/react";
import {
  Bold,
  Heading3,
  Italic,
  Link2,
  List,
  Redo2,
  Underline as UnderlineIcon,
  Unlink,
  Undo2,
} from "lucide-react";

import { Button } from "@/components/ui/button";

type ToolbarButtonProps = {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
};

function ToolbarButton({ label, active = false, disabled = false, onClick, children }: ToolbarButtonProps) {
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={ onClick }
      disabled={ disabled }
      className={ active
        ? "rounded-full border-[#39637a] bg-[#dff4ff] text-[#12374a]"
        : "rounded-full border-[#c8d7df] bg-white text-[#3d5c6d]" }
      aria-label={ label }
    >
      { children }
    </Button>
  );
}

function RichTextToolbar({
  editor,
  onSetLink,
}: {
  editor: Editor | null;
  onSetLink: () => void;
}) {
  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 rounded-t-[1.4rem] border border-b-0 border-[#c8d7df] bg-[#f4fbff] p-3">
      <ToolbarButton
        label="Heading 3"
        onClick={ () => editor.chain().focus().toggleHeading({ level: 3 }).run() }
        active={ editor.isActive("heading", { level: 3 }) }
        disabled={ !editor.isEditable || !editor.can().chain().focus().toggleHeading({ level: 3 }).run() }
      >
        <Heading3 className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Bold"
        onClick={ () => editor.chain().focus().toggleBold().run() }
        active={ editor.isActive("bold") }
        disabled={ !editor.isEditable || !editor.can().chain().focus().toggleBold().run() }
      >
        <Bold className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Italic"
        onClick={ () => editor.chain().focus().toggleItalic().run() }
        active={ editor.isActive("italic") }
        disabled={ !editor.isEditable || !editor.can().chain().focus().toggleItalic().run() }
      >
        <Italic className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Underline"
        onClick={ () => editor.chain().focus().toggleUnderline().run() }
        active={ editor.isActive("underline") }
        disabled={ !editor.isEditable || !editor.can().chain().focus().toggleUnderline().run() }
      >
        <UnderlineIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Set link"
        onClick={ onSetLink }
        active={ editor.isActive("link") }
        disabled={ !editor.isEditable }
      >
        <Link2 className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Remove link"
        onClick={ () => editor.chain().focus().extendMarkRange("link").unsetLink().run() }
        disabled={ !editor.isEditable || !editor.isActive("link") }
      >
        <Unlink className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Bullet list"
        onClick={ () => editor.chain().focus().toggleBulletList().run() }
        active={ editor.isActive("bulletList") }
        disabled={ !editor.isEditable || !editor.can().chain().focus().toggleBulletList().run() }
      >
        <List className="size-4" />
      </ToolbarButton>
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

export function RichTextField({
  editor,
  minHeightClass,
  onSetLink,
}: {
  editor: Editor | null;
  minHeightClass: string;
  onSetLink: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-[1.4rem] shadow-inner">
      <RichTextToolbar editor={ editor } onSetLink={ onSetLink } />
      <EditorContent
        editor={ editor }
        className={ `[&_.tiptap]:${ minHeightClass } [&_.tiptap]:rounded-b-[1.4rem] [&_.tiptap]:border [&_.tiptap]:border-[#c8d7df] [&_.tiptap]:bg-white [&_.tiptap]:px-4 [&_.tiptap]:py-4 [&_.tiptap]:text-[#183746] [&_.tiptap]:outline-none [&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-5 [&_.tiptap_blockquote]:border-l-4 [&_.tiptap_blockquote]:border-[#7eb2c7] [&_.tiptap_blockquote]:pl-4` }
      />
    </div>
  );
}
