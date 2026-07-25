"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { ArrowLeft } from "lucide-react";
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

    startSaveTransition(async () => {
      const result = await saveBlogPostAction({
        id: initialPost?.id,
        title,
        contentJson,
        status,
        allowComments: true,
        selectedTagIds,
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
        <div className="rounded-3xl border border-[#d8e7cf] bg-[linear-gradient(135deg,#f5fbe8,#eef8df_55%,#e2f0cc)] p-6 shadow-sm">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#5a7d42]">Family Blog</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-[#2f4820]">
              {isEditing ? "Edit blog post" : "Write a new blog post"}
            </h1>
            <div className="mt-3 flex justify-start">
              <Button asChild variant="outline" className="rounded-full border-[#bad1aa] text-[#355e24] hover:bg-[#f2f9eb]">
                <Link href="/blogs" className="inline-flex items-center gap-1.5">
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  Back to Blogs
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-5 rounded-2xl border border-[#d8e7cf] bg-white p-5 shadow-xs">
          <div className="space-y-2">
            <label htmlFor="blog-title" className="text-sm font-semibold text-[#355228]">Title</label>
            <Input
              id="blog-title"
              value={ title }
              onChange={ (event) => setTitle(event.target.value) }
              placeholder="Post title"
              disabled={ isSaving || isDeleting || !canEdit }
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="blog-content" className="text-sm font-semibold text-[#355228]">Content</label>
            <TipTapAlbumEditor
              value={ contentJson }
              onChange={ setContentJson }
              placeholder="Write your post body"
              disabled={ isSaving || isDeleting || !canEdit }
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="blog-status" className="text-sm font-semibold text-[#355228]">Status</label>
            <select
              id="blog-status"
              value={ status }
              onChange={ (event) => setStatus(event.target.value as BlogPostStatus) }
              disabled={ isSaving || isDeleting || !canEdit }
              className="h-10 w-full rounded-md border border-[#d5e4cc] bg-white px-3 text-sm text-[#355228]"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-[#355228]">Tags</p>
            <div className="space-y-3">
              {groupedTags.length === 0 ? (
                <p className="text-sm text-[#5a7450]">No tags available yet.</p>
              ) : (
                groupedTags.map((group) => (
                  <div key={ group.category } className="rounded-xl border border-[#e2eed8] bg-[#fdfef9] p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6b865b]">{group.category}</p>
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
                                ? "border-[#3d6e2c] bg-[#e8f6dd] text-[#244419]"
                                : "border-[#c9dcc0] bg-white text-[#4a6840] hover:bg-[#f3faec]",
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
              className="rounded-full bg-[#3f6f2d] text-white hover:bg-[#315722]"
            >
              {isSaving ? "Saving..." : isEditing ? "Update post" : "Create post"}
            </Button>
            {isEditing ? (
              <Button
                asChild
                type="button"
                variant="outline"
                className="rounded-full border-[#bad1aa] text-[#355e24] hover:bg-[#f2f9eb]"
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
                className="rounded-full border-[#d9b6b6] text-[#7d2f2f] hover:bg-[#fff3f3]"
              >
                {isDeleting ? "Deleting..." : "Delete post"}
              </Button>
            ) : null}
            {!canEdit ? (
              <p className="text-sm text-[#7f4f4f]">You are in read-only mode for this post.</p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
