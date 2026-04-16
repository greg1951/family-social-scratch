"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { JSONContent } from "@tiptap/core";
import LinkExtension from "@tiptap/extension-link";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor } from "@tiptap/react";
import {
  ArrowLeft,
  Bold,
  Code,
  BookPlus,
  CodeXml,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Save,
  Undo2,
  Unlink,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import {
  createEmptyTipTapDocument,
  createTextTipTapDocument,
  parseSerializedTipTapDocument,
  serializedTipTapDocumentSchema,
  serializeTipTapDocument,
} from "@/components/db/types/poem-term-validation";
import { SavePoemTermInput, PoemTerm } from "@/components/db/types/poem-verses";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
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
import { savePoemTermAction } from "@/app/(features)/(poetry)/poem-terms/actions";

const poemTermFormSchema = z.object({
  term: z.string().trim().min(2, "Enter at least 2 characters for the term."),
  status: z.enum(["draft", "published", "archived"]),
  termJson: serializedTipTapDocumentSchema,
});

type PoemTermFormValues = z.infer<typeof poemTermFormSchema>;

type PoemTermEditorPageProps = {
  poemTerm: PoemTerm | null;
};

function getInitialEditorContent(termJson?: string): JSONContent {
  const parsed = parseSerializedTipTapDocument(termJson);

  if (parsed.success) {
    return parsed.content;
  }

  return termJson
    ? createTextTipTapDocument(parsed.message)
    : createEmptyTipTapDocument();
}

type ToolbarButtonProps = {
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
};

function ToolbarButton({ label, onClick, active = false, disabled = false, children }: ToolbarButtonProps) {
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={ onClick }
      disabled={ disabled }
      aria-label={ label }
      className={ active ? "border-[#8c62b5] bg-[#f2e8ff] text-[#4e2374]" : "border-[#d7d0ea]" }
    >
      { children }
      <span className="sr-only">{ label }</span>
    </Button>
  );
}

export function PoemTermEditorPage({ poemTerm }: PoemTermEditorPageProps) {
  const router = useRouter();
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkValue, setLinkValue] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);
  const [openLinkInNewTab, setOpenLinkInNewTab] = useState(true);
  const [justSaved, setJustSaved] = useState(false);
  const initialEditorContent = getInitialEditorContent(poemTerm?.termJson);
  const form = useForm<PoemTermFormValues>({
    resolver: zodResolver(poemTermFormSchema),
    defaultValues: {
      term: poemTerm?.term ?? "",
      status: (poemTerm?.status as "draft" | "published" | "archived" | undefined) ?? "draft",
      termJson: serializeTipTapDocument(initialEditorContent),
    },
  });

  const isEditing = Boolean(poemTerm);
  const editor = useEditor({
    extensions: [
      StarterKit,
      LinkExtension.configure({
        autolink: true,
        defaultProtocol: "https",
        openOnClick: false,
      }),
    ],
    content: initialEditorContent,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "tiptap min-h-[20rem] rounded-b-2xl border border-t-0 border-[#d7d0ea] bg-white px-4 py-4 text-[#43245d] shadow-xs outline-none focus:outline-none",
      },
    },
    onUpdate({ editor: currentEditor }) {
      form.setValue("termJson", serializeTipTapDocument(currentEditor.getJSON()), {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
  });

  const normalizedLinkPreview = linkValue.trim() ? normalizeLinkUrl(linkValue) : null;

  useEffect(() => {
    if (!editor) {
      return;
    }

    form.setValue("termJson", serializeTipTapDocument(editor.getJSON()), {
      shouldDirty: false,
      shouldValidate: true,
    });
  }, [editor, form]);

  function handleAddAnother() {
    setJustSaved(false);
    form.reset({
      term: "",
      status: "draft",
      termJson: serializeTipTapDocument(createEmptyTipTapDocument()),
    });
    if (editor) {
      editor.commands.setContent(createEmptyTipTapDocument());
    }
  }

  function openLinkDialog() {
    if (!editor) {
      return;
    }

    const linkAttributes = editor.getAttributes("link") as {
      href?: string;
      target?: string | null;
    };
    const previousUrl = linkAttributes.href;
    setLinkValue(previousUrl ?? "https://");
    setOpenLinkInNewTab(linkAttributes.target === "_blank");
    setLinkError(null);
    setIsLinkDialogOpen(true);
  }

  function normalizeLinkUrl(value: string): string | null {
    const trimmedUrl = value.trim();

    if (!trimmedUrl) {
      return null;
    }

    const candidate = /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(trimmedUrl)
      ? trimmedUrl
      : `https://${ trimmedUrl }`;

    try {
      const normalizedUrl = new URL(candidate);

      if (!["http:", "https:", "mailto:", "tel:"].includes(normalizedUrl.protocol)) {
        return null;
      }

      return normalizedUrl.toString();
    } catch {
      return null;
    }
  }

  function applyLink() {
    if (!editor) {
      return;
    }

    const trimmedUrl = linkValue.trim();

    if (!trimmedUrl) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      setLinkError(null);
      setIsLinkDialogOpen(false);
      return;
    }

    const normalizedUrl = normalizeLinkUrl(trimmedUrl);

    if (!normalizedUrl) {
      setLinkError("Enter a valid http, https, mailto, or tel link.");
      return;
    }

    setLinkValue(normalizedUrl);
    setLinkError(null);

    editor.chain().focus().extendMarkRange("link").setLink({
      href: normalizedUrl,
      target: openLinkInNewTab ? "_blank" : null,
      rel: openLinkInNewTab ? "noopener noreferrer nofollow" : null,
    }).run();
    setIsLinkDialogOpen(false);
  }

  async function handleSubmit(values: PoemTermFormValues) {
    if (!editor) {
      toast.error("Editor is still loading. Try again in a moment.", {
        position: "top-center",
        duration: 2500,
      });
      return;
    }

    const serializedContent = serializeTipTapDocument(editor.getJSON());
    const validationResult = serializedTipTapDocumentSchema.safeParse(serializedContent);

    if (!validationResult.success) {
      form.setError("termJson", {
        message: "Term content must be valid TipTap JSON.",
      });
      return;
    }

    const payload: SavePoemTermInput = {
      id: poemTerm?.id,
      term: values.term,
      status: values.status,
      termJson: validationResult.data,
    };

    const result = await savePoemTermAction(payload);

    if (!result.success) {
      toast.error(result.message, {
        position: "top-center",
        duration: 2500,
      });
      return;
    }

    toast.success(
      isEditing
        ? `Saved changes to "${ result.poemTerm.term }".`
        : `Created "${ result.poemTerm.term }".`,
      {
        position: "top-center",
        duration: 2500,
      }
    );

    if (!isEditing) {
      setJustSaved(true);
    } else {
      router.push("/poem-terms");
      router.refresh();
    }
  }

  return (
    <section className="w-full px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,rgba(57,27,88,0.96),rgba(104,53,148,0.88)_56%,rgba(195,150,110,0.84))] px-6 py-8 text-white shadow-[0_28px_80px_-40px_rgba(46,18,70,0.95)] sm:px-8 lg:px-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.34em] text-[#f1deff]">
                Family Poetry Cafe
              </p>
              <Link
                href="/poem-terms"
                className="mt-3 inline-flex items-center rounded-full border border-white/35 bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#f6ebff] transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <ArrowLeft className="mr-2 size-4" />
                Back to Terms
              </Link>
              <h1 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">
                { isEditing ? "Edit poetry term" : "Add a new poetry term" }
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#f3e8ff]">
                Compose glossary content directly in TipTap. The saved value is validated and stored as serialized TipTap JSON.
              </p>
            </div>

            <div className="rounded-[1.6rem] border border-white/20 bg-white/10 p-4 shadow-inner backdrop-blur sm:min-w-[18rem]">
              <p className="text-xs uppercase tracking-[0.24em] text-[#ead3ff]">Mode</p>
              <p className="mt-2 text-2xl font-black">
                { isEditing ? "Edit" : "Create" }
              </p>
              <p className="mt-1 text-sm text-[#f3e8ff]">
                { isEditing ? poemTerm?.term : "New glossary entry" }
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[1.9rem] border border-white/70 bg-white/88 shadow-[0_24px_70px_-40px_rgba(57,27,88,0.7)] backdrop-blur">
          <div className="border-b border-[#e4d9ee] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(249,244,255,0.86))] px-5 py-5 sm:px-6">
            <h2 className="text-2xl font-black tracking-tight text-[#43245d]">
              Term Details
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#77578f]">
              Draft the definition below. The editor content is saved only as valid TipTap document JSON.
            </p>
          </div>

          <div className="px-5 py-6 sm:px-6">
            <Form { ...form }>
              <form onSubmit={ form.handleSubmit(handleSubmit) } className="space-y-5">
                <fieldset disabled={ form.formState.isSubmitting } className="grid gap-5 md:grid-cols-[1.2fr_0.8fr]">
                  <FormField
                    control={ form.control }
                    name="term"
                    render={ ({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold text-[#43245d]">Term</FormLabel>
                        <FormControl>
                          <Input
                            { ...field }
                            className="border-[#d7d0ea] bg-white text-[#43245d]"
                            placeholder="enter term here"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    ) }
                  />

                  <FormField
                    control={ form.control }
                    name="status"
                    render={ ({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold text-[#43245d]">Status</FormLabel>
                        <Select onValueChange={ field.onChange } value={ field.value }>
                          <FormControl>
                            <SelectTrigger className="border-[#d7d0ea] bg-white text-[#43245d]">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="published">Published</SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    ) }
                  />
                </fieldset>

                <FormField
                  control={ form.control }
                  name="termJson"
                  render={ ({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-[#43245d]">Term Content</FormLabel>
                      <FormControl>
                        <input { ...field } type="hidden" />
                      </FormControl>
                      <div className="overflow-hidden rounded-2xl border border-[#d7d0ea] bg-[#f9f4ff]">
                        <div className="flex flex-wrap gap-2 border-b border-[#d7d0ea] px-3 py-3">
                          <ToolbarButton
                            label="Heading 2"
                            onClick={ () => editor?.chain().focus().toggleHeading({ level: 2 }).run() }
                            active={ editor?.isActive("heading", { level: 2 }) }
                            disabled={ !editor?.can().chain().focus().toggleHeading({ level: 2 }).run() }
                          >
                            <Heading2 />
                          </ToolbarButton>
                          <ToolbarButton
                            label="Heading 3"
                            onClick={ () => editor?.chain().focus().toggleHeading({ level: 3 }).run() }
                            active={ editor?.isActive("heading", { level: 3 }) }
                            disabled={ !editor?.can().chain().focus().toggleHeading({ level: 3 }).run() }
                          >
                            <Heading3 />
                          </ToolbarButton>
                          <ToolbarButton
                            label="Bold"
                            onClick={ () => editor?.chain().focus().toggleBold().run() }
                            active={ editor?.isActive("bold") }
                            disabled={ !editor?.can().chain().focus().toggleBold().run() }
                          >
                            <Bold />
                          </ToolbarButton>
                          <ToolbarButton
                            label="Italic"
                            onClick={ () => editor?.chain().focus().toggleItalic().run() }
                            active={ editor?.isActive("italic") }
                            disabled={ !editor?.can().chain().focus().toggleItalic().run() }
                          >
                            <Italic />
                          </ToolbarButton>
                          <ToolbarButton
                            label="Inline code"
                            onClick={ () => editor?.chain().focus().toggleCode().run() }
                            active={ editor?.isActive("code") }
                            disabled={ !editor?.can().chain().focus().toggleCode().run() }
                          >
                            <Code />
                          </ToolbarButton>
                          <ToolbarButton
                            label="Bullet list"
                            onClick={ () => editor?.chain().focus().toggleBulletList().run() }
                            active={ editor?.isActive("bulletList") }
                            disabled={ !editor?.can().chain().focus().toggleBulletList().run() }
                          >
                            <List />
                          </ToolbarButton>
                          <ToolbarButton
                            label="Ordered list"
                            onClick={ () => editor?.chain().focus().toggleOrderedList().run() }
                            active={ editor?.isActive("orderedList") }
                            disabled={ !editor?.can().chain().focus().toggleOrderedList().run() }
                          >
                            <ListOrdered />
                          </ToolbarButton>
                          <ToolbarButton
                            label="Blockquote"
                            onClick={ () => editor?.chain().focus().toggleBlockquote().run() }
                            active={ editor?.isActive("blockquote") }
                            disabled={ !editor?.can().chain().focus().toggleBlockquote().run() }
                          >
                            <Quote />
                          </ToolbarButton>
                          <ToolbarButton
                            label="Code block"
                            onClick={ () => editor?.chain().focus().toggleCodeBlock().run() }
                            active={ editor?.isActive("codeBlock") }
                            disabled={ !editor?.can().chain().focus().toggleCodeBlock().run() }
                          >
                            <CodeXml />
                          </ToolbarButton>
                          <ToolbarButton
                            label="Horizontal rule"
                            onClick={ () => editor?.chain().focus().setHorizontalRule().run() }
                            disabled={ !editor?.can().chain().focus().setHorizontalRule().run() }
                          >
                            <Minus />
                          </ToolbarButton>
                          <ToolbarButton
                            label="Set link"
                            onClick={ openLinkDialog }
                            active={ editor?.isActive("link") }
                            disabled={ !editor }
                          >
                            <Link2 />
                          </ToolbarButton>
                          <ToolbarButton
                            label="Remove link"
                            onClick={ () => editor?.chain().focus().extendMarkRange("link").unsetLink().run() }
                            active={ false }
                            disabled={ !editor?.isActive("link") }
                          >
                            <Unlink />
                          </ToolbarButton>
                          <ToolbarButton
                            label="Undo"
                            onClick={ () => editor?.chain().focus().undo().run() }
                            disabled={ !editor?.can().chain().focus().undo().run() }
                          >
                            <Undo2 />
                          </ToolbarButton>
                          <ToolbarButton
                            label="Redo"
                            onClick={ () => editor?.chain().focus().redo().run() }
                            disabled={ !editor?.can().chain().focus().redo().run() }
                          >
                            <Redo2 />
                          </ToolbarButton>
                        </div>
                        <EditorContent editor={ editor } />
                      </div>
                      <p className="text-sm text-[#77578f]">
                        Rich Text controls were likely overkill here, but they are here if you need it.
                      </p>
                      <FormMessage />
                    </FormItem>
                  ) }
                />

                <div className="flex flex-wrap justify-end gap-3 border-t border-[#eee5f5] pt-5">
                  <Button type="button" variant="outline" asChild>
                    <Link href="/poem-terms">{ justSaved ? "Back to Terms" : "Cancel" }</Link>
                  </Button>
                  { justSaved ? (
                    <Button type="button" onClick={ handleAddAnother } variant="outline">
                      <BookPlus className="mr-2 size-4" />
                      Add Another Term
                    </Button>
                  ) : null }
                  <Button type="submit" disabled={ form.formState.isSubmitting }>
                    { isEditing ? <Save /> : <BookPlus /> }
                    { isEditing ? "Save Term" : "Create Term" }
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>

      <Dialog open={ isLinkDialogOpen } onOpenChange={ setIsLinkDialogOpen }>
        <DialogContent className="border-[#d7d0ea] bg-[#fcf9ff] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#43245d]">Edit Link</DialogTitle>
            <DialogDescription className="text-[#77578f]">
              Add or replace the URL for the selected text. Leave it blank to remove the link.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[#43245d]" htmlFor="poem-term-link-url">
              URL
            </label>
            <Input
              id="poem-term-link-url"
              value={ linkValue }
              onChange={ (event) => {
                setLinkValue(event.target.value);
                if (linkError) {
                  setLinkError(null);
                }
              } }
              placeholder="https://example.com"
              className="border-[#d7d0ea] bg-white text-[#43245d]"
            />
            <div className="flex items-center gap-2 pt-1">
              <Checkbox
                id="poem-term-link-target"
                checked={ openLinkInNewTab }
                onCheckedChange={ (checked) => setOpenLinkInNewTab(checked === true) }
              />
              <label className="text-sm text-[#5f466f]" htmlFor="poem-term-link-target">
                Open in new tab
              </label>
            </div>
            { linkError ? (
              <p className="text-sm text-red-500">{ linkError }</p>
            ) : null }
            <div className="rounded-xl border border-[#e5daf0] bg-white px-3 py-3 text-sm text-[#5f466f]">
              <p className="font-semibold text-[#43245d]">Preview</p>
              <p className="mt-1 break-all">
                { normalizedLinkPreview ?? "Enter a valid URL to preview the saved link." }
              </p>
              <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[#81619b]">
                { openLinkInNewTab ? "Opens In New Tab" : "Opens In Current Tab" }
              </p>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={ () => {
                if (editor?.isActive("link")) {
                  editor.chain().focus().extendMarkRange("link").unsetLink().run();
                }
                setIsLinkDialogOpen(false);
              } }
            >
              Remove Link
            </Button>
            <Button type="button" onClick={ applyLink }>
              Apply Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}