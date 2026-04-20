"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { JSONContent } from "@tiptap/core";
import LinkExtension from "@tiptap/extension-link";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import {
  ArrowLeft,
  Bold,
  Heading2,
  Italic,
  Link2,
  BookPlus,
  Save,
  Underline as UnderlineIcon,
  Unlink,
  List,
  ListOrdered,
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
import { RecipeTerm, SaveRecipeTermInput } from "@/components/db/types/recipes";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
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
import { saveRecipeTermAction } from "@/app/(features)/(foodies)/recipe-terms/actions";

const recipeTermFormSchema = z.object({
  term: z.string().trim().min(2, "Enter at least 2 characters for the term."),
  status: z.enum(["draft", "published", "archived"]),
  termJson: serializedTipTapDocumentSchema,
});

type RecipeTermFormValues = z.infer<typeof recipeTermFormSchema>;

type RecipeTermEditorPageProps = {
  recipeTerm: RecipeTerm | null;
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
  preserveSelection?: boolean;
  onMouseDownAction?: () => void;
  children: React.ReactNode;
};

function ToolbarButton({
  label,
  onClick,
  active = false,
  disabled = false,
  preserveSelection = false,
  onMouseDownAction,
  children,
}: ToolbarButtonProps) {
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onMouseDown={ preserveSelection || onMouseDownAction
        ? (event) => {
          event.preventDefault();
          onMouseDownAction?.();
        }
        : undefined }
      onClick={ onClick }
      disabled={ disabled }
      aria-label={ label }
      className={ active ? "border-[#578c24] bg-[#edfad0] text-[#2f4820]" : "border-[#ccdfb9]" }
    >
      { children }
      <span className="sr-only">{ label }</span>
    </Button>
  );
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

export function RecipeTermEditorPage({ recipeTerm }: RecipeTermEditorPageProps) {
  const router = useRouter();
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkValue, setLinkValue] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);
  const [openLinkInNewTab, setOpenLinkInNewTab] = useState(true);
  const [justSaved, setJustSaved] = useState(false);
  const initialEditorContent = getInitialEditorContent(recipeTerm?.termJson);

  const form = useForm<RecipeTermFormValues>({
    resolver: zodResolver(recipeTermFormSchema),
    defaultValues: {
      term: recipeTerm?.term ?? "",
      status: (recipeTerm?.status as "draft" | "published" | "archived" | undefined) ?? "draft",
      termJson: serializeTipTapDocument(initialEditorContent),
    },
  });

  const isEditing = Boolean(recipeTerm);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
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
          "tiptap min-h-[20rem] rounded-b-2xl border border-t-0 border-[#ccdfb9] bg-white px-4 py-4 text-[#2f4820] shadow-xs outline-none focus:outline-none",
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

  async function handleSubmit(values: RecipeTermFormValues) {
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

    const payload: SaveRecipeTermInput = {
      id: recipeTerm?.id,
      term: values.term,
      status: values.status,
      termJson: validationResult.data,
    };

    const result = await saveRecipeTermAction(payload);

    if (!result.success) {
      toast.error(result.message, {
        position: "top-center",
        duration: 2500,
      });
      return;
    }

    toast.success(result.message, {
      position: "top-center",
      duration: 2500,
    });

    if (!isEditing) {
      setJustSaved(true);
    } else {
      router.push("/recipe-terms");
      router.refresh();
    }
  }

  return (
    <section className="font-app w-full px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,rgba(49,67,29,0.95),rgba(87,124,36,0.88)_56%,rgba(199,216,126,0.82))] px-6 py-8 text-white shadow-[0_28px_80px_-40px_rgba(40,54,21,0.95)] sm:px-8 lg:px-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.34em] text-[#e9ffd0]">
                Family Foodies
              </p>
              <Link
                href="/recipe-terms"
                className="mt-3 inline-flex items-center rounded-full border border-white/35 bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#f1ffe4] transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <ArrowLeft className="mr-2 size-4" />
                Back to Recipe Terms
              </Link>
              <h1 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">
                { isEditing ? "Edit recipe term" : "Add a new recipe term" }
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#f1ffe4]">
                Compose glossary content directly in the editor. The saved value is stored as serialized TipTap JSON.
              </p>
            </div>

            <div className="rounded-[1.6rem] border border-white/20 bg-white/10 p-4 shadow-inner backdrop-blur sm:min-w-[18rem]">
              <p className="text-xs uppercase tracking-[0.24em] text-[#e9ffd0]">Mode</p>
              <p className="mt-2 text-2xl font-black">
                { isEditing ? "Edit" : "Create" }
              </p>
              <p className="mt-1 text-sm text-[#f1ffe4]">
                { isEditing ? recipeTerm?.term : "New glossary entry" }
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[1.9rem] border border-white/70 bg-white/88 shadow-[0_24px_70px_-40px_rgba(38,54,26,0.75)] backdrop-blur">
          <div className="border-b border-[#dbeacc] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(245,251,235,0.88))] px-5 py-5 sm:px-6">
            <h2 className="text-2xl font-black tracking-tight text-[#2f4820]">
              Term Details
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#647a50]">
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
                        <FormLabel className="font-bold text-[#2f4820]">Term</FormLabel>
                        <FormControl>
                          <Input
                            { ...field }
                            className="border-[#ccdfb9] bg-white text-[#2f4820]"
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
                        <FormLabel className="font-bold text-[#2f4820]">Status</FormLabel>
                        <Select onValueChange={ field.onChange } value={ field.value }>
                          <FormControl>
                            <SelectTrigger className="border-[#ccdfb9] bg-white text-[#2f4820]">
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
                      <FormLabel className="font-bold text-[#2f4820]">Term Content</FormLabel>
                      <FormControl>
                        <input { ...field } type="hidden" />
                      </FormControl>
                      <div className="overflow-hidden rounded-2xl border border-[#ccdfb9] bg-[#f7fce8] [&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-5 [&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:pl-5 [&_.tiptap_li]:my-1">
                        <div className="flex flex-wrap gap-2 border-b border-[#ccdfb9] px-3 py-3">
                          <ToolbarButton
                            label="Heading 2"
                            onClick={ () => editor?.chain().focus().toggleHeading({ level: 2 }).run() }
                            active={ editor?.isActive("heading", { level: 2 }) }
                            disabled={ !editor?.can().chain().focus().toggleHeading({ level: 2 }).run() }
                          >
                            <Heading2 />
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
                            label="Underline"
                            onClick={ () => editor?.chain().focus().toggleUnderline().run() }
                            active={ editor?.isActive("underline") }
                            disabled={ !editor?.can().chain().focus().toggleUnderline().run() }
                          >
                            <UnderlineIcon />
                          </ToolbarButton>
                          <ToolbarButton
                            label="Bullet list"
                            onClick={ () => editor?.chain().focus().toggleBulletList().run() }
                            active={ editor?.isActive("bulletList") }
                            disabled={ !editor?.can().chain().focus().toggleBulletList().run() }
                            preserveSelection
                          >
                            <List />
                          </ToolbarButton>
                          <ToolbarButton
                            label="Ordered list"
                            onClick={ () => editor?.chain().focus().toggleOrderedList().run() }
                            active={ editor?.isActive("orderedList") }
                            disabled={ !editor?.can().chain().focus().toggleOrderedList().run() }
                            preserveSelection
                          >
                            <ListOrdered />
                          </ToolbarButton>
                          <ToolbarButton
                            label="Set link"
                            onClick={ openLinkDialog }
                            active={ editor?.isActive("link") }
                            disabled={ !editor }
                            preserveSelection
                            onMouseDownAction={ openLinkDialog }
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
                        </div>
                        <EditorContent editor={ editor } />
                      </div>
                      <FormMessage />
                    </FormItem>
                  ) }
                />

                <div className="flex flex-wrap justify-end gap-3 border-t border-[#dbeacc] pt-5">
                  <Button type="button" variant="outline" asChild>
                    <Link href="/recipe-terms">{ justSaved ? "Back to Recipe Terms" : "Cancel" }</Link>
                  </Button>
                  { justSaved ? (
                    <Button type="button" onClick={ handleAddAnother } variant="outline">
                      <BookPlus className="mr-2 size-4" />
                      Add Another Term
                    </Button>
                  ) : null }
                  <Button
                    type="submit"
                    disabled={ form.formState.isSubmitting }
                    className="bg-[#578c24] text-white hover:bg-[#4a7320]"
                  >
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
        <DialogContent className="border-[#ccdfb9] bg-[#f7fce8] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#2f4820]">Edit Link</DialogTitle>
            <DialogDescription className="text-[#647a50]">
              Add or replace the URL for the selected text. Leave it blank to remove the link.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[#2f4820]" htmlFor="recipe-term-link-url">
              URL
            </label>
            <Input
              id="recipe-term-link-url"
              value={ linkValue }
              onChange={ (event) => {
                setLinkValue(event.target.value);
                if (linkError) {
                  setLinkError(null);
                }
              } }
              placeholder="https://example.com"
              className="border-[#ccdfb9] bg-white text-[#2f4820]"
            />
            <div className="flex items-center gap-2 pt-1">
              <Checkbox
                id="recipe-term-link-target"
                checked={ openLinkInNewTab }
                onCheckedChange={ (checked) => setOpenLinkInNewTab(checked === true) }
              />
              <label className="text-sm text-[#4e6640]" htmlFor="recipe-term-link-target">
                Open in new tab
              </label>
            </div>
            { linkError ? (
              <p className="text-sm text-red-500">{ linkError }</p>
            ) : null }
            <div className="rounded-xl border border-[#dbeacc] bg-white px-3 py-3 text-sm text-[#4e6640]">
              <p className="font-semibold text-[#2f4820]">Preview</p>
              <p className="mt-1 break-all">
                { normalizedLinkPreview ?? "Enter a valid URL to preview the saved link." }
              </p>
              <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[#578c24]">
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
            <Button
              type="button"
              onClick={ applyLink }
              className="bg-[#578c24] text-white hover:bg-[#4a7320]"
            >
              Apply Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
