"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { ArrowLeft, Loader2, Upload, XCircle } from "lucide-react";
import { toast } from "sonner";

import { deleteBlogPostAction, saveBlogPostAction } from "@/app/(features)/(blogs)/blogs/actions";
import TipTapAlbumEditor from "@/components/common/tiptap-album-editor";
import { BlogPostDetail, BlogTagOption, BlogPostStatus } from "@/components/db/types/blogs";
import {
  createEmptyTipTapDocument,
  isSerializedTipTapDocumentEmpty,
  serializeTipTapDocument,
} from "@/components/db/types/poem-term-validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resolveBlogCoverImageState } from "@/features/blogs/utils/blog-cover-image";
import { extractS3KeyFromValue } from "@/lib/s3-object-key";

function BlogEditorCoverImagePreview({ src, alt }: { src: string | null; alt: string | null }) {
  const [resolvedSrc, setResolvedSrc] = useState(src);

  useEffect(() => {
    let isCancelled = false;

    const resolveSignedUrl = async () => {
      if (!src) {
        if (!isCancelled) {
          setResolvedSrc(null);
        }
        return;
      }

      const key = extractS3KeyFromValue(src);
      if (!key) {
        if (!isCancelled) {
          setResolvedSrc(src);
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
            setResolvedSrc(src);
          }
          return;
        }

        const body = await response.json();
        if (!isCancelled) {
          setResolvedSrc(body.url ?? src);
        }
      } catch {
        if (!isCancelled) {
          setResolvedSrc(src);
        }
      }
    };

    void resolveSignedUrl();

    return () => {
      isCancelled = true;
    };
  }, [src]);

  if (!resolvedSrc) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#f3d0bf] bg-[#fffaf6]">
      <Image
        src={ resolvedSrc }
        alt={ alt ?? "Blog cover image" }
        width={ 960 }
        height={ 480 }
        unoptimized
        className="h-48 w-full object-cover"
      />
    </div>
  );
}

export function BlogPostEditorPage({
  blogTags,
  initialPost,
  memberId,
  mode,
}: {
  blogTags: BlogTagOption[];
  initialPost?: BlogPostDetail;
  memberId: number;
  mode: "add" | "edit";
}) {
  const router = useRouter();
  const [isSaving, startSaveTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();

  const isEditing = mode === "edit";

  const [title, setTitle] = useState(initialPost?.title ?? "");
  const [contentJson, setContentJson] = useState(
    initialPost?.contentJson ?? serializeTipTapDocument(createEmptyTipTapDocument()),
  );
  const [status, setStatus] = useState<BlogPostStatus>(initialPost?.status ?? "draft");
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(initialPost?.selectedTagIds ?? []);
  const [coverImageS3Key, setCoverImageS3Key] = useState<string | null>(initialPost?.coverImageS3Key ?? null);
  const [coverImageAlt, setCoverImageAlt] = useState(initialPost?.coverImageAlt ?? "");
  const [selectedCoverImageFile, setSelectedCoverImageFile] = useState<File | null>(null);
  const [isUploadingCoverImage, setIsUploadingCoverImage] = useState(false);
  const [coverImageUploadName, setCoverImageUploadName] = useState<string | null>(null);

  const canEdit = !initialPost || initialPost.authorMemberId === memberId;
  const canDelete = initialPost?.authorMemberId === memberId;

  const groupedTags = useMemo(() => {
    const grouped = new Map<string, BlogTagOption[]>();

    for (const tag of blogTags) {
      const existing = grouped.get(tag.category) ?? [];
      existing.push(tag);
      grouped.set(tag.category, existing);
    }

    return [...grouped.entries()].map(([category, tags]) => ({
      category,
      tags: [...tags].sort((leftTag, rightTag) => leftTag.seqNo - rightTag.seqNo || leftTag.tagName.localeCompare(rightTag.tagName)),
    }));
  }, [blogTags]);

  function toggleTag(tagId: number) {
    setSelectedTagIds((previousTagIds) => (
      previousTagIds.includes(tagId)
        ? previousTagIds.filter((existingTagId) => existingTagId !== tagId)
        : [...previousTagIds, tagId]
    ));
  }

  function handleCoverImageSelection(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      toast.error('Only PNG and JPEG images are supported for blog cover photos.');
      event.target.value = '';
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      toast.error('Cover image exceeds 4MB. Please choose a smaller file.');
      event.target.value = '';
      return;
    }

    setSelectedCoverImageFile(file);
    setCoverImageUploadName(file.name);
  }

  async function handleUploadCoverImage() {
    if (!selectedCoverImageFile) {
      toast.error('Choose a cover image before uploading.');
      return;
    }

    try {
      setIsUploadingCoverImage(true);
      const extension = selectedCoverImageFile.type === 'image/png' ? 'png' : 'jpg';
      const safeTitle = title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'blog-post';
      const fileName = `blog-${ safeTitle }-${ Date.now() }.${ extension }`;

      const signResponse = await fetch('/api/s3-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'upload',
          folder: 'blogs',
          fileName,
          contentType: selectedCoverImageFile.type,
          uploadTransport: 'proxy',
        }),
      });

      if (!signResponse.ok) {
        throw new Error('Could not create a signed upload URL for the cover image.');
      }

      const body = await signResponse.json();
      const uploadResponse = await fetch(body.url, {
        method: 'PUT',
        headers: { 'Content-Type': body.signedContentType ?? selectedCoverImageFile.type },
        body: selectedCoverImageFile,
      });

      if (!uploadResponse.ok) {
        throw new Error('The cover image upload failed.');
      }

      const nextCoverImageS3Key = extractS3KeyFromValue(body.s3Key ?? body.fileUrl) ?? null;
      if (!nextCoverImageS3Key) {
        throw new Error('The cover image upload did not return a valid S3 key.');
      }

      setCoverImageS3Key(nextCoverImageS3Key);
      setSelectedCoverImageFile(null);
      setCoverImageUploadName(null);
      if (!coverImageAlt.trim() && title.trim()) {
        setCoverImageAlt(title.trim());
      }
      toast.success('Cover image uploaded successfully.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Cover image upload failed.');
    } finally {
      setIsUploadingCoverImage(false);
    }
  }

  function handleRemoveCoverImage() {
    setCoverImageS3Key(null);
    setSelectedCoverImageFile(null);
    setCoverImageUploadName(null);
  }

  function handleSave() {
    if (!canEdit) {
      toast.error("You cannot edit this blog post.");
      return;
    }

    if (title.trim().length < 2) {
      toast.error("Blog title must be at least 2 characters.");
      return;
    }

    if (isSerializedTipTapDocumentEmpty(contentJson)) {
      toast.error("Blog content must be at least 2 characters.");
      return;
    }

    const coverImageValidation = resolveBlogCoverImageState({
      coverImageS3Key,
      coverImageAlt,
      title,
    });

    if (coverImageValidation.error) {
      toast.error(coverImageValidation.error);
      return;
    }

    startSaveTransition(async () => {
      const result = await saveBlogPostAction({
        id: initialPost?.id,
        title,
        contentJson,
        status,
        allowComments: true,
        selectedTagIds,
        coverImageS3Key: coverImageS3Key ?? null,
        coverImageAlt: coverImageValidation.altText.trim() || null,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.push("/blogs");
      router.refresh();
    });
  }

  function handleDelete() {
    if (!initialPost || !canDelete) {
      toast.error("You cannot delete this blog post.");
      return;
    }

    if (!window.confirm("Delete this blog post? This cannot be undone.")) {
      return;
    }

    startDeleteTransition(async () => {
      const result = await deleteBlogPostAction({ blogPostId: initialPost.id });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.push("/blogs");
      router.refresh();
    });
  }

  return (
    <section className="font-app w-full px-4 pb-10 pt-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-3xl border border-[#f5d4c2] bg-[linear-gradient(135deg,#fff4eb,#fde6d8_55%,#f7c5ad)] p-6 shadow-[0_16px_40px_rgba(183,109,104,0.14)]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8a4d45]">Family Blog</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-[#7a3e3a]">
              {isEditing ? "Edit blog post" : "Write a new blog post"}
            </h1>
            <div className="mt-3 flex justify-start">
              <Button asChild variant="outline" className="rounded-full border-[#f2c2ab] text-[#8a4d45] hover:bg-[#fff3ea]">
                <Link href="/blogs" className="inline-flex items-center gap-1.5">
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  Back to Blogs
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-5 rounded-2xl border border-[#f5d4c2] bg-white p-5 shadow-xs">
          <div className="space-y-2">
            <label htmlFor="blog-title" className="text-sm font-semibold text-[#7a3e3a]">Title</label>
            <Input
              id="blog-title"
              value={ title }
              onChange={ (event) => setTitle(event.target.value) }
              placeholder="Post title"
              disabled={ isSaving || isDeleting || !canEdit }
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="blog-content" className="text-sm font-semibold text-[#7a3e3a]">Content</label>
            <TipTapAlbumEditor
              value={ contentJson }
              onChange={ setContentJson }
              placeholder="Write your post body"
              disabled={ isSaving || isDeleting || !canEdit }
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="blog-status" className="text-sm font-semibold text-[#7a3e3a]">Status</label>
            <select
              id="blog-status"
              value={ status }
              onChange={ (event) => setStatus(event.target.value as BlogPostStatus) }
              disabled={ isSaving || isDeleting || !canEdit }
              className="h-10 w-full rounded-md border border-[#f2c2ab] bg-white px-3 text-sm text-[#7a3e3a]"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="space-y-3 rounded-2xl border border-[#f3d0bf] bg-[#fffaf6] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-[#7a3e3a]">Cover image</p>
                <p className="text-sm text-[#9a5a4f]">Optional. If you add a cover image, provide alt text or let it default to the title.</p>
              </div>
              {coverImageS3Key ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={ handleRemoveCoverImage }
                  disabled={ isSaving || isDeleting || !canEdit }
                  className="rounded-full border-[#f2c2ab] text-[#8a4d45] hover:bg-[#fff3ea]"
                >
                  <XCircle className="mr-2 h-4 w-4" /> Remove
                </Button>
              ) : null}
            </div>

            <div className="space-y-2">
              <label htmlFor="blog-cover-image" className="text-sm font-semibold text-[#7a3e3a]">Upload cover image</label>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  id="blog-cover-image"
                  type="file"
                  accept="image/png, image/jpeg"
                  onChange={ handleCoverImageSelection }
                  disabled={ isSaving || isDeleting || !canEdit || isUploadingCoverImage }
                  className="h-auto p-2"
                />
                <Button
                  type="button"
                  onClick={ handleUploadCoverImage }
                  disabled={ isSaving || isDeleting || !canEdit || isUploadingCoverImage || !selectedCoverImageFile }
                  className="rounded-full bg-[#b76d68] text-white hover:bg-[#9d5954]"
                >
                  {isUploadingCoverImage ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  {isUploadingCoverImage ? 'Uploading...' : 'Upload'}
                </Button>
              </div>
              {coverImageUploadName ? (
                <p className="text-sm text-[#8a4d45]">Selected file: {coverImageUploadName}</p>
              ) : null}
              {coverImageS3Key ? (
                <p className="text-sm text-[#8a4d45]">Current cover image is attached.</p>
              ) : null}
            </div>

            {coverImageS3Key ? (
              <BlogEditorCoverImagePreview src={ coverImageS3Key } alt={ coverImageAlt || title.trim() || null } />
            ) : null}

            <div className="space-y-2">
              <label htmlFor="blog-cover-alt" className="text-sm font-semibold text-[#7a3e3a]">Alt text</label>
              <Input
                id="blog-cover-alt"
                value={ coverImageAlt }
                onChange={ (event) => setCoverImageAlt(event.target.value) }
                placeholder={title.trim() ? title.trim() : 'Describe the cover image'}
                disabled={ isSaving || isDeleting || !canEdit }
              />
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-[#7a3e3a]">Tags</p>
            <div className="space-y-3">
              {groupedTags.length === 0 ? (
                <p className="text-sm text-[#9a5a4f]">No tags available yet.</p>
              ) : (
                groupedTags.map((group) => (
                  <div key={ group.category } className="rounded-xl border border-[#f3d0bf] bg-[#fffaf6] p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#a16051]">{group.category}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {group.tags.map((tag) => {
                        const selected = selectedTagIds.includes(tag.id);

                        return (
                          <button
                            key={ tag.id }
                            type="button"
                            onClick={ () => toggleTag(tag.id) }
                            disabled={ isSaving || isDeleting || !canEdit }
                            className={ [
                              "rounded-full border px-3 py-1 text-xs font-semibold transition",
                              selected
                                ? "border-[#b76d68] bg-[#fde0d2] text-[#7a3e3a]"
                                : "border-[#f3c1a9] bg-white text-[#8a4d45] hover:bg-[#fff3ea]",
                            ].join(" ") }
                          >
                            {tag.tagName}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <Button
              type="button"
              onClick={ handleSave }
              disabled={ isSaving || isDeleting || !canEdit }
              className="rounded-full bg-[#b76d68] text-white hover:bg-[#9d5954]"
            >
              {isSaving ? "Saving..." : isEditing ? "Update post" : "Create post"}
            </Button>
            {isEditing ? (
              <Button
                asChild
                type="button"
                variant="outline"
                className="rounded-full border-[#f2c2ab] text-[#8a4d45] hover:bg-[#fff3ea]"
                disabled={ isSaving || isDeleting }
              >
                <Link href="/blogs">Cancel</Link>
              </Button>
            ) : null}
            {isEditing && canDelete ? (
              <Button
                type="button"
                variant="outline"
                onClick={ handleDelete }
                disabled={ isSaving || isDeleting }
                className="rounded-full border-[#e3b7b7] text-[#8a3e3e] hover:bg-[#fff3f3]"
              >
                {isDeleting ? "Deleting..." : "Delete post"}
              </Button>
            ) : null}
            {!canEdit ? (
              <p className="text-sm text-[#9f5b4f]">You are in read-only mode for this post.</p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
