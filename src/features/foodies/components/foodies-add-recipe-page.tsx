"use client";

import type { JSONContent } from "@tiptap/core";
import LinkExtension from "@tiptap/extension-link";
import { Table, TableCell, TableHeader, TableRow } from "@tiptap/extension-table";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor } from "@tiptap/react";
import {
  ArrowLeft,
  Bold,
  Columns2,
  Combine,
  Clock3,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Rows2,
  Save,
  Soup,
  Sparkles,
  Table2,
  Underline as UnderlineIcon,
  Unlink,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { saveFoodiesRecipeAction } from "@/app/(features)/(foodies)/foodies/actions";
import { FoodiesRecipe, RecipeTagOption, RecipeTagType, RecipeTemplateOption } from "@/components/db/types/recipes";
import {
  createEmptyTipTapDocument,
  parseSerializedTipTapDocument,
  serializeTipTapDocument,
} from "@/components/db/types/poem-term-validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { extractS3KeyFromValue } from "@/lib/s3-object-key";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MemberKeyDetails } from "@/features/family/types/family-steps";

const TAG_TYPE_LABELS: Array<{ type: RecipeTagType; label: string }> = [
  { type: "cuisine", label: "Cuisine" },
  { type: "course_type", label: "Course Type" },
  { type: "cooking_method", label: "Cooking Method" },
  { type: "dietary", label: "Dietary" },
  { type: "meal_time", label: "Meal Time" },
];

const MAX_IMAGE_SIZE_BYTES = 4 * 1024 * 1024;
const TEMPLATE_NONE_VALUE = "none";

type ToolbarButtonProps = {
  label: string;
  active?: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
};

function ToolbarButton({ label, active = false, onClick, disabled = false, children }: ToolbarButtonProps) {
  return (
    <Button
      type="button"
      size="icon-sm"
      variant="outline"
      onClick={ onClick }
      disabled={ disabled }
      aria-label={ label }
      className={ [
        "h-8 w-8 p-0",
        active ? "border-[#3d7a27] bg-[#ecf8e5] text-[#2c5c1a]" : "border-[#cadfbb]",
      ].join(" ") }
    >
      <span className="inline-flex items-center justify-center gap-0.5">{ children }</span>
      <span className="sr-only">{ label }</span>
    </Button>
  );
}

function slugifyTitle(value: string) {
  const compressed = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return compressed || "recipe";
}

function getTemplateDocument(template?: RecipeTemplateOption): JSONContent {
  if (!template?.templateJson) {
    return createEmptyTipTapDocument();
  }

  const parsed = parseSerializedTipTapDocument(template.templateJson);

  if (parsed.success) {
    return parsed.content;
  }

  return createEmptyTipTapDocument();
}

export function FoodiesAddRecipePage({
  recipeTags,
  recipeTemplates,
  member,
  initialRecipe,
  mode = "add",
}: {
  recipeTags: RecipeTagOption[];
  recipeTemplates: RecipeTemplateOption[];
  member: MemberKeyDetails;
  initialRecipe?: FoodiesRecipe | null;
  mode?: "add" | "edit";
}) {
  const router = useRouter();
  const [isSaving, startSaveTransition] = useTransition();
  const initialTemplateId = useMemo(() => {
    if (initialRecipe?.templateId) {
      const found = recipeTemplates.find((template) => template.id === initialRecipe.templateId);

      if (found) {
        return String(found.id);
      }
    }

    return TEMPLATE_NONE_VALUE;
  }, [initialRecipe, recipeTemplates]);
  const [recipeTitle, setRecipeTitle] = useState(initialRecipe?.recipeTitle ?? "");
  const [recipeShortSummary, setRecipeShortSummary] = useState(initialRecipe?.recipeShortSummary ?? "");
  const [prepTimeMins, setPrepTimeMins] = useState(String(initialRecipe?.prepTimeMins ?? 15));
  const [cookTimeMins, setCookTimeMins] = useState(String(initialRecipe?.cookTimeMins ?? 20));
  const [status, setStatus] = useState(initialRecipe?.status ?? "draft");
  const [selectedTagsByType, setSelectedTagsByType] = useState<Partial<Record<RecipeTagType, string>>>(() => {
    if (!initialRecipe) {
      return {};
    }

    const initialState: Partial<Record<RecipeTagType, string>> = {};

    for (const tag of recipeTags) {
      if (initialRecipe.selectedTagIds.includes(tag.id)) {
        initialState[tag.tagType] = String(tag.id);
      }
    }

    return initialState;
  });
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(initialTemplateId);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [recipeImageUrl, setRecipeImageUrl] = useState<string | null>(initialRecipe?.recipeImageUrl ?? null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(initialRecipe?.recipeImageUrl ?? null);
  const isEditing = mode === "edit";
  const canSelectTemplate = !isEditing;
  const isTemplateDebug = process.env.NODE_ENV !== "production";

  const selectedTemplate = useMemo(
    () => selectedTemplateId === TEMPLATE_NONE_VALUE
      ? undefined
      : recipeTemplates.find((template) => String(template.id) === selectedTemplateId),
    [recipeTemplates, selectedTemplateId]
  );

  useEffect(() => {
    if (!isTemplateDebug) {
      return;
    }

    console.log(
      "[FoodiesAddRecipe] templates prop",
      recipeTemplates.map((template) => ({
        id: template.id,
        label: template.label,
        isGlobalTemplate: template.isGlobalTemplate,
        status: template.status,
        hasTemplateJson: Boolean(template.templateJson && template.templateJson.trim().length > 0),
        templateJsonLength: template.templateJson?.length ?? 0,
      }))
    );
  }, [isTemplateDebug, recipeTemplates]);

  useEffect(() => {
    if (!isTemplateDebug) {
      return;
    }

    console.log("[FoodiesAddRecipe] selectedTemplateId", selectedTemplateId);
    console.log(
      "[FoodiesAddRecipe] selectedTemplate",
      selectedTemplate
        ? {
          id: selectedTemplate.id,
          label: selectedTemplate.label,
          isGlobalTemplate: selectedTemplate.isGlobalTemplate,
          status: selectedTemplate.status,
          hasTemplateJson: Boolean(selectedTemplate.templateJson && selectedTemplate.templateJson.trim().length > 0),
          templateJsonLength: selectedTemplate.templateJson?.length ?? 0,
        }
        : null
    );
  }, [isTemplateDebug, selectedTemplate, selectedTemplateId]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      LinkExtension.configure({
        autolink: true,
        defaultProtocol: "https",
        openOnClick: false,
      }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: getTemplateDocument(selectedTemplate),
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    editorProps: {
      attributes: {
        class:
          "tiptap min-h-[18rem] rounded-2xl border border-[#cadfbb] bg-white px-4 py-4 text-[#2f4820] shadow-xs outline-none focus:outline-none",
      },
    },
  });

  useEffect(() => {
    if (!recipeTemplates.length || !isEditing) {
      return;
    }

    const hasSelectedTemplate = recipeTemplates.some((template) => String(template.id) === selectedTemplateId);
    if (hasSelectedTemplate) {
      return;
    }

    const globalTemplate = recipeTemplates.find((template) => template.isGlobalTemplate);
    setSelectedTemplateId(String(globalTemplate?.id ?? recipeTemplates[0].id));
  }, [isEditing, recipeTemplates, selectedTemplateId]);

  useEffect(() => {
    if (!editor || isEditing) {
      return;
    }

    if (isTemplateDebug) {
      console.log("[FoodiesAddRecipe] setContent trigger", {
        selectedTemplateId,
        isEditing,
        loadingEmptyDoc: !selectedTemplate,
      });
    }

    // In add mode, always load whichever template was selected last.
    editor.commands.setContent(selectedTemplate ? getTemplateDocument(selectedTemplate) : createEmptyTipTapDocument());
  }, [editor, isEditing, isTemplateDebug, selectedTemplate, selectedTemplateId]);

  useEffect(() => {
    if (!editor || !initialRecipe || !isEditing) {
      return;
    }

    const currentJson = serializeTipTapDocument(editor.getJSON());
    if (currentJson !== initialRecipe.recipeJson) {
      const parsedRecipeJson = parseSerializedTipTapDocument(initialRecipe.recipeJson);

      if (parsedRecipeJson.success) {
        editor.commands.setContent(parsedRecipeJson.content);
      }
    }
  }, [editor, initialRecipe, isEditing]);

  useEffect(() => {
    if (!selectedFile) {
      setImagePreviewUrl(recipeImageUrl ?? null);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setImagePreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [recipeImageUrl, selectedFile]);

  useEffect(() => {
    let isCancelled = false;

    const resolveSignedPreview = async () => {
      if (selectedFile || !recipeImageUrl) {
        return;
      }

      const key = extractS3KeyFromValue(recipeImageUrl);
      if (!key || !key.startsWith("foodies/")) {
        if (!isCancelled) {
          setImagePreviewUrl(recipeImageUrl);
        }
        return;
      }

      try {
        const response = await fetch("/api/s3-upload", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "download",
            fileName: key,
          }),
        });

        if (!response.ok) {
          if (!isCancelled) {
            setImagePreviewUrl(recipeImageUrl);
          }
          return;
        }

        const body = await response.json();
        if (!isCancelled) {
          setImagePreviewUrl(body.url ?? recipeImageUrl);
        }
      } catch {
        if (!isCancelled) {
          setImagePreviewUrl(recipeImageUrl);
        }
      }
    };

    resolveSignedPreview();

    return () => {
      isCancelled = true;
    };
  }, [recipeImageUrl, selectedFile]);

  function setSelectedTagForType(tagType: RecipeTagType, tagId: string) {
    setSelectedTagsByType((currentState) => ({
      ...currentState,
      [tagType]: tagId,
    }));
  }

  async function uploadRecipeImage() {
    if (!selectedFile) {
      return recipeImageUrl;
    }

    if (!recipeTitle.trim()) {
      toast.error("Enter a recipe title first so the image name can be generated.");
      return null;
    }

    try {
      setUploadingImage(true);

      const extension = selectedFile.type === "image/png" ? "png" : "jpg";
      const fileName = `memberId-${ member.memberId }-${ slugifyTitle(recipeTitle) }.${ extension }`;

      const signResponse = await fetch("/api/s3-upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "upload",
          folder: "foodies",
          fileName,
          contentType: selectedFile.type,
        }),
      });

      if (!signResponse.ok) {
        throw new Error("Could not create a signed upload URL.");
      }

      const body = await signResponse.json();
      const uploadResponse = await fetch(body.url, {
        method: "PUT",
        headers: {
          "Content-Type": body.signedContentType ?? selectedFile.type,
        },
        body: selectedFile,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload image to S3.");
      }

      const nextImageUrl = body.fileUrl ?? null;
      setRecipeImageUrl(nextImageUrl);
      setSelectedFile(null);
      toast.success("Recipe image uploaded successfully.");
      return nextImageUrl;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Recipe image upload failed.");
      return null;
    } finally {
      setUploadingImage(false);
    }
  }

  function handleFileSelection(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!["image/png", "image/jpeg", "image/jpg"].includes(file.type)) {
      toast.error("Only PNG and JPEG image files are supported.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      toast.error("Image size must be under 4MB.");
      event.target.value = "";
      return;
    }

    setSelectedFile(file);
  }

  function handleSubmit() {
    startSaveTransition(async () => {
      if (!editor) {
        toast.error("Editor is still loading. Try again in a moment.");
        return;
      }

      if (!selectedTemplate) {
        toast.error("Select a recipe template before saving.");
        return;
      }

      const selectedTagIds = Object.values(selectedTagsByType)
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value > 0);

      const uploadedRecipeImageUrl = selectedFile
        ? await uploadRecipeImage()
        : recipeImageUrl;

      if (selectedFile && !uploadedRecipeImageUrl) {
        return;
      }

      const result = await saveFoodiesRecipeAction({
        id: initialRecipe?.id,
        recipeTitle,
        recipeShortSummary,
        prepTimeMins: Number(prepTimeMins || 0),
        cookTimeMins: Number(cookTimeMins || 0),
        status,
        recipeImageUrl: uploadedRecipeImageUrl,
        recipeJson: serializeTipTapDocument(editor.getJSON()),
        templateId: selectedTemplate.id,
        selectedTagIds,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.push("/foodies");
      router.refresh();
    });
  }

  return (
    <section className="w-full px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,rgba(49,67,29,0.95),rgba(87,124,36,0.88)_56%,rgba(199,216,126,0.82))] px-6 py-8 text-white shadow-[0_28px_80px_-40px_rgba(40,54,21,0.95)] sm:px-8 lg:px-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.34em] text-[#e9ffd0]">
                Family Foodies
              </p>
              <Link
                href="/foodies"
                className="mt-3 inline-flex items-center rounded-full border border-white/35 bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#f1ffe4] transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <ArrowLeft className="mr-2 size-4" />
                Back to Foodies Home
              </Link>
              <h1 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">
                { isEditing ? "Edit Family Recipe" : "Add a Family Recipe" }
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#f1ffe4]">
                { isEditing
                  ? "Update your recipe, change the image if needed, and save the revised TipTap content."
                  : "Start with a recipe template, upload your image to S3, and save your instructions as TipTap JSON." }
              </p>
            </div>

            <div className="rounded-[1.6rem] border border-white/20 bg-white/10 p-4 shadow-inner backdrop-blur sm:min-w-[18rem]">
              <p className="text-xs uppercase tracking-[0.24em] text-[#e9ffd0]">Signed In</p>
              <p className="mt-2 text-2xl font-black">{ member.firstName } { member.lastName }</p>
              <p className="mt-1 text-sm text-[#f1ffe4]">Member #{ member.memberId }</p>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[1.9rem] border border-white/70 bg-white/88 shadow-[0_24px_70px_-40px_rgba(38,54,26,0.75)] backdrop-blur">
          <div className="border-b border-[#dbeacc] bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(245,251,235,0.88))] px-5 py-5 sm:px-6">
            <h2 className="text-2xl font-black tracking-tight text-[#2f4820]">Recipe Details</h2>
            <p className="mt-2 text-sm leading-6 text-[#647a50]">
              Choose from published templates available to your account, then fill in recipe details and instructions.
            </p>
          </div>

          <div className="space-y-6 px-5 py-6 sm:px-6">
            <fieldset className="grid gap-5 md:grid-cols-3" disabled={ isSaving }>
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#2f4820]" htmlFor="recipeTitle">Recipe title</label>
                <Input
                  id="recipeTitle"
                  value={ recipeTitle }
                  onChange={ (event) => setRecipeTitle(event.target.value) }
                  placeholder="Enter recipe title"
                  className="border-[#cadfbb]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-[#2f4820]" htmlFor="template">Template</label>
                <Select
                  value={ selectedTemplateId }
                  onValueChange={ (value) => {
                    if (isTemplateDebug) {
                      console.log("[FoodiesAddRecipe] onValueChange template", value);
                    }
                    setSelectedTemplateId(value);
                  } }
                  disabled={ !canSelectTemplate }
                >
                  <SelectTrigger id="template" className="border-[#cadfbb]" disabled={ !canSelectTemplate }>
                    <SelectValue placeholder="Select recipe template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ TEMPLATE_NONE_VALUE }>Select Template</SelectItem>
                    { recipeTemplates.map((template) => (
                      <SelectItem key={ template.id } value={ String(template.id) }>
                        { template.label }
                      </SelectItem>
                    )) }
                  </SelectContent>
                </Select>
                { !canSelectTemplate ? (
                  <p className="text-xs text-[#647a50]">
                    Template selection is locked after a recipe is saved to protect existing instructions.
                  </p>
                ) : null }
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-[#2f4820]" htmlFor="recipeSummary">Short summary</label>
                <Input
                  id="recipeSummary"
                  value={ recipeShortSummary }
                  onChange={ (event) => setRecipeShortSummary(event.target.value) }
                  maxLength={ 120 }
                  className="border-[#cadfbb]"
                  placeholder="Give your family a quick summary of this dish"
                />
                <p className="text-xs text-[#607a4e]">{ recipeShortSummary.length } / 120 characters</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-[#2f4820]" htmlFor="prepMins">Prep minutes</label>
                <Input
                  id="prepMins"
                  type="number"
                  min={ 0 }
                  value={ prepTimeMins }
                  onChange={ (event) => setPrepTimeMins(event.target.value) }
                  className="border-[#cadfbb]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-[#2f4820]" htmlFor="cookMins">Cook minutes</label>
                <Input
                  id="cookMins"
                  type="number"
                  min={ 0 }
                  value={ cookTimeMins }
                  onChange={ (event) => setCookTimeMins(event.target.value) }
                  className="border-[#cadfbb]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-[#2f4820]" htmlFor="status">Status</label>
                <Select value={ status } onValueChange={ setStatus }>
                  <SelectTrigger id="status" className="border-[#cadfbb]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-[#2f4820]" htmlFor="recipeImage">Recipe image</label>
                <input
                  id="recipeImage"
                  type="file"
                  accept="image/png, image/jpeg"
                  className="block w-full rounded-md border border-[#cadfbb] bg-white p-2 text-sm"
                  onChange={ handleFileSelection }
                  disabled={ uploadingImage }
                />
                { imagePreviewUrl ? (
                  <div className="overflow-hidden rounded-2xl border border-[#dbeacc] bg-[#f7fce8] p-2">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#607a4e]">
                      Image Preview
                    </p>
                    {/* eslint-disable-next-line @next/next/no-img-element */ }
                    <img
                      src={ imagePreviewUrl }
                      alt={ recipeTitle.trim() ? `${ recipeTitle } preview` : "Recipe preview" }
                      className="h-44 w-full rounded-xl object-cover"
                    />
                  </div>
                ) : null }
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-[#b6d39d]"
                    onClick={ uploadRecipeImage }
                    disabled={ !selectedFile || uploadingImage || isSaving }
                  >
                    <Upload className="mr-2 size-4" />
                    { uploadingImage ? "Uploading..." : isEditing ? "Upload Replacement Image" : "Upload Image" }
                  </Button>
                  { recipeImageUrl ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#eff8e6] px-3 py-1 text-xs font-semibold text-[#386124]">
                      <Sparkles className="size-3.5" /> Uploaded
                    </span>
                  ) : null }
                </div>
              </div>
            </fieldset>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-bold text-[#2f4820]">Recipe categories</p>
                <p className="mt-1 text-xs text-[#607a4e]">Tags are listed in tag type and sequence order.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-5">
                { TAG_TYPE_LABELS.map((entry) => {
                  const options = recipeTags
                    .filter((tag) => tag.tagType === entry.type)
                    .sort((leftTag, rightTag) => {
                      if (leftTag.seqNo !== rightTag.seqNo) {
                        return leftTag.seqNo - rightTag.seqNo;
                      }

                      return leftTag.tagName.localeCompare(rightTag.tagName);
                    });

                  return (
                    <div key={ entry.type } className="rounded-xl border border-[#dbeacc] bg-[#fbfff3] px-4 py-3">
                      <p className="text-sm font-bold text-[#2f4820]">{ entry.label }</p>
                      <div className="mt-2">
                        { options.length === 0 ? (
                          <p className="text-xs text-[#647a50]">No tags available.</p>
                        ) : (
                          <Select
                            value={ selectedTagsByType[entry.type] ?? "none" }
                            onValueChange={ (value) => setSelectedTagForType(entry.type, value) }
                          >
                            <SelectTrigger className="border-[#cadfbb] bg-white">
                              <SelectValue placeholder={ `Select ${ entry.label.toLowerCase() }` } />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              { options.map((tag) => (
                                <SelectItem key={ tag.id } value={ String(tag.id) }>
                                  { tag.tagName }
                                </SelectItem>
                              )) }
                            </SelectContent>
                          </Select>
                        ) }
                      </div>
                    </div>
                  );
                }) }
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-base font-bold text-[#2f4820]">Recipe instructions </p>
                <div className="inline-flex items-center gap-2 rounded-full border border-[#dbeacc] bg-[#f7fce8] px-3 py-1 text-xs text-[#486532]">
                  <Clock3 className="size-3.5" />
                  Prep { Number(prepTimeMins || 0) } min / Cook { Number(cookTimeMins || 0) } min
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-[4rem_minmax(0,1fr)] md:items-start">
                <div className="rounded-2xl border border-[#cadfbb] bg-[#f4fae7] px-1.5 py-2">
                  <div className="flex flex-wrap gap-2 md:flex-col md:items-center md:gap-1.5">
                    <ToolbarButton
                      label="Heading 2"
                      onClick={ () => editor?.chain().focus().toggleHeading({ level: 2 }).run() }
                      active={ editor?.isActive("heading", { level: 2 }) }
                      disabled={ !editor }
                    >
                      <Heading2 className="size-4" />
                    </ToolbarButton>
                    <ToolbarButton
                      label="Heading 3"
                      onClick={ () => editor?.chain().focus().toggleHeading({ level: 3 }).run() }
                      active={ editor?.isActive("heading", { level: 3 }) }
                      disabled={ !editor }
                    >
                      <Heading3 className="size-4" />
                    </ToolbarButton>
                    <ToolbarButton
                      label="Bold"
                      onClick={ () => editor?.chain().focus().toggleBold().run() }
                      active={ editor?.isActive("bold") }
                      disabled={ !editor }
                    >
                      <Bold className="size-4" />
                    </ToolbarButton>
                    <ToolbarButton
                      label="Italic"
                      onClick={ () => editor?.chain().focus().toggleItalic().run() }
                      active={ editor?.isActive("italic") }
                      disabled={ !editor }
                    >
                      <Italic className="size-4" />
                    </ToolbarButton>
                    <ToolbarButton
                      label="Underline"
                      onClick={ () => editor?.chain().focus().toggleUnderline().run() }
                      active={ editor?.isActive("underline") }
                      disabled={ !editor }
                    >
                      <UnderlineIcon className="size-4" />
                    </ToolbarButton>
                    <ToolbarButton
                      label="Bullet list"
                      onClick={ () => editor?.chain().focus().toggleBulletList().run() }
                      active={ editor?.isActive("bulletList") }
                      disabled={ !editor }
                    >
                      <List className="size-4" />
                    </ToolbarButton>
                    <ToolbarButton
                      label="Numbered list"
                      onClick={ () => editor?.chain().focus().toggleOrderedList().run() }
                      active={ editor?.isActive("orderedList") }
                      disabled={ !editor }
                    >
                      <ListOrdered className="size-4" />
                    </ToolbarButton>
                    <ToolbarButton
                      label="Add link"
                      onClick={ () => {
                        if (!editor) {
                          return;
                        }

                        const value = window.prompt("Enter a URL", "https://");
                        if (!value) {
                          return;
                        }

                        editor.chain().focus().setLink({ href: value }).run();
                      } }
                      disabled={ !editor }
                    >
                      <Link2 className="size-4" />
                    </ToolbarButton>
                    <ToolbarButton
                      label="Remove link"
                      onClick={ () => editor?.chain().focus().unsetLink().run() }
                      disabled={ !editor }
                    >
                      <Unlink className="size-4" />
                    </ToolbarButton>
                    <ToolbarButton
                      label="Insert horizontal line"
                      onClick={ () => editor?.chain().focus().setHorizontalRule().run() }
                      disabled={ !editor }
                    >
                      <Minus className="size-4" />
                    </ToolbarButton>
                    <ToolbarButton
                      label="Insert table"
                      onClick={ () => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() }
                      active={ editor?.isActive("table") }
                      disabled={ !editor }
                    >
                      <Table2 className="size-4" />
                    </ToolbarButton>
                    <ToolbarButton
                      label="Delete table"
                      onClick={ () => editor?.chain().focus().deleteTable().run() }
                      disabled={ !editor || !editor.isActive("table") }
                    >
                      <Table2 className="size-4" />
                      <X className="size-3" />
                    </ToolbarButton>
                    <ToolbarButton
                      label="Add column after"
                      onClick={ () => editor?.chain().focus().addColumnAfter().run() }
                      disabled={ !editor || !editor.isActive("table") }
                    >
                      <Columns2 className="size-4" />
                    </ToolbarButton>
                    <ToolbarButton
                      label="Delete column"
                      onClick={ () => editor?.chain().focus().deleteColumn().run() }
                      disabled={ !editor || !editor.isActive("table") }
                    >
                      <Columns2 className="size-4" />
                      <X className="size-3" />
                    </ToolbarButton>
                    <ToolbarButton
                      label="Add row after"
                      onClick={ () => editor?.chain().focus().addRowAfter().run() }
                      disabled={ !editor || !editor.isActive("table") }
                    >
                      <Rows2 className="size-4" />
                    </ToolbarButton>
                    <ToolbarButton
                      label="Delete row"
                      onClick={ () => editor?.chain().focus().deleteRow().run() }
                      disabled={ !editor || !editor.isActive("table") }
                    >
                      <Rows2 className="size-4" />
                      <X className="size-3" />
                    </ToolbarButton>
                    <ToolbarButton
                      label="Toggle header row"
                      onClick={ () => editor?.chain().focus().toggleHeaderRow().run() }
                      disabled={ !editor || !editor.isActive("table") }
                    >
                      <Combine className="size-4" />
                    </ToolbarButton>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#cadfbb] bg-white p-0.5 [&_.tiptap]:min-h-[28rem] [&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-5 [&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:pl-5 [&_.tiptap_li]:my-1 [&_.tiptap_hr]:my-4 [&_.tiptap_hr]:border-[#cadfbb] [&_.tiptap_table]:w-full [&_.tiptap_table]:border-collapse [&_.tiptap_table]:border [&_.tiptap_table]:border-[#cadfbb] [&_.tiptap_th]:border [&_.tiptap_th]:border-[#cadfbb] [&_.tiptap_th]:bg-[#f4fae7] [&_.tiptap_th]:px-2 [&_.tiptap_th]:py-1 [&_.tiptap_td]:border [&_.tiptap_td]:border-[#cadfbb] [&_.tiptap_td]:px-2 [&_.tiptap_td]:py-1">
                  <EditorContent editor={ editor } />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button
                type="button"
                onClick={ handleSubmit }
                className="bg-[#3f6d23] text-white hover:bg-[#315619]"
                disabled={ isSaving || uploadingImage }
              >
                <Save className="mr-2 size-4" />
                { isSaving ? "Saving..." : isEditing ? "Update Recipe" : "Save Recipe" }
              </Button>

              <Button type="button" variant="outline" className="border-[#cadfbb]" asChild>
                <Link href="/foodies">
                  <Soup className="mr-2 size-4" />
                  Cancel
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
