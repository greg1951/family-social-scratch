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
  Table2,
  ThumbsUp,
  Underline as UnderlineIcon,
  Unlink,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { saveMovieAction } from "@/app/(features)/(movies)/movies/actions";
import {
  createEmptyTipTapDocument,
  parseSerializedTipTapDocument,
  serializeTipTapDocument,
} from "@/components/db/types/poem-term-validation";
import { MovieRecord, MovieTagOption, MovieTagType, MovieTemplateOption } from "@/components/db/types/movies";
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

const TAG_TYPE_LABELS: Array<{ type: MovieTagType; label: string }> = [
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
        active ? "border-[#b8581a] bg-[#fff1e8] text-[#7b3306]" : "border-[#e8c4a0]",
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

  return compressed || "movie";
}

function getTemplateDocument(template?: MovieTemplateOption): JSONContent {
  if (!template?.templateJson) {
    return createEmptyTipTapDocument();
  }

  const parsed = parseSerializedTipTapDocument(template.templateJson);
  return parsed.success ? parsed.content : createEmptyTipTapDocument();
}

export function MovieAddPage({
  movieTags,
  movieTemplates,
  member,
  initialMovie,
  mode = "add",
}: {
  movieTags: MovieTagOption[];
  movieTemplates: MovieTemplateOption[];
  member: MemberKeyDetails;
  initialMovie?: MovieRecord | null;
  mode?: "add" | "edit";
}) {
  const router = useRouter();
  const [isSaving, startSaveTransition] = useTransition();
  const initialTemplateId = useMemo(() => {
    const globalTemplate = movieTemplates.find((template) => template.isGlobalTemplate);
    return globalTemplate ? String(globalTemplate.id) : TEMPLATE_NONE_VALUE;
  }, [movieTemplates]);
  const [movieTitle, setMovieTitle] = useState(initialMovie?.movieTitle ?? "");
  const [movieCaption, setMovieCaption] = useState(initialMovie?.movieCaption ?? "");
  const [movieDebutYear, setMovieDebutYear] = useState(String(initialMovie?.movieDebutYear ?? new Date().getFullYear()));
  const [status, setStatus] = useState(initialMovie?.status ?? "draft");
  const [submitterLikenessDegree, setSubmitterLikenessDegree] = useState<string>(
    initialMovie?.likenessDegree ? String(initialMovie.likenessDegree) : REACTION_NONE_VALUE
  );
  const [selectedTagsByType, setSelectedTagsByType] = useState<Partial<Record<MovieTagType, string>>>(() => {
    if (!initialMovie) {
      return {};
    }

    const initialState: Partial<Record<MovieTagType, string>> = {};
    for (const tag of movieTags) {
      if (initialMovie.selectedTagIds.includes(tag.id)) {
        initialState[tag.tagType] = String(tag.id);
      }
    }
    return initialState;
  });
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(initialTemplateId);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [movieImageUrl, setMovieImageUrl] = useState<string | null>(initialMovie?.movieImageUrl ?? null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(initialMovie?.movieImageUrl ?? null);
  const isEditing = mode === "edit";

  const selectedTemplate = useMemo(
    () => selectedTemplateId === TEMPLATE_NONE_VALUE ? undefined : movieTemplates.find((template) => String(template.id) === selectedTemplateId),
    [selectedTemplateId, movieTemplates]
  );

  const editor = useEditor({
    extensions: [StarterKit, Underline, LinkExtension.configure({ autolink: true, defaultProtocol: "https", openOnClick: false }), Table.configure({ resizable: true }), TableRow, TableHeader, TableCell],
    content: getTemplateDocument(selectedTemplate),
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    editorProps: { attributes: { class: "tiptap min-h-112 rounded-2xl border border-[#f0d9c4] bg-white px-4 py-4 text-[#4b2a18] shadow-xs outline-none focus:outline-none" } },
  });

  useEffect(() => {
    if (!editor || isEditing) {
      return;
    }
    editor.commands.setContent(getTemplateDocument(selectedTemplate));
  }, [editor, isEditing, selectedTemplate]);

  useEffect(() => {
    if (!editor || !initialMovie || !isEditing) {
      return;
    }
    const parsedMovieJson = parseSerializedTipTapDocument(initialMovie.movieJson);
    if (parsedMovieJson.success) {
      editor.commands.setContent(parsedMovieJson.content);
    }
  }, [editor, initialMovie, isEditing]);

  useEffect(() => {
    if (!movieImageUrl || selectedFile) {
      return;
    }
    let isCancelled = false;
    const resolveSignedPreview = async () => {
      const key = extractS3KeyFromValue(movieImageUrl);
      if (!key) {
        if (!isCancelled) {
          setImagePreviewUrl(movieImageUrl);
        }
        return;
      }
      try {
        const response = await fetch("/api/s3-upload", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "download", fileName: key }) });
        if (!response.ok) {
          if (!isCancelled) {
            setImagePreviewUrl(movieImageUrl);
          }
          return;
        }
        const body = await response.json();
        if (!isCancelled) {
          setImagePreviewUrl(body.url ?? movieImageUrl);
        }
      } catch {
        if (!isCancelled) {
          setImagePreviewUrl(movieImageUrl);
        }
      }
    };
    void resolveSignedPreview();
    return () => { isCancelled = true; };
  }, [movieImageUrl, selectedFile]);

  useEffect(() => {
    if (!selectedFile) {
      return;
    }
    const objectUrl = URL.createObjectURL(selectedFile);
    setImagePreviewUrl(objectUrl);
    return () => { URL.revokeObjectURL(objectUrl); };
  }, [selectedFile]);

  function setSelectedTagForType(tagType: MovieTagType, tagId: string) {
    setSelectedTagsByType((currentState) => ({ ...currentState, [tagType]: tagId }));
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

  async function uploadMovieImage() {
    if (!selectedFile) {
      return movieImageUrl;
    }
    if (!movieTitle.trim()) {
      toast.error("Enter a movie title first so the image name can be generated.");
      return null;
    }
    try {
      setUploadingImage(true);
      const extension = selectedFile.type === "image/png" ? "png" : "jpg";
      const fileName = `memberId-${ member.memberId }-${ slugifyTitle(movieTitle) }.${ extension }`;
      const signResponse = await fetch("/api/s3-upload", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "upload", folder: "movies", fileName, contentType: selectedFile.type }) });
      if (!signResponse.ok) {
        throw new Error("Could not create a signed upload URL.");
      }
      const body = await signResponse.json();
      const uploadResponse = await fetch(body.url, { method: "PUT", headers: { "Content-Type": body.signedContentType ?? selectedFile.type }, body: selectedFile });
      if (!uploadResponse.ok) {
        throw new Error("Failed to upload image to S3.");
      }
      const nextImageUrl = body.fileUrl ?? null;
      setMovieImageUrl(nextImageUrl);
      setSelectedFile(null);
      toast.success("Movie image uploaded successfully.");
      return nextImageUrl;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Movie image upload failed.");
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

  function getTagOptionsForType(tagType: MovieTagType) {
    return movieTags.filter((tag) => tag.tagType === tagType).sort((leftTag, rightTag) => leftTag.seqNo !== rightTag.seqNo ? leftTag.seqNo - rightTag.seqNo : leftTag.tagName.localeCompare(rightTag.tagName));
  }

  function handleSave() {
    if (!editor) {
      toast.error("Editor is still loading.");
      return;
    }
    if (!movieTitle.trim()) {
      toast.error("Movie title is required.");
      return;
    }
    const templateId = Number(selectedTemplateId);
    if (!templateId || Number.isNaN(templateId)) {
      toast.error("Select a template before saving the movie.");
      return;
    }

    if (!isEditing && submitterLikenessDegree === REACTION_NONE_VALUE) {
      toast.error("Select Like or Love for your movie post.");
      return;
    }

    startSaveTransition(async () => {
      const uploadedImageUrl = await uploadMovieImage();
      if (selectedFile && !uploadedImageUrl) {
        return;
      }
      const selectedTagIds = TAG_TYPE_LABELS.map(({ type }) => selectedTagsByType[type]).filter(Boolean).map((value) => Number(value));
      const result = await saveMovieAction({ id: initialMovie?.id, movieTitle: movieTitle.trim(), movieCaption: movieCaption.trim(), submitterLikenessDegree: submitterLikenessDegree === REACTION_NONE_VALUE ? undefined : Number(submitterLikenessDegree), movieJson: serializeTipTapDocument(editor.getJSON()), status, movieImageUrl: uploadedImageUrl ?? movieImageUrl ?? null, movieDebutYear: Number(movieDebutYear) || new Date().getFullYear(), templateId, selectedTagIds });
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(isEditing ? "Movie updated." : "Movie saved.");
      router.push("/movies");
      router.refresh();
    });
  }

  return (
    <section className="font-app w-full px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,rgba(96,32,0,0.95),rgba(140,56,12,0.86)_56%,rgba(184,88,24,0.78))] px-6 py-8 text-white shadow-[0_28px_80px_-40px_rgba(60,20,0,0.95)] sm:px-8 lg:px-10">
          <div className="max-w-3xl">
            <p className="text-[0.72rem] font-bold uppercase tracking-[0.34em] text-[#ffd9b5]">Family Movie Maniacs</p>
            <Link href="/movies" className="mt-3 inline-flex items-center rounded-full border border-white/35 bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#ffe8d1] transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
              <ArrowLeft className="mr-1 size-4" />
              Back to Movies Home Page
            </Link>
            <h1 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">{ isEditing ? "Edit Movie Details" : "Add a Movie Review" }</h1>
            <p className="mt-2 text-sm text-[#ffe8d1]">Select a published template, upload the poster image to S3, and save your family movie write-up as TipTap JSON.</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-[1.9rem] border border-white/70 bg-white/88 shadow-[0_24px_70px_-40px_rgba(96,32,0,0.75)] backdrop-blur">
          <div className="border-b border-[#f0d9c4] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,248,240,0.86))] px-5 py-5 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#a85a3a]">Movie Editor</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-[#5c2e1a]">{ isEditing ? "Update Movie" : "New Movie Details" }</h2>
              </div>
              <Button type="button" onClick={ handleSave } disabled={ isSaving || uploadingImage }>
                <Save className="size-4" />
                { isSaving ? "Saving..." : isEditing ? "Update Movie" : "Save Movie" }
              </Button>
            </div>
          </div>

          <div className="grid gap-6 px-5 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#5c2e1a]" htmlFor="movie-title">Movie Title</label>
                <Input id="movie-title" value={ movieTitle } onChange={ (event) => setMovieTitle(event.target.value) } placeholder="Enter movie title" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#5c2e1a]" htmlFor="movie-caption">Caption</label>
                <Input id="movie-caption" value={ movieCaption } onChange={ (event) => setMovieCaption(event.target.value) } placeholder="Short summary" />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#5c2e1a]">Template</label>
                  <Select value={ selectedTemplateId } onValueChange={ setSelectedTemplateId }>
                    <SelectTrigger><SelectValue placeholder="Select template" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ TEMPLATE_NONE_VALUE }>No template selected</SelectItem>
                      { movieTemplates.map((template) => (
                        <SelectItem key={ template.id } value={ String(template.id) }>{ template.label }</SelectItem>
                      )) }
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#5c2e1a]">Status</label>
                  <Select value={ status } onValueChange={ setStatus }>
                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#5c2e1a]">Your Rating</label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className={ [
                        "border-[#e8c4a0] transition-all",
                        submitterLikenessDegree === "1"
                          ? "border-[#b8581a] bg-[#ffe6d6] text-[#5c2300] shadow-[0_0_0_2px_rgba(184,88,26,0.18)] scale-[1.03]"
                          : "bg-white text-[#8b5a3c] hover:bg-[#fff7f1]",
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
                        "border-[#e8c4a0] transition-all",
                        submitterLikenessDegree === "2"
                          ? "border-[#b8581a] bg-[#ffe6d6] text-[#5c2300] shadow-[0_0_0_2px_rgba(184,88,26,0.18)] scale-[1.03]"
                          : "bg-white text-[#8b5a3c] hover:bg-[#fff7f1]",
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
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#5c2e1a]" htmlFor="movie-year">Debut Year</label>
                <Input id="movie-year" type="number" value={ movieDebutYear } onChange={ (event) => setMovieDebutYear(event.target.value) } />
              </div>
              <div className="space-y-2 rounded-2xl border border-[#f0d9c4] bg-[#fff8f2] p-4">
                <label className="text-sm font-semibold text-[#5c2e1a]">Movie Image</label>
                <input type="file" accept="image/png, image/jpeg" onChange={ handleFileSelection } className="block w-full rounded-md border border-[#f0d9c4] bg-white p-2 text-sm" disabled={ uploadingImage } />
                { imagePreviewUrl ? (
                  <div className="relative mt-3 overflow-hidden rounded-xl border border-[#f0d9c4] bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */ }
                    <img src={ imagePreviewUrl } alt="Selected movie preview" className="h-48 w-full object-cover" />
                    <button type="button" onClick={ () => { setSelectedFile(null); setMovieImageUrl(null); setImagePreviewUrl(null); } } className="absolute right-2 top-2 inline-flex rounded-full border border-white/70 bg-black/40 p-1 text-white" aria-label="Remove image">
                      <X className="size-4" />
                    </button>
                  </div>
                ) : null }
                <div className="flex items-center gap-2 text-xs text-[#8b5a3c]"><Upload className="size-3.5" />Upload a movie image to the S3 movies folder. Use an image around 800x450 pixels for best results.</div>
              </div>
              <div className="space-y-2 rounded-2xl border border-[#f0d9c4] bg-[#fff8f2] p-4">
                <p className="text-sm font-semibold text-[#5c2e1a]">Movie Tags</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  { TAG_TYPE_LABELS.map(({ type, label }) => (
                    <div key={ type } className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8b5a3c]">{ label }</label>
                      <Select value={ selectedTagsByType[type] ?? "none" } onValueChange={ (value) => setSelectedTagForType(type, value === "none" ? "" : value) }>
                        <SelectTrigger><SelectValue placeholder={ `Select ${ label.toLowerCase() }` } /></SelectTrigger>
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
              <div className="flex items-center gap-2 rounded-xl border border-[#f0d9c4] bg-[#fff8f2] px-3 py-2 text-sm text-[#734f3a]">Use the rich text controls below to create a detailed movie review.</div>
              <div className="overflow-hidden rounded-2xl border border-[#f0d9c4] bg-[#fff8f2] [&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-5 [&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:pl-5 [&_.tiptap_li]:my-1 [&_.tiptap_hr]:my-4 [&_.tiptap_hr]:border-[#f0d9c4] [&_.tiptap_table]:w-full [&_.tiptap_table]:border-collapse [&_.tiptap_table]:border [&_.tiptap_table]:border-[#f0d9c4] [&_.tiptap_th]:border [&_.tiptap_th]:border-[#f0d9c4] [&_.tiptap_th]:bg-[#fff1e8] [&_.tiptap_th]:px-2 [&_.tiptap_th]:py-1 [&_.tiptap_td]:border [&_.tiptap_td]:border-[#f0d9c4] [&_.tiptap_td]:px-2 [&_.tiptap_td]:py-1">
                <div className="flex flex-wrap gap-2 border-b border-[#f0d9c4] px-3 py-3">
                  <ToolbarButton label="Heading 2" onClick={ () => editor?.chain().focus().toggleHeading({ level: 2 }).run() } active={ editor?.isActive("heading", { level: 2 }) } disabled={ !editor?.can().chain().focus().toggleHeading({ level: 2 }).run() }><Heading2 /></ToolbarButton>
                  <ToolbarButton label="Heading 3" onClick={ () => editor?.chain().focus().toggleHeading({ level: 3 }).run() } active={ editor?.isActive("heading", { level: 3 }) } disabled={ !editor?.can().chain().focus().toggleHeading({ level: 3 }).run() }><Heading3 /></ToolbarButton>
                  <ToolbarButton label="Bold" onClick={ () => editor?.chain().focus().toggleBold().run() } active={ editor?.isActive("bold") } disabled={ !editor?.can().chain().focus().toggleBold().run() }><Bold /></ToolbarButton>
                  <ToolbarButton label="Italic" onClick={ () => editor?.chain().focus().toggleItalic().run() } active={ editor?.isActive("italic") } disabled={ !editor?.can().chain().focus().toggleItalic().run() }><Italic /></ToolbarButton>
                  <ToolbarButton label="Underline" onClick={ () => editor?.chain().focus().toggleUnderline().run() } active={ editor?.isActive("underline") } disabled={ !editor?.can().chain().focus().toggleUnderline().run() }><UnderlineIcon /></ToolbarButton>
                  <ToolbarButton label="Bullet list" onClick={ () => editor?.chain().focus().toggleBulletList().run() } active={ editor?.isActive("bulletList") } disabled={ !editor?.can().chain().focus().toggleBulletList().run() }><List /></ToolbarButton>
                  <ToolbarButton label="Ordered list" onClick={ () => editor?.chain().focus().toggleOrderedList().run() } active={ editor?.isActive("orderedList") } disabled={ !editor?.can().chain().focus().toggleOrderedList().run() }><ListOrdered /></ToolbarButton>
                  <ToolbarButton label="Set link" onClick={ handleInsertLink } active={ editor?.isActive("link") } disabled={ !editor }><Link2 /></ToolbarButton>
                  <ToolbarButton label="Remove link" onClick={ () => editor?.chain().focus().extendMarkRange("link").unsetLink().run() } disabled={ !editor?.isActive("link") }><Unlink /></ToolbarButton>
                  <ToolbarButton label="Horizontal rule" onClick={ () => editor?.chain().focus().setHorizontalRule().run() } disabled={ !editor?.can().chain().focus().setHorizontalRule().run() }><Minus /></ToolbarButton>
                  <ToolbarButton label="Insert table" onClick={ () => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() } disabled={ !editor?.can().chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() }><Table2 /></ToolbarButton>
                  <ToolbarButton label="Add row" onClick={ () => editor?.chain().focus().addRowAfter().run() } disabled={ !editor?.isActive("table") }><Rows2 /></ToolbarButton>
                  <ToolbarButton label="Add column" onClick={ () => editor?.chain().focus().addColumnAfter().run() } disabled={ !editor?.isActive("table") }><Columns2 /></ToolbarButton>
                  <ToolbarButton label="Delete table" onClick={ () => editor?.chain().focus().deleteTable().run() } disabled={ !editor?.isActive("table") }><Table2 /><X className="size-3" /></ToolbarButton>
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