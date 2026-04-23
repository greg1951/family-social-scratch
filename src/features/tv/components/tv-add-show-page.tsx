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
  Heart,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Rows2,
  Save,
  Sparkles,
  Table2,
  ThumbsUp,
  Tv,
  Underline as UnderlineIcon,
  Unlink,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { saveShowAction } from "@/app/(features)/(tv)/tv/actions";
import {
  createEmptyTipTapDocument,
  parseSerializedTipTapDocument,
  serializeTipTapDocument,
} from "@/components/db/types/poem-term-validation";
import { ShowTagOption, ShowTagType, ShowTemplateOption, TvShow } from "@/components/db/types/shows";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MemberKeyDetails } from "@/features/family/types/family-steps";
import { extractS3KeyFromValue } from "@/lib/s3-object-key";

const TAG_TYPE_LABELS: Array<{ type: ShowTagType; label: string }> = [
  { type: "genre", label: "Genre" },
  { type: "adjective", label: "Adjective" },
  { type: "channel", label: "Channel" },
];

const MAX_IMAGE_SIZE_BYTES = 4 * 1024 * 1024;
const TEMPLATE_NONE_VALUE = "none";
const REACTION_NONE_VALUE = "none";

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
      onMouseDown={ (event) => event.preventDefault() }
      onClick={ onClick }
      disabled={ disabled }
      aria-label={ label }
      className={ [
        "h-8 w-8 p-0",
        active ? "border-[#245475] bg-[#e8f5fd] text-[#12384e]" : "border-[#c6dcec]",
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

  return compressed || "show";
}

function getTemplateDocument(template?: ShowTemplateOption): JSONContent {
  if (!template?.templateJson) {
    return createEmptyTipTapDocument();
  }

  const parsed = parseSerializedTipTapDocument(template.templateJson);

  if (parsed.success) {
    return parsed.content;
  }

  return createEmptyTipTapDocument();
}

export function TvAddShowPage({
  showTags,
  showTemplates,
  member,
  initialShow,
  mode = "add",
}: {
  showTags: ShowTagOption[];
  showTemplates: ShowTemplateOption[];
  member: MemberKeyDetails;
  initialShow?: TvShow | null;
  mode?: "add" | "edit";
}) {
  const router = useRouter();
  const [isSaving, startSaveTransition] = useTransition();
  const initialTemplateId = useMemo(() => {
    const globalTemplate = showTemplates.find((template) => template.isGlobalTemplate);

    if (globalTemplate) {
      return String(globalTemplate.id);
    }

    return TEMPLATE_NONE_VALUE;
  }, [initialShow, showTemplates]);
  const [showTitle, setShowTitle] = useState(initialShow?.showTitle ?? "");
  const [showCaption, setShowCaption] = useState(initialShow?.showCaption ?? "");
  const [showFirstYear, setShowFirstYear] = useState(String(initialShow?.showFirstYear ?? new Date().getFullYear()));
  const [showLastYear, setShowLastYear] = useState(String(initialShow?.showLastYear ?? new Date().getFullYear()));
  const [seasonCount, setSeasonCount] = useState(String(initialShow?.seasonCount ?? 1));
  const [status, setStatus] = useState(initialShow?.status ?? "draft");
  const [submitterLikenessDegree, setSubmitterLikenessDegree] = useState<string>(
    initialShow?.likenessDegree ? String(initialShow.likenessDegree) : REACTION_NONE_VALUE
  );
  const [selectedTagsByType, setSelectedTagsByType] = useState<Partial<Record<ShowTagType, string>>>(() => {
    if (!initialShow) {
      return {};
    }

    const initialState: Partial<Record<ShowTagType, string>> = {};

    for (const tag of showTags) {
      if (initialShow.selectedTagIds.includes(tag.id)) {
        initialState[tag.tagType] = String(tag.id);
      }
    }

    return initialState;
  });
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(initialTemplateId);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showImageUrl, setShowImageUrl] = useState<string | null>(initialShow?.showImageUrl ?? null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(initialShow?.showImageUrl ?? null);
  const isEditing = mode === "edit";

  const selectedTemplate = useMemo(
    () => selectedTemplateId === TEMPLATE_NONE_VALUE
      ? undefined
      : showTemplates.find((template) => String(template.id) === selectedTemplateId),
    [selectedTemplateId, showTemplates]
  );

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
          "tiptap min-h-112 rounded-2xl border border-[#c6dcec] bg-white px-4 py-4 text-[#12384e] shadow-xs outline-none focus:outline-none",
      },
    },
  });

  useEffect(() => {
    if (!editor || isEditing) {
      return;
    }

    editor.commands.setContent(getTemplateDocument(selectedTemplate));
  }, [editor, isEditing, selectedTemplate]);

  useEffect(() => {
    if (!editor || !initialShow || !isEditing) {
      return;
    }

    const parsedShowJson = parseSerializedTipTapDocument(initialShow.showJson);

    if (parsedShowJson.success) {
      editor.commands.setContent(parsedShowJson.content);
    }
  }, [editor, initialShow, isEditing]);

  useEffect(() => {
    if (!showImageUrl || selectedFile) {
      return;
    }

    let isCancelled = false;

    const resolveSignedPreview = async () => {
      const key = extractS3KeyFromValue(showImageUrl);

      if (!key || !key.startsWith("tv/")) {
        if (!isCancelled) {
          setImagePreviewUrl(showImageUrl);
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
            setImagePreviewUrl(showImageUrl);
          }
          return;
        }

        const body = await response.json();

        if (!isCancelled) {
          setImagePreviewUrl(body.url ?? showImageUrl);
        }
      } catch {
        if (!isCancelled) {
          setImagePreviewUrl(showImageUrl);
        }
      }
    };

    void resolveSignedPreview();

    return () => {
      isCancelled = true;
    };
  }, [showImageUrl, selectedFile]);

  useEffect(() => {
    if (!selectedFile) {
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setImagePreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFile]);

  function setSelectedTagForType(tagType: ShowTagType, tagId: string) {
    setSelectedTagsByType((currentState) => ({
      ...currentState,
      [tagType]: tagId,
    }));
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
      toast.error("Image size exceeds 4MB. Please choose a smaller file.");
      event.target.value = "";
      return;
    }

    setSelectedFile(file);
  }

  async function uploadShowImage() {
    if (!selectedFile) {
      return showImageUrl;
    }

    if (!showTitle.trim()) {
      toast.error("Enter a show title first so the image name can be generated.");
      return null;
    }

    try {
      setUploadingImage(true);

      const extension = selectedFile.type === "image/png" ? "png" : "jpg";
      const fileName = `memberId-${ member.memberId }-${ slugifyTitle(showTitle) }.${ extension }`;

      const signResponse = await fetch("/api/s3-upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "upload",
          folder: "tv",
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
      setShowImageUrl(nextImageUrl);
      setSelectedFile(null);
      toast.success("Show image uploaded successfully.");
      return nextImageUrl;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Show image upload failed.");
      return null;
    } finally {
      setUploadingImage(false);
    }
  }

  function handleInsertLink() {
    if (!editor) {
      return;
    }

    const existingHref = editor.getAttributes("link").href as string | undefined;
    const nextHref = window.prompt("Enter URL", existingHref ?? "https://");

    if (nextHref === null) {
      return;
    }

    const normalized = nextHref.trim();

    if (!normalized) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    const value = /^https?:\/\//i.test(normalized) ? normalized : `https://${ normalized }`;
    editor.chain().focus().extendMarkRange("link").setLink({ href: value }).run();
  }

  function getTagOptionsForType(tagType: ShowTagType) {
    return showTags
      .filter((tag) => tag.tagType === tagType)
      .sort((leftTag, rightTag) => {
        if (leftTag.seqNo !== rightTag.seqNo) {
          return leftTag.seqNo - rightTag.seqNo;
        }

        return leftTag.tagName.localeCompare(rightTag.tagName);
      });
  }

  function handleSave() {
    if (!editor) {
      toast.error("Editor is still loading.");
      return;
    }

    if (!showTitle.trim()) {
      toast.error("Show title is required.");
      return;
    }

    const templateId = Number(selectedTemplateId);

    if (!templateId || Number.isNaN(templateId)) {
      toast.error("Select a template before saving the show.");
      return;
    }

    if (!isEditing && submitterLikenessDegree === REACTION_NONE_VALUE) {
      toast.error("Select Like or Love for your show post.");
      return;
    }

    startSaveTransition(async () => {
      const uploadedImageUrl = await uploadShowImage();

      if (selectedFile && !uploadedImageUrl) {
        return;
      }

      const selectedTagIds = TAG_TYPE_LABELS
        .map(({ type }) => selectedTagsByType[type])
        .filter(Boolean)
        .map((value) => Number(value));

      const result = await saveShowAction({
        id: initialShow?.id,
        showTitle: showTitle.trim(),
        showCaption: showCaption.trim(),
        submitterLikenessDegree: submitterLikenessDegree === REACTION_NONE_VALUE
          ? undefined
          : Number(submitterLikenessDegree),
        showJson: serializeTipTapDocument(editor.getJSON()),
        status,
        showImageUrl: uploadedImageUrl ?? showImageUrl ?? null,
        showFirstYear: Number(showFirstYear) || new Date().getFullYear(),
        showLastYear: Number(showLastYear) || new Date().getFullYear(),
        seasonCount: Number(seasonCount) || 1,
        templateId,
        selectedTagIds,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(isEditing ? "Show updated." : "Show saved.");
      router.push("/tv");
      router.refresh();
    });
  }

  return (
    <section className="font-app w-full px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,rgba(11,47,66,0.95),rgba(21,98,123,0.86)_56%,rgba(106,177,198,0.78))] px-6 py-8 text-white shadow-[0_28px_80px_-40px_rgba(8,34,50,0.95)] sm:px-8 lg:px-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.34em] text-[#b9f1ff]">
                Family TV Junkies
              </p>
              <Link
                href="/tv"
                className="mt-3 inline-flex items-center rounded-full border border-white/35 bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#d9f5ff] transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <ArrowLeft className="mr-1 size-4" />
                Back to TV Home Page
              </Link>
              <h1 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">
                { isEditing ? "Edit Show Details" : "Add a Show to the Family Queue" }
              </h1>
              <p className="mt-2 text-sm text-[#d9f5ff]">
                { isEditing
                  ? "Update your show details, image, and write-up."
                  : "Start from a template, upload your show image to S3, and save your write-up as TipTap JSON." }
              </p>
            </div>

            {/* <div className="flex flex-wrap items-center gap-2 rounded-[1.6rem] border border-white/20 bg-white/10 p-4 shadow-inner backdrop-blur">
              <Sparkles className="size-4 text-[#d9f5ff]" />
              <span className="text-sm text-[#d9f5ff]">Signed in as</span>
              <span className="rounded-full bg-white/20 px-3 py-1 text-sm font-semibold">
                { member.firstName } { member.lastName }
              </span>
            </div> */}
          </div>
        </div>

        <div className="overflow-hidden rounded-[1.9rem] border border-white/70 bg-white/88 shadow-[0_24px_70px_-40px_rgba(9,44,62,0.75)] backdrop-blur">
          <div className="border-b border-[#d7ebf3] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(236,249,255,0.86))] px-5 py-5 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#45829a]">
                  TV Editor
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-[#15384a]">
                  { isEditing ? "Update Show" : "New Show Details" }
                </h2>
              </div>
              <Button type="button" onClick={ handleSave } disabled={ isSaving || uploadingImage }>
                <Save className="size-4" />
                { isSaving ? "Saving..." : isEditing ? "Update Show" : "Save Show" }
              </Button>
            </div>
          </div>

          <div className="grid gap-6 px-5 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#15384a]" htmlFor="show-title">Show Title</label>
                <Input
                  id="show-title"
                  value={ showTitle }
                  onChange={ (event) => setShowTitle(event.target.value) }
                  placeholder="Enter show title"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#15384a]" htmlFor="show-caption">Caption</label>
                <Input
                  id="show-caption"
                  value={ showCaption }
                  onChange={ (event) => setShowCaption(event.target.value) }
                  placeholder="Short summary"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#15384a]" htmlFor="show-first-year">First Year</label>
                  <Input
                    id="show-first-year"
                    type="number"
                    value={ showFirstYear }
                    onChange={ (event) => setShowFirstYear(event.target.value) }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#15384a]" htmlFor="show-last-year">Last Year</label>
                  <Input
                    id="show-last-year"
                    type="number"
                    value={ showLastYear }
                    onChange={ (event) => setShowLastYear(event.target.value) }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#15384a]" htmlFor="show-season-count">Seasons</label>
                  <Input
                    id="show-season-count"
                    type="number"
                    value={ seasonCount }
                    onChange={ (event) => setSeasonCount(event.target.value) }
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#15384a]">Template</label>
                  <Select value={ selectedTemplateId } onValueChange={ setSelectedTemplateId }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ TEMPLATE_NONE_VALUE }>No template selected</SelectItem>
                      { showTemplates.map((template) => (
                        <SelectItem key={ template.id } value={ String(template.id) }>{ template.label }</SelectItem>
                      )) }
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#15384a]">Status</label>
                  <Select value={ status } onValueChange={ setStatus }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#15384a]">Your Rating</label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className={ [
                        "border-[#c6dcec] transition-all",
                        submitterLikenessDegree === "1"
                          ? "border-[#245475] bg-[#dff1fb] text-[#0d2a3a] shadow-[0_0_0_2px_rgba(36,84,117,0.18)] scale-[1.03]"
                          : "bg-white text-[#3f6576] hover:bg-[#f1fafe]",
                      ].join(" ") }
                      onClick={ () => setSubmitterLikenessDegree("1") }
                      aria-pressed={ submitterLikenessDegree === "1" }
                    >
                      <ThumbsUp className="mr-2 size-4" />
                      Like
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className={ [
                        "border-[#c6dcec] transition-all",
                        submitterLikenessDegree === "2"
                          ? "border-[#245475] bg-[#dff1fb] text-[#0d2a3a] shadow-[0_0_0_2px_rgba(36,84,117,0.18)] scale-[1.03]"
                          : "bg-white text-[#3f6576] hover:bg-[#f1fafe]",
                      ].join(" ") }
                      onClick={ () => setSubmitterLikenessDegree("2") }
                      aria-pressed={ submitterLikenessDegree === "2" }
                    >
                      <Heart className="mr-2 size-4" />
                      Love
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2 rounded-2xl border border-[#d7ebf3] bg-[#f5fbff] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-sm font-semibold text-[#15384a]">Show Image</label>
                  {/* <span className="text-xs text-[#4a7388]">Stored in S3 folder: tv</span> */ }
                </div>
                <input
                  type="file"
                  accept="image/png, image/jpeg"
                  onChange={ handleFileSelection }
                  className="block w-full rounded-md border border-[#d8eef7] bg-white p-2 text-sm"
                  disabled={ uploadingImage }
                />

                { imagePreviewUrl ? (
                  <div className="relative mt-3 overflow-hidden rounded-xl border border-[#d7ebf3] bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */ }
                    <img src={ imagePreviewUrl } alt="Selected show preview" className="h-48 w-full object-cover" />
                    <button
                      type="button"
                      onClick={ () => {
                        setSelectedFile(null);
                        setShowImageUrl(null);
                        setImagePreviewUrl(null);
                      } }
                      className="absolute right-2 top-2 inline-flex rounded-full border border-white/70 bg-black/40 p-1 text-white"
                      aria-label="Remove image"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                ) : null }

                <div className="flex items-center gap-2 text-xs text-[#4a7388]">
                  <Upload className="size-3.5" />
                  Upload a show image (PNG or JPEG).<br></br>For best results, use an image around 800x450 pixels.
                </div>
              </div>

              <div className="space-y-2 rounded-2xl border border-[#d7ebf3] bg-[#f5fbff] p-4">
                <p className="text-sm font-semibold text-[#15384a]">Show Tags</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  { TAG_TYPE_LABELS.map(({ type, label }) => (
                    <div key={ type } className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[#4a7388]">{ label }</label>
                      <Select
                        value={ selectedTagsByType[type] ?? "none" }
                        onValueChange={ (value) => setSelectedTagForType(type, value === "none" ? "" : value) }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={ `Select ${ label.toLowerCase() }` } />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          { getTagOptionsForType(type).map((tag) => (
                            <SelectItem key={ tag.id } value={ String(tag.id) }>{ tag.tagName }</SelectItem>
                          )) }
                        </SelectContent>
                      </Select>
                    </div>
                  )) }
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-xl border border-[#d7ebf3] bg-[#f5fbff] px-3 py-2 text-sm text-[#3f6576]">
                <Tv className="size-4 text-[#2d87a8]" />
                Use the Rich Text constrols below to create a lovely TV Show write-up.
              </div>

              <div className="overflow-hidden rounded-2xl border border-[#d7ebf3] bg-[#f5fbff] [&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-5 [&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:pl-5 [&_.tiptap_li]:my-1 [&_.tiptap_hr]:my-4 [&_.tiptap_hr]:border-[#c6dcec] [&_.tiptap_table]:w-full [&_.tiptap_table]:border-collapse [&_.tiptap_table]:border [&_.tiptap_table]:border-[#c6dcec] [&_.tiptap_th]:border [&_.tiptap_th]:border-[#c6dcec] [&_.tiptap_th]:bg-[#eaf5fb] [&_.tiptap_th]:px-2 [&_.tiptap_th]:py-1 [&_.tiptap_td]:border [&_.tiptap_td]:border-[#c6dcec] [&_.tiptap_td]:px-2 [&_.tiptap_td]:py-1">
                <div className="flex flex-wrap gap-2 border-b border-[#c6dcec] px-3 py-3">
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
                    label="Set link"
                    onClick={ handleInsertLink }
                    active={ editor?.isActive("link") }
                    disabled={ !editor }
                  >
                    <Link2 />
                  </ToolbarButton>
                  <ToolbarButton
                    label="Remove link"
                    onClick={ () => editor?.chain().focus().extendMarkRange("link").unsetLink().run() }
                    disabled={ !editor?.isActive("link") }
                  >
                    <Unlink />
                  </ToolbarButton>
                  <ToolbarButton
                    label="Horizontal rule"
                    onClick={ () => editor?.chain().focus().setHorizontalRule().run() }
                    disabled={ !editor?.can().chain().focus().setHorizontalRule().run() }
                  >
                    <Minus />
                  </ToolbarButton>
                  <ToolbarButton
                    label="Insert table"
                    onClick={ () => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() }
                    disabled={ !editor?.can().chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() }
                  >
                    <Table2 />
                  </ToolbarButton>
                  <ToolbarButton
                    label="Add row"
                    onClick={ () => editor?.chain().focus().addRowAfter().run() }
                    disabled={ !editor?.can().chain().focus().addRowAfter().run() }
                  >
                    <Rows2 />
                  </ToolbarButton>
                  <ToolbarButton
                    label="Add column"
                    onClick={ () => editor?.chain().focus().addColumnAfter().run() }
                    disabled={ !editor?.can().chain().focus().addColumnAfter().run() }
                  >
                    <Columns2 />
                  </ToolbarButton>
                  <ToolbarButton
                    label="Merge cells"
                    onClick={ () => editor?.chain().focus().mergeCells().run() }
                    disabled={ !editor?.can().chain().focus().mergeCells().run() }
                  >
                    <Combine />
                  </ToolbarButton>
                </div>
                <EditorContent editor={ editor } />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
