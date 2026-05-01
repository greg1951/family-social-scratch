"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import LinkExtension from "@tiptap/extension-link";
import Link from "next/link";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, type Editor, useEditor } from "@tiptap/react";
import { ArrowLeft, Bold, Italic, Link2, List, ListOrdered, Paperclip, Underline as UnderlineIcon } from "lucide-react";
import { startTransition, useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { createSupportIssueAction } from "@/app/(support)/(logged-in)/open-issue/actions";
import { createEmptyTipTapDocument, serializeTipTapDocument } from "@/components/db/types/poem-term-validation";
import {
  createSupportIssueSchema,
  SUPPORT_ISSUE_CATEGORIES,
  SUPPORT_ISSUE_PRIORITIES,
  type CreateSupportIssueFormInput,
  type CreateSupportIssueInput,
  type SupportAttachmentDraftInput,
} from "@/components/db/types/support";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type OpenIssueFormProps = {
  memberName: string;
  familyName: string;
};

type OpenIssueFormValues = CreateSupportIssueFormInput;

type ToolbarButtonProps = {
  label: string;
  active?: boolean;
  disabled?: boolean;
  preserveSelection?: boolean;
  onClick: () => void;
  children: React.ReactNode;
};

const defaultDescriptionJson = serializeTipTapDocument(createEmptyTipTapDocument());

const fieldLabels: Record<keyof OpenIssueFormValues, string> = {
  title: "Title",
  descriptionJson: "Description",
  category: "Category",
  priority: "Priority",
  attachment: "Attachment",
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
      onMouseDown={ preserveSelection
        ? (event) => {
          event.preventDefault();
        }
        : undefined }
      onClick={ onClick }
      aria-label={ label }
      className={ active ? "border-[#2b6a87] bg-[#ebf6fb] text-[#0d4056]" : "border-[#c7d7df]" }
    >
      { children }
      <span className="sr-only">{ label }</span>
    </Button>
  );
}

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

function getMissingRequiredFields(values: OpenIssueFormValues) {
  return Object.entries(values)
    .filter(([fieldName]) => fieldName !== "attachment")
    .filter(([fieldName]) => {
      const key = fieldName as keyof OpenIssueFormValues;

      if (key === "descriptionJson") {
        return createSupportIssueSchema.shape.descriptionJson.safeParse(values.descriptionJson).success === false;
      }

      return createSupportIssueSchema.shape[key].safeParse(values[key]).success === false;
    })
    .map(([fieldName]) => fieldLabels[fieldName as keyof OpenIssueFormValues]);
}

function setAttachment(
  formAttachment: SupportAttachmentDraftInput | null,
  setValue: (value: SupportAttachmentDraftInput | null) => void,
) {
  setValue(formAttachment);
}

export function OpenIssueForm({ memberName, familyName }: OpenIssueFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [missingRequiredFields, setMissingRequiredFields] = useState<string[]>([]);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkValue, setLinkValue] = useState("https://");
  const [linkError, setLinkError] = useState<string | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);

  const form = useForm<OpenIssueFormValues, undefined, CreateSupportIssueInput>({
    resolver: zodResolver(createSupportIssueSchema),
    defaultValues: {
      title: "",
      category: "General Inquiry",
      priority: "Low",
      descriptionJson: defaultDescriptionJson,
      attachment: null,
    },
  });

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
        class: "tiptap min-h-[14rem] rounded-b-2xl border border-t-0 border-[#c7d7df] bg-white px-4 py-4 text-[#173848] shadow-xs outline-none focus:outline-none",
      },
    },
    onUpdate({ editor: currentEditor }) {
      form.setValue("descriptionJson", serializeTipTapDocument(currentEditor.getJSON()), {
        shouldDirty: true,
        shouldValidate: true,
      });
      if (formError) {
        setFormError(null);
      }
      if (successMessage) {
        setSuccessMessage(null);
      }
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    form.setValue("descriptionJson", serializeTipTapDocument(editor.getJSON()), {
      shouldDirty: false,
      shouldValidate: false,
    });
  }, [editor, form]);

  function resetFormState() {
    form.reset({
      title: "",
      category: "General Inquiry",
      priority: "Low",
      descriptionJson: defaultDescriptionJson,
      attachment: null,
    });
    setMissingRequiredFields([]);
    setFormError(null);

    if (editor) {
      editor.commands.setContent(createEmptyTipTapDocument());
    }

    setFileInputKey((currentValue) => currentValue + 1);
  }

  function openLinkDialog(currentEditor: Editor) {
    const linkAttributes = currentEditor.getAttributes("link") as { href?: string };
    setLinkValue(linkAttributes.href ?? "https://");
    setLinkError(null);
    setIsLinkDialogOpen(true);
  }

  function applyLink() {
    if (!editor) {
      return;
    }

    const trimmedValue = linkValue.trim();

    if (!trimmedValue) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      setIsLinkDialogOpen(false);
      setLinkError(null);
      return;
    }

    const normalizedUrl = normalizeLinkUrl(trimmedValue);

    if (!normalizedUrl) {
      setLinkError("Enter a valid URL, email address, or telephone link.");
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: normalizedUrl }).run();
    setLinkError(null);
    setIsLinkDialogOpen(false);
  }

  const attachment = useWatch({
    control: form.control,
    name: "attachment",
  });

  async function onSubmit(values: OpenIssueFormValues) {
    const missingFields = getMissingRequiredFields(values);
    setMissingRequiredFields(missingFields);
    setFormError(null);
    setSuccessMessage(null);

    if (missingFields.length > 0) {
      const missingMessage = `Please complete the required fields: ${ missingFields.join(", ") }.`;
      setFormError(missingMessage);
      toast.error(missingMessage);
      return;
    }

    const parsedSubmission = createSupportIssueSchema.safeParse(values);

    if (!parsedSubmission.success) {
      const submissionMessage = parsedSubmission.error.issues[0]?.message ?? "Unable to submit the support issue.";
      setFormError(submissionMessage);
      toast.error(submissionMessage);
      return;
    }

    setIsSubmitting(true);

    startTransition(async () => {
      const result = await createSupportIssueAction(parsedSubmission.data);

      setIsSubmitting(false);

      if (!result.success) {
        setFormError(result.message);
        toast.error(result.message);
        return;
      }

      resetFormState();
      setSuccessMessage(result.message);
      toast.success(result.message);
    });
  }

  return (
    <>
      <section className="font-app w-full px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,rgba(10,64,79,0.95),rgba(24,115,143,0.9)_50%,rgba(249,197,121,0.85))] px-6 py-8 text-white shadow-[0_28px_80px_-40px_rgba(6,34,52,0.9)] sm:px-8">
            <p className="text-[0.72rem] font-bold uppercase tracking-[0.34em] text-[#def8ff]">
              Family Social Support
            </p>
            <h1 className="pt-2 mt-3 text-2xl font-black tracking-tight sm:text-3xl">
              Open Support Ticket
            </h1>
            <p className="pt-2 mt-3 max-w-2xl text-sm leading-6 text-[#eafcff]">
              After submitting your ticket, you will receive updates in your <b>Family Threads</b>. When you sign in, you will see a notification when support responds to your ticket.
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
        </div>
        <div className="font-app rounded-[2rem] border border-[#c8d8df] bg-white/95 p-6 shadow-[0_20px_80px_rgba(19,55,71,0.10)] sm:p-8">
          <div className="flex flex-col gap-2 border-b border-[#dbe6eb] pb-5">
            <p className="pt-2 text-xs uppercase tracking-[0.18em] text-[#6a8895]">Signed in as { memberName }</p>
          </div>

          <Form { ...form }>
            <form className="mt-6 space-y-6" onSubmit={ form.handleSubmit(onSubmit) }>
              { (formError || successMessage || missingRequiredFields.length > 0) && (
                <div className={ `rounded-2xl border px-4 py-3 text-sm ${ successMessage ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800" }` }>
                  { successMessage ?? formError }
                </div>
              ) }

              <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
                <div className="space-y-6">
                  <FormField
                    control={ form.control }
                    name="title"
                    render={ ({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-[#173848]">Title</FormLabel>
                        <FormControl>
                          <Input
                            { ...field }
                            placeholder="Briefly summarize the issue"
                            className="h-12 rounded-2xl border-[#c7d7df] bg-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    ) }
                  />

                  <FormField
                    control={ form.control }
                    name="descriptionJson"
                    render={ () => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-[#173848]">Description</FormLabel>
                        <FormControl>
                          <div className="overflow-hidden rounded-[1.4rem] border border-[#c7d7df] bg-[#f4fafc] shadow-xs [&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-5 [&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:pl-5 [&_.tiptap_li]:my-1">
                            <div className="flex flex-wrap gap-2 border-b border-[#dbe6eb] px-3 py-3">
                              <ToolbarButton
                                label="Bold"
                                active={ editor?.isActive("bold") }
                                disabled={ !editor }
                                onClick={ () => editor?.chain().focus().toggleBold().run() }
                              >
                                <Bold className="h-4 w-4" />
                              </ToolbarButton>
                              <ToolbarButton
                                label="Italic"
                                active={ editor?.isActive("italic") }
                                disabled={ !editor }
                                onClick={ () => editor?.chain().focus().toggleItalic().run() }
                              >
                                <Italic className="h-4 w-4" />
                              </ToolbarButton>
                              <ToolbarButton
                                label="Underline"
                                active={ editor?.isActive("underline") }
                                disabled={ !editor }
                                onClick={ () => editor?.chain().focus().toggleUnderline().run() }
                              >
                                <UnderlineIcon className="h-4 w-4" />
                              </ToolbarButton>
                              <ToolbarButton
                                label="Bulleted List"
                                active={ editor?.isActive("bulletList") }
                                disabled={ !editor }
                                onClick={ () => editor?.chain().focus().toggleBulletList().run() }
                              >
                                <List className="h-4 w-4" />
                              </ToolbarButton>
                              <ToolbarButton
                                label="Numbered List"
                                active={ editor?.isActive("orderedList") }
                                disabled={ !editor }
                                onClick={ () => editor?.chain().focus().toggleOrderedList().run() }
                              >
                                <ListOrdered className="h-4 w-4" />
                              </ToolbarButton>
                              <ToolbarButton
                                label="Link"
                                active={ editor?.isActive("link") }
                                disabled={ !editor }
                                preserveSelection
                                onClick={ () => editor && openLinkDialog(editor) }
                              >
                                <Link2 className="h-4 w-4" />
                              </ToolbarButton>
                            </div>
                            <EditorContent editor={ editor } />
                          </div>
                        </FormControl>
                        <p className="text-xs text-[#5b7685]">Use the toolbar to add emphasis, lists, or a link to supporting details.</p>
                        <FormMessage />
                      </FormItem>
                    ) }
                  />
                </div>

                <div className="space-y-6 rounded-[1.6rem] border border-[#dce7ec] bg-[#f8fbfc] p-5">
                  <FormField
                    control={ form.control }
                    name="category"
                    render={ ({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-[#173848]">Category</FormLabel>
                        <Select value={ field.value } onValueChange={ field.onChange }>
                          <FormControl>
                            <SelectTrigger className="h-12 rounded-2xl border-[#c7d7df] bg-white">
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            { SUPPORT_ISSUE_CATEGORIES.map((category) => (
                              <SelectItem key={ category } value={ category }>
                                { category }
                              </SelectItem>
                            )) }
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    ) }
                  />

                  <FormField
                    control={ form.control }
                    name="priority"
                    render={ ({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-[#173848]">Priority</FormLabel>
                        <Select value={ field.value } onValueChange={ field.onChange }>
                          <FormControl>
                            <SelectTrigger className="h-12 rounded-2xl border-[#c7d7df] bg-white">
                              <SelectValue placeholder="Select a priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            { SUPPORT_ISSUE_PRIORITIES.map((priority) => (
                              <SelectItem key={ priority } value={ priority }>
                                { priority }
                              </SelectItem>
                            )) }
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    ) }
                  />

                  <FormField
                    control={ form.control }
                    name="attachment"
                    render={ ({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-[#173848]">Attachment</FormLabel>
                        <FormControl>
                          <div className="rounded-2xl border border-dashed border-[#b8ccd6] bg-white p-4">
                            <div className="flex items-center gap-2 text-sm font-medium text-[#173848]">
                              <Paperclip className="h-4 w-4" />
                              Optional file upload
                            </div>
                            <input
                              key={ fileInputKey }
                              type="file"
                              className="mt-3 block w-full text-sm text-[#355564] file:mr-4 file:rounded-full file:border-0 file:bg-[#dceef7] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#0d4056]"
                              accept="image/*,.pdf,.txt,.doc,.docx,.xls,.xlsx"
                              onChange={ (event) => {
                                const file = event.target.files?.[0];

                                if (!file) {
                                  setAttachment(null, field.onChange);
                                  return;
                                }

                                setAttachment({
                                  name: file.name,
                                  size: file.size,
                                  type: file.type || "application/octet-stream",
                                  lastModified: file.lastModified,
                                }, field.onChange);
                                setSuccessMessage(null);
                              } }
                            />
                            <p className="mt-2 text-xs leading-5 text-[#5b7685]">
                              Attach a file (like a screenshot or document) that helps illustrate the issue. Supported formats: images, PDFs, text files, and common office documents.
                            </p>
                            { attachment && (
                              <div className="mt-3 rounded-xl bg-[#f4fafc] px-3 py-2 text-xs text-[#355564]">
                                { attachment.name } ({ Math.max(1, Math.round(attachment.size / 1024)) } KB)
                              </div>
                            ) }
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    ) }
                  />

                  <Button
                    type="submit"
                    disabled={ isSubmitting }
                    className="h-12 w-full rounded-2xl bg-[#0f5d75] text-white hover:bg-[#0a4f64]"
                  >
                    { isSubmitting ? "Submitting issue..." : "Submit Issue" }
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </div>
      </section>



      <Dialog open={ isLinkDialogOpen } onOpenChange={ setIsLinkDialogOpen }>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert link</DialogTitle>
            <DialogDescription>
              Paste a URL, email address, or phone link. Clear the field to remove the current link.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Input value={ linkValue } onChange={ (event) => setLinkValue(event.target.value) } placeholder="https://example.com" />
            { linkError && <p className="text-sm text-rose-700">{ linkError }</p> }
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={ () => setIsLinkDialogOpen(false) }>
              Cancel
            </Button>
            <Button type="button" onClick={ applyLink }>
              Apply Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}