"use client";

import LinkExtension from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor } from "@tiptap/react";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Bold, Heading3, Italic, Link2, Loader2, Plus, Underline as UnderlineIcon, Unlink, Upload, Video } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import {
    createVideoEntryAction,
    deleteVideoEntryAction,
    getVideoMaintenanceDataAction,
    updateVideoEntryAction,
} from "@/app/(support)/(logged-in)/(videos)/add-videos/actions";
import {
    createEmptyTipTapDocument,
    parseSerializedTipTapDocument,
    serializeTipTapDocument,
} from "@/components/db/types/poem-term-validation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { VideoListItem, VideoTagOption } from "@/components/db/sql/queries-videos";

const ACCEPTED_VIDEO_TYPE = "video/mp4";
const RECOMMENDED_MIN_SIZE_BYTES = 14 * 1024 * 1024;
const RECOMMENDED_MAX_SIZE_BYTES = 20 * 1024 * 1024;
const HARD_MAX_SIZE_BYTES = 60 * 1024 * 1024;

type FormState = {
    videoName: string;
    durationMinutes: string;
    descriptionJson: string;
    status: "draft" | "published";
    selectedTagIds: number[];
    selectedFile: File | null;
};

type ToolbarButtonProps = {
    label: string;
    active?: boolean;
    disabled?: boolean;
    preserveSelection?: boolean;
    onClick: () => void;
    children: React.ReactNode;
};

const DEFAULT_DESCRIPTION_JSON = serializeTipTapDocument(createEmptyTipTapDocument());

function ToolbarButton({ label, active = false, disabled = false, preserveSelection = false, onClick, children }: ToolbarButtonProps) {
    return (
        <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={disabled}
            onMouseDown={preserveSelection ? (event) => event.preventDefault() : undefined}
            onClick={onClick}
            aria-label={label}
            className={active ? "border-[#2b6a87] bg-[#ebf6fb] text-[#0d4056]" : "border-[#c7d7df]"}
        >
            {children}
            <span className="sr-only">{label}</span>
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
        : `https://${trimmedValue}`;

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

function getInitialDescriptionDocument(value: string | null | undefined) {
    const parsed = parseSerializedTipTapDocument(value ?? undefined);
    return parsed.success ? parsed.content : createEmptyTipTapDocument();
}

function uploadWithProgress(url: string, file: File, contentType: string, onProgress: (percent: number) => void) {
    return new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", url);
        xhr.setRequestHeader("Content-Type", contentType);

        xhr.upload.onprogress = (event) => {
            if (!event.lengthComputable) {
                return;
            }

            const percent = Math.min(100, Math.round((event.loaded / event.total) * 100));
            onProgress(percent);
        };

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                onProgress(100);
                resolve();
                return;
            }

            reject(new Error(`Upload failed with status ${xhr.status}.`));
        };

        xhr.onerror = () => reject(new Error("Network error while uploading video to S3."));
        xhr.send(file);
    });
}

function createSafeFileName(originalName: string) {
    const lower = originalName.toLowerCase();
    const withoutExtension = lower.endsWith(".mp4") ? lower.slice(0, -4) : lower;
    const sanitizedBase = withoutExtension.replace(/[^a-z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    const fallbackBase = sanitizedBase.length > 0 ? sanitizedBase : "video";
    return `${Date.now()}-${fallbackBase}.mp4`;
}

function createDefaultFormState(): FormState {
    return {
        videoName: "",
        durationMinutes: "",
        descriptionJson: DEFAULT_DESCRIPTION_JSON,
        status: "draft",
        selectedTagIds: [],
        selectedFile: null,
    };
}

function buildPlaybackUrl(value: string | null) {
    if (!value) {
        return null;
    }

    return `/api/video-s3-upload?key=${encodeURIComponent(value)}`;
}

export default function AddVideosForm() {
    const [videos, setVideos] = useState<VideoListItem[]>([]);
    const [tagOptions, setTagOptions] = useState<VideoTagOption[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [editingVideoId, setEditingVideoId] = useState<number | null>(null);
    const [previewVideo, setPreviewVideo] = useState<VideoListItem | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [formState, setFormState] = useState<FormState>(createDefaultFormState);
    const [editorContentSeed, setEditorContentSeed] = useState(DEFAULT_DESCRIPTION_JSON);

    const descriptionEditor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [3],
                },
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
        content: getInitialDescriptionDocument(editorContentSeed),
        immediatelyRender: false,
        editorProps: {
            attributes: {
                class:
                    "tiptap min-h-[10rem] rounded-b-2xl border border-t-0 border-[#d7e3e8] bg-white px-4 py-4 text-[#173848] shadow-xs outline-none focus:outline-none",
            },
        },
        onUpdate({ editor }) {
            setFormState((current) => ({
                ...current,
                descriptionJson: serializeTipTapDocument(editor.getJSON()),
            }));
        },
    });

    const groupedTagOptions = useMemo(() => {
        const map = new Map<string, VideoTagOption[]>();

        for (const option of tagOptions) {
            const key = option.category || "general";
            const current = map.get(key) ?? [];
            current.push(option);
            map.set(key, current);
        }

        return Array.from(map.entries())
            .map(([category, options]) => ({
                category,
                options: [...options].sort((left, right) => {
                    if (left.seqNo !== right.seqNo) {
                        return left.seqNo - right.seqNo;
                    }

                    return left.tagName.localeCompare(right.tagName);
                }),
            }))
            .sort((left, right) => left.category.localeCompare(right.category));
    }, [tagOptions]);

    async function loadMaintenanceData() {
        setIsLoading(true);
        const result = await getVideoMaintenanceDataAction();

        if (!result.success) {
            toast.error(result.message ?? "Unable to load video maintenance data.");
            setVideos([]);
            setTagOptions([]);
            setIsLoading(false);
            return;
        }

        setVideos(result.videos);
        setTagOptions(result.tagOptions);
        setIsLoading(false);
    }

    useEffect(() => {
        loadMaintenanceData();
    }, []);

    useEffect(() => {
        if (!isDialogOpen) {
            return;
        }

        // Refresh from DB each time the dialog opens so new video_tag_reference rows show up immediately.
        void loadMaintenanceData();
    }, [isDialogOpen]);

    function resetForm() {
        setFormState(createDefaultFormState());
        setEditorContentSeed(DEFAULT_DESCRIPTION_JSON);
        setUploadProgress(0);
        setEditingVideoId(null);
        setIsEditing(false);
    }

    function startEdit(videoItem: VideoListItem) {
        setIsEditing(true);
        setEditingVideoId(videoItem.id);
        setFormState({
            videoName: videoItem.videoName,
            durationMinutes: String(videoItem.durationMinutes),
            descriptionJson: videoItem.videoJson,
            status: videoItem.status === "published" ? "published" : "draft",
            selectedTagIds: videoItem.tags.map((tag) => tag.id).slice(0, 3),
            selectedFile: null,
        });
        setEditorContentSeed(videoItem.videoJson);
        setUploadProgress(0);
        setIsDialogOpen(true);
    }

    function openPreview(videoItem: VideoListItem) {
        setPreviewVideo(videoItem);
        setIsPreviewOpen(true);
    }

    async function handleDeleteVideo(videoId: number) {
        const confirmed = window.confirm("Delete this video row? This cannot be undone.");
        if (!confirmed) {
            return;
        }

        const result = await deleteVideoEntryAction(videoId);

        if (!result.success) {
            toast.error(result.message ?? "Unable to delete video.");
            return;
        }

        setVideos((current) => current.filter((videoItem) => videoItem.id !== videoId));
        toast.success(result.message);
    }

    function toggleTag(tagId: number) {
        setFormState((current) => {
            const exists = current.selectedTagIds.includes(tagId);
            if (exists) {
                return {
                    ...current,
                    selectedTagIds: current.selectedTagIds.filter((id) => id !== tagId),
                };
            }

            if (current.selectedTagIds.length >= 3) {
                toast.error("You can only select up to 3 tags.");
                return current;
            }

            return {
                ...current,
                selectedTagIds: [...current.selectedTagIds, tagId],
            };
        });
    }

    async function handleSaveVideo() {
        const { videoName, durationMinutes, descriptionJson, status, selectedTagIds, selectedFile } = formState;

        if (!videoName.trim()) {
            toast.error("Video name is required.");
            return;
        }

        if (!isEditing && !selectedFile) {
            toast.error("Select an MP4 file before submitting.");
            return;
        }

        if (isEditing && !editingVideoId) {
            toast.error("Unable to determine which video to edit.");
            return;
        }

        if (selectedFile && selectedFile.type !== ACCEPTED_VIDEO_TYPE) {
            toast.error("Only MP4 files are supported.");
            return;
        }

        if (selectedFile && selectedFile.size > HARD_MAX_SIZE_BYTES) {
            toast.error("Video file is too large. Keep it under 60MB.");
            return;
        }

        if (selectedTagIds.length < 2 || selectedTagIds.length > 3) {
            toast.error("Select 2 or 3 tags.");
            return;
        }

        const parsedDuration = Number(durationMinutes);
        if (!Number.isInteger(parsedDuration) || parsedDuration <= 0) {
            toast.error("Duration must be a positive whole number.");
            return;
        }

        if (selectedFile && (selectedFile.size < RECOMMENDED_MIN_SIZE_BYTES || selectedFile.size > RECOMMENDED_MAX_SIZE_BYTES)) {
            toast("Video uploaded outside the expected 14-20MB range.");
        }

        setIsSubmitting(true);
        setUploadProgress(0);

        try {
            if (isEditing && editingVideoId) {
                const updateResult = await updateVideoEntryAction({
                    id: editingVideoId,
                    videoName: videoName.trim(),
                    status,
                    durationMinutes: parsedDuration,
                    descriptionJson,
                    selectedTagIds,
                });

                if (!updateResult.success) {
                    throw new Error(updateResult.message ?? "Unable to update video entry.");
                }

                setVideos((current) =>
                    current.map((videoItem) =>
                        videoItem.id === editingVideoId ? updateResult.updatedVideo : videoItem,
                    ),
                );
                toast.success(updateResult.message);
            } else if (selectedFile) {
                const fileName = createSafeFileName(selectedFile.name);

                const signRes = await fetch("/api/video-s3-upload", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        action: "upload",
                        fileName,
                        contentType: selectedFile.type,
                    }),
                });

                if (!signRes.ok) {
                    throw new Error("Unable to create signed video upload URL.");
                }

                const signBody = await signRes.json();

                await uploadWithProgress(
                    signBody.url,
                    selectedFile,
                    signBody.signedContentType ?? selectedFile.type,
                    setUploadProgress,
                );

                const saveResult = await createVideoEntryAction({
                    videoName: videoName.trim(),
                    status,
                    durationMinutes: parsedDuration,
                    descriptionJson,
                    videoUrl: signBody.s3Key,
                    selectedTagIds,
                    videoS3Id: signBody.videoS3CredentialId,
                });

                if (!saveResult.success) {
                    throw new Error(saveResult.message ?? "Unable to create video entry.");
                }

                setVideos((current) => [saveResult.createdVideo, ...current]);
                toast.success(saveResult.message);
            }

            resetForm();
            setIsDialogOpen(false);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Video upload failed.");
        } finally {
            setIsSubmitting(false);
        }
    }

    useEffect(() => {
        if (!descriptionEditor) {
            return;
        }

        descriptionEditor.commands.setContent(getInitialDescriptionDocument(editorContentSeed));
    }, [descriptionEditor, editorContentSeed]);

    function addOrEditLink() {
        if (!descriptionEditor) {
            return;
        }

        const currentLink = descriptionEditor.getAttributes("link") as { href?: string };
        const promptValue = window.prompt("Enter URL", currentLink.href ?? "https://");

        if (promptValue === null) {
            return;
        }

        const normalizedUrl = normalizeLinkUrl(promptValue);
        if (!normalizedUrl) {
            toast.error("Enter a valid URL, email address, or telephone link.");
            return;
        }

        descriptionEditor.chain().focus().extendMarkRange("link").setLink({ href: normalizedUrl }).run();
    }

    return (
        <div className="space-y-6">
            <section className="rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,rgba(9,49,77,0.95),rgba(18,87,124,0.92)_50%,rgba(253,174,97,0.92))] px-6 py-8 text-white shadow-[0_28px_80px_-42px_rgba(5,32,50,0.85)] sm:px-8">
                <p className="text-[0.72rem] font-bold uppercase tracking-[0.34em] text-[#d8f1ff]">Support Video Maintenance</p>
                <h1 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">Video Library Admin</h1>
                <Link
                    href="/"
                    className="mt-3 inline-flex items-center gap-2 rounded-lg border border-white/40 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to Main Page
                </Link>
            </section>

            <section className="rounded-[2rem] border border-[#c8d8df] bg-white/95 p-6 shadow-[0_20px_80px_rgba(19,55,71,0.10)] sm:p-8">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-[#10364a]">Video Entries</h2>
                        <p className="text-sm text-[#4b6a79]">Total videos: {videos.length}</p>
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button
                                type="button"
                                onClick={() => resetForm()}
                                className="h-10 w-full rounded-xl bg-[linear-gradient(135deg,#005472_0%,#0a779f_52%,#59cdf7_100%)] px-4 text-xs font-bold text-white shadow-[0_18px_30px_-18px_rgba(0,84,114,0.8)] hover:brightness-110 sm:w-auto"
                            >
                                <Plus className="mr-1 h-4 w-4" />
                                Add Video
                            </Button>
                        </DialogTrigger>

                        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>{isEditing ? "Edit Support Video" : "Add Support Video"}</DialogTitle>
                            </DialogHeader>

                            <div className="space-y-5 py-2">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="video-name">Video name</Label>
                                        <Input
                                            id="video-name"
                                            value={formState.videoName}
                                            onChange={(event) => setFormState((current) => ({ ...current, videoName: event.target.value }))}
                                            placeholder="Example: How To Open A Support Ticket"
                                            disabled={isSubmitting}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="duration-minutes">Duration (minutes)</Label>
                                        <Input
                                            id="duration-minutes"
                                            type="number"
                                            min={1}
                                            max={600}
                                            value={formState.durationMinutes}
                                            onChange={(event) => setFormState((current) => ({ ...current, durationMinutes: event.target.value }))}
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Video description</Label>
                                    <div className="rounded-2xl border border-[#d7e3e8] bg-[#f8fbfd] p-2">
                                        <div className="flex flex-wrap gap-2 rounded-xl border border-[#d7e3e8] bg-white p-2">
                                            <ToolbarButton
                                                label="Heading 3"
                                                active={descriptionEditor?.isActive("heading", { level: 3 })}
                                                disabled={isSubmitting || !descriptionEditor}
                                                onClick={() => descriptionEditor?.chain().focus().toggleHeading({ level: 3 }).run()}
                                            >
                                                <Heading3 className="h-4 w-4" />
                                            </ToolbarButton>
                                            <ToolbarButton
                                                label="Bold"
                                                active={descriptionEditor?.isActive("bold")}
                                                disabled={isSubmitting || !descriptionEditor}
                                                onClick={() => descriptionEditor?.chain().focus().toggleBold().run()}
                                            >
                                                <Bold className="h-4 w-4" />
                                            </ToolbarButton>
                                            <ToolbarButton
                                                label="Italic"
                                                active={descriptionEditor?.isActive("italic")}
                                                disabled={isSubmitting || !descriptionEditor}
                                                onClick={() => descriptionEditor?.chain().focus().toggleItalic().run()}
                                            >
                                                <Italic className="h-4 w-4" />
                                            </ToolbarButton>
                                            <ToolbarButton
                                                label="Underline"
                                                active={descriptionEditor?.isActive("underline")}
                                                disabled={isSubmitting || !descriptionEditor}
                                                onClick={() => descriptionEditor?.chain().focus().toggleUnderline().run()}
                                            >
                                                <UnderlineIcon className="h-4 w-4" />
                                            </ToolbarButton>
                                            <ToolbarButton
                                                label="Set link"
                                                active={descriptionEditor?.isActive("link")}
                                                disabled={isSubmitting || !descriptionEditor}
                                                preserveSelection
                                                onClick={addOrEditLink}
                                            >
                                                <Link2 className="h-4 w-4" />
                                            </ToolbarButton>
                                            <ToolbarButton
                                                label="Remove link"
                                                disabled={isSubmitting || !descriptionEditor || !descriptionEditor?.isActive("link")}
                                                onClick={() => descriptionEditor?.chain().focus().extendMarkRange("link").unsetLink().run()}
                                            >
                                                <Unlink className="h-4 w-4" />
                                            </ToolbarButton>
                                        </div>
                                        <div className="rounded-2xl border border-[#d7e3e8] bg-white p-0.5 [&_.tiptap_h3]:text-base [&_.tiptap_h3]:font-bold [&_.tiptap_h3]:tracking-tight [&_.tiptap_p]:leading-6 [&_.tiptap_a]:text-[#0f6080] [&_.tiptap_a]:underline">
                                            <EditorContent editor={descriptionEditor} />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="video-status">Status</Label>
                                    <select
                                        id="video-status"
                                        value={formState.status}
                                        onChange={(event) => {
                                            const nextStatus = event.target.value === "published" ? "published" : "draft";
                                            setFormState((current) => ({ ...current, status: nextStatus }));
                                        }}
                                        disabled={isSubmitting}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    >
                                        <option value="draft">draft</option>
                                        <option value="published">published</option>
                                    </select>
                                </div>

                                {!isEditing && (
                                    <div className="space-y-2">
                                        <Label htmlFor="video-file">Video file (MP4)</Label>
                                        <Input
                                            id="video-file"
                                            type="file"
                                            accept="video/mp4"
                                            disabled={isSubmitting}
                                            onChange={(event) => {
                                                const file = event.target.files?.[0] ?? null;
                                                setFormState((current) => ({ ...current, selectedFile: file }));
                                            }}
                                        />
                                        <p className="text-xs text-[#5a7886]">Expected upload size: 14MB to 20MB.</p>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label>Select 2 or 3 tags</Label>
                                    <div className="rounded-xl border border-[#dbe6eb] bg-[#fbfdff] p-3">
                                        <p className="text-xs font-semibold text-[#5a7886]">
                                            Selected: {formState.selectedTagIds.length} / 3 (min 2) | Available in video_tag_reference: {tagOptions.length}
                                        </p>
                                        <div className="mt-3 space-y-3">
                                            {groupedTagOptions.map((group) => (
                                                <div key={group.category}>
                                                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#4f6f7f]">{group.category}</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {group.options.map((option) => {
                                                            const checked = formState.selectedTagIds.includes(option.id);
                                                            const tagLabel = option.tagName.trim().length > 0 ? option.tagName : "Untitled Tag";
                                                            return (
                                                                <button
                                                                    key={option.id}
                                                                    type="button"
                                                                    onClick={() => toggleTag(option.id)}
                                                                    disabled={isSubmitting}
                                                                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                                                                        checked
                                                                            ? "border-[#1f6789] bg-[#e2f4fe] text-[#0f4a65]"
                                                                            : "border-[#cadbe3] bg-white text-[#3f6172] hover:bg-[#f1f8fc]"
                                                                    }`}
                                                                >
                                                                    {tagLabel}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                            {groupedTagOptions.length === 0 && (
                                                <p className="text-xs text-[#6b8998]">No rows found in video_tag_reference.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {isSubmitting && (
                                    <div className="space-y-1">
                                        <div className="h-2 w-full overflow-hidden rounded-full bg-[#d8eef7]">
                                            <div
                                                className="h-full rounded-full bg-[linear-gradient(135deg,#005472_0%,#0a779f_55%,#59cdf7_100%)] transition-all duration-300"
                                                style={{ width: `${uploadProgress}%` }}
                                            />
                                        </div>
                                        <p className="text-xs font-semibold text-[#315363]">Uploading... {uploadProgress}%</p>
                                    </div>
                                )}
                            </div>

                            <DialogFooter className="flex-col gap-2 sm:flex-row sm:gap-0">
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    className="bg-[linear-gradient(135deg,#005472_0%,#0a779f_52%,#59cdf7_100%)] text-white"
                                    onClick={handleSaveVideo}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                    {isEditing ? "Save Changes" : "Upload And Save"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                        <DialogContent className="max-w-3xl">
                            <DialogHeader>
                                <DialogTitle>{previewVideo?.videoName ?? "Video Preview"}</DialogTitle>
                            </DialogHeader>
                            {previewVideo?.videoUrl ? (
                                <div className="overflow-hidden rounded-xl border border-[#dbe6eb] bg-black">
                                    <video
                                        controls
                                        preload="metadata"
                                        className="h-auto w-full"
                                        src={buildPlaybackUrl(previewVideo.videoUrl) ?? undefined}
                                    >
                                        Your browser does not support the video tag.
                                    </video>
                                </div>
                            ) : (
                                <p className="text-sm text-[#4b6a79]">No video file is linked for this entry.</p>
                            )}
                        </DialogContent>
                    </Dialog>
                </div>

                {isLoading ? (
                    <div className="flex items-center gap-2 text-sm text-[#4b6a79]">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading videos...
                    </div>
                ) : videos.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[#c8d8df] bg-[#f7fbfe] p-8 text-center text-[#4b6a79]">
                        <Video className="mx-auto mb-2 h-10 w-10 opacity-70" />
                        <p className="text-sm font-semibold">No videos have been added yet.</p>
                        <p className="text-xs">Click Add Video to upload your first support video.</p>
                    </div>
                ) : (
                    <>
                        <div className="space-y-3 md:hidden">
                            {videos.map((videoItem) => {
                                const playbackUrl = buildPlaybackUrl(videoItem.videoUrl);

                                return (
                                    <article key={videoItem.id} className="rounded-2xl border border-[#dbe6eb] bg-white p-4 shadow-[0_10px_32px_rgba(19,55,71,0.08)]">
                                        <div className="flex items-start justify-between gap-3">
                                            <h3 className="text-sm font-bold text-[#10364a]">{videoItem.videoName}</h3>
                                            <span className="rounded-full border border-[#cfe0e8] bg-[#f4f9fc] px-2 py-0.5 text-[11px] font-semibold capitalize text-[#2b5366]">
                                                {videoItem.status}
                                            </span>
                                        </div>
                                        <p className="mt-2 text-xs text-[#4b6a79]">
                                            Duration: {videoItem.durationMinutes} min | Updated: {videoItem.updatedAt ? new Date(videoItem.updatedAt).toLocaleDateString() : "-"}
                                        </p>
                                        <div className="mt-3 flex flex-wrap gap-1.5">
                                            {videoItem.tags.length === 0 ? (
                                                <span className="text-xs text-[#6b8998]">No tags</span>
                                            ) : (
                                                videoItem.tags.map((tag) => (
                                                    <span
                                                        key={`${videoItem.id}-${tag.id}`}
                                                        className="rounded-full border border-[#cfe0e8] bg-[#f4f9fc] px-2 py-0.5 text-xs"
                                                    >
                                                        {tag.category}: {tag.tagName}
                                                    </span>
                                                ))
                                            )}
                                        </div>
                                        <div className="mt-4 grid grid-cols-2 gap-2">
                                            {playbackUrl ? (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="h-8 border-[#bcd2dd] text-xs"
                                                    onClick={() => openPreview(videoItem)}
                                                >
                                                    Preview
                                                </Button>
                                            ) : (
                                                <span className="flex h-8 items-center rounded-md border border-dashed border-[#d6e3ea] px-2 text-xs text-[#6b8998]">
                                                    No file
                                                </span>
                                            )}
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="h-8 border-[#bcd2dd] text-xs"
                                                onClick={() => startEdit(videoItem)}
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="col-span-2 h-8 border-[#dcb9b9] text-xs text-[#8b2d2d]"
                                                onClick={() => handleDeleteVideo(videoItem.id)}
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>

                        <div className="hidden overflow-x-auto rounded-2xl border border-[#dbe6eb] md:block">
                        <table className="min-w-full divide-y divide-[#dbe6eb] bg-white text-sm">
                            <thead className="bg-[#f5fafc] text-left text-xs uppercase tracking-[0.14em] text-[#52707f]">
                                <tr>
                                    <th className="px-4 py-3">Name</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Duration</th>
                                    <th className="px-4 py-3">Tags</th>
                                    <th className="px-4 py-3">Updated</th>
                                    <th className="px-4 py-3">Playback</th>
                                    <th className="px-4 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#eef4f7] text-[#234556]">
                                {videos.map((videoItem) => {
                                    const playbackUrl = buildPlaybackUrl(videoItem.videoUrl);

                                    return (
                                        <tr key={videoItem.id}>
                                            <td className="px-4 py-3 font-semibold">{videoItem.videoName}</td>
                                            <td className="px-4 py-3">{videoItem.status}</td>
                                            <td className="px-4 py-3">{videoItem.durationMinutes} min</td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {videoItem.tags.length === 0 ? (
                                                        <span className="text-xs text-[#6b8998]">No tags</span>
                                                    ) : (
                                                        videoItem.tags.map((tag) => (
                                                            <span
                                                                key={`${videoItem.id}-${tag.id}`}
                                                                className="rounded-full border border-[#cfe0e8] bg-[#f4f9fc] px-2 py-0.5 text-xs"
                                                            >
                                                                {tag.category}: {tag.tagName}
                                                            </span>
                                                        ))
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">{videoItem.updatedAt ? new Date(videoItem.updatedAt).toLocaleDateString() : "-"}</td>
                                            <td className="px-4 py-3">
                                                {playbackUrl ? (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className="h-8 border-[#bcd2dd] text-xs"
                                                        onClick={() => openPreview(videoItem)}
                                                    >
                                                        Preview
                                                    </Button>
                                                ) : (
                                                    <span className="text-xs text-[#6b8998]">No file</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className="h-8 border-[#bcd2dd] text-xs"
                                                        onClick={() => startEdit(videoItem)}
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className="h-8 border-[#dcb9b9] text-xs text-[#8b2d2d]"
                                                        onClick={() => handleDeleteVideo(videoItem.id)}
                                                    >
                                                        Delete
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        </div>
                    </>
                )}
            </section>
        </div>
    );
}