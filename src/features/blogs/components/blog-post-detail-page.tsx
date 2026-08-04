"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { ArrowLeft, Heart, ThumbsDown, ThumbsUp } from "lucide-react";
import { toast } from "sonner";

import {
  addBlogCommentAction,
  deleteBlogPostAction,
  toggleBlogLikenessAction,
} from "@/app/(features)/(blogs)/blogs/actions";
import FeatureFaqHelp from "@/components/common/feature-faq-help";
import TipTapCommentEditor from "@/components/common/tiptap-comment-editor";
import StartDiscussionDialog from "@/components/discuss/start-discussion-dialog";
import TiptapRenderer from "@/components/discuss/tiptap-renderer";
import { BlogPostDetail } from "@/components/db/types/blogs";
import {
  createEmptyTipTapDocument,
  isSerializedTipTapDocumentEmpty,
  serializeTipTapDocument,
} from "@/components/db/types/poem-term-validation";
import { Button } from "@/components/ui/button";
import { extractS3KeyFromValue } from "@/lib/s3-object-key";

function formatDate(value: Date | null) {
  if (!value) {
    return "Not published";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

const EMPTY_COMMENT_JSON = serializeTipTapDocument(createEmptyTipTapDocument());

function BlogDetailCoverImage({ src, alt }: { src: string | null; alt: string | null }) {
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
    <div className="mt-4 overflow-hidden rounded-2xl border border-[#f3d0bf] bg-[#fffaf6] md:mt-0 md:flex-shrink-0 md:w-full lg:w-full">
      <Image
        src={ resolvedSrc }
        alt={ alt ?? "Blog cover image" }
        width={ 960 }
        height={ 540 }
        unoptimized
        className="h-44 w-full object-cover sm:h-56 md:h-72 lg:h-80"
      />
    </div>
  );
}

export function BlogPostDetailPage({
  initialPost,
  memberId,
  isFounder,
}: {
  initialPost: BlogPostDetail;
  memberId: number;
  isFounder?: boolean;
}) {
  const router = useRouter();
  const [post, setPost] = useState<BlogPostDetail>(initialPost);
  const [commentText, setCommentText] = useState<string>(EMPTY_COMMENT_JSON);
  const [isSubmitting, startSubmittingTransition] = useTransition();

  const isAuthor = post.authorMemberId === memberId;
  const canEdit = isAuthor || Boolean(isFounder);
  const canDelete = Boolean(isFounder) && !isAuthor;
  const canReact = !isAuthor;
  const canComment = !isAuthor;
  const canStartDiscussion = true;

  function handleReaction(likenessDegree: -1 | 1 | 2) {
    if (!canReact) {
      toast.error("You cannot react to your own blog post.");
      return;
    }

    startSubmittingTransition(async () => {
      const result = await toggleBlogLikenessAction({
        blogPostId: post.id,
        likenessDegree,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      setPost(result.post);
      toast.success(result.message);
      router.refresh();
    });
  }

  function handleAddComment() {
    if (!canComment) {
      toast.error("You cannot comment on your own blog post.");
      return;
    }

    if (isSerializedTipTapDocumentEmpty(commentText)) {
      toast.error("Comment cannot be empty.");
      return;
    }

    startSubmittingTransition(async () => {
      const result = await addBlogCommentAction({
        blogPostId: post.id,
        commentText,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      setPost(result.post);
      setCommentText(EMPTY_COMMENT_JSON);
      toast.success(result.message);
      router.refresh();
    });
  }

  function handleDeletePost() {
    if (!window.confirm("Delete this blog post? This cannot be undone.")) {
      return;
    }

    startSubmittingTransition(async () => {
      const result = await deleteBlogPostAction({ blogPostId: post.id });

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
        <div className="rounded-3xl border border-[#f5d4c2] bg-[linear-gradient(135deg,#fff4eb,#fde6d8_50%,#f7c5ad)] p-6 shadow-[0_16px_40px_rgba(183,109,104,0.14)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              {/* <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8a4d45]">{post.status}</p> */}
              <h1 className="mt-2 text-3xl font-black tracking-tight text-[#7a3e3a]">{post.title}</h1>
              <div className="mt-3 flex justify-start">
                <Button asChild variant="outline" className="rounded-full border-[#f2c2ab] text-[#8a4d45] hover:bg-[#fff3ea]">
                  <Link href="/blogs" className="inline-flex items-center gap-1.5">
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    Back to Blogs
                  </Link>
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {canEdit ? (
                <Button asChild variant="outline" className="rounded-full border-[#f2c2ab] text-[#8a4d45] hover:bg-[#fff3ea]">
                  <Link href={ `/blogs/edit/${post.id}` }>Edit</Link>
                </Button>
              ) : null}
              {canDelete ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={ handleDeletePost }
                  disabled={ isSubmitting }
                  className="rounded-full border-[#e3b7b7] text-[#8a3e3e] hover:bg-[#fff3f3]"
                >
                  Delete
                </Button>
              ) : null}
            </div>
          </div>
          {post.excerpt ? (
            <p className="mt-4 text-sm leading-6 text-[#8a4d45]">{post.excerpt}</p>
          ) : null}
        </div>

        <section className="rounded-2xl border border-[#f5d4c2] bg-[#fff8f2] px-5 py-3 shadow-xs">
          <p className="text-sm font-semibold text-[#9a5a4f]">By {post.authorName} • {formatDate(post.publishedAt ?? post.createdAt)}</p>
        </section>

        <article className="rounded-2xl border border-[#f5d4c2] bg-white p-5 shadow-xs">
          <div className="min-w-0">
            <TiptapRenderer contentJson={ post.contentJson } />
          </div>
        </article>

        <div className="grid gap-4 md:grid-cols-2">
          <section className="rounded-2xl border border-[#f5d4c2] bg-[#fff8f2] p-5 shadow-xs">
            <div className="min-w-0">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#8a4d45]">Blog Tags</p>
              <div className="mt-2">
                {post.selectedTagNames.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-[#f2c6b0] bg-white px-3 py-2 text-sm text-[#9a5a4f]">
                    No tags were selected for this blog post.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {post.selectedTagNames.map((tagName) => (
                      <span
                        key={ tagName }
                        className="inline-flex items-center rounded-full border border-[#f3c1a9] bg-[#fff1e9] px-3 py-1 text-xs font-semibold text-[#8a4d45]"
                      >
                        {tagName}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {post.coverImageS3Key ? (
            <section className="rounded-2xl border border-[#f5d4c2] bg-[#fff8f2] p-5 shadow-xs">
              <div className="space-y-3">
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#8a4d45]">Uploaded Cover</p>
                {post.coverImageAlt ? (
                  <p className="text-sm text-[#9a5a4f]">{post.coverImageAlt}</p>
                ) : null}
                <BlogDetailCoverImage src={ post.coverImageS3Key } alt={ post.coverImageAlt } />
              </div>
            </section>
          ) : null}
        </div>

        {!isAuthor ? (
          <section className="rounded-2xl border border-[#f5d4c2] bg-[#fff8f2] p-5 shadow-xs">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#8a4d45]">Reactions</p>
            {canReact ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={ post.userLikenessDegree === 2 ? "default" : "outline" }
                  disabled={ isSubmitting }
                  onClick={ () => handleReaction(2) }
                  className="rounded-full"
                  aria-label="React with love"
                >
                  <Heart className={ `size-4 ${ post.userLikenessDegree === 2 ? "fill-current" : "" }` } />
                  <span className="ml-1">{post.loveCount}</span>
                </Button>
                <Button
                  type="button"
                  variant={ post.userLikenessDegree === 1 ? "default" : "outline" }
                  disabled={ isSubmitting }
                  onClick={ () => handleReaction(1) }
                  className="rounded-full"
                  aria-label="React with like"
                >
                  <ThumbsUp className={ `size-4 ${ post.userLikenessDegree === 1 ? "fill-current" : "" }` } />
                  <span className="ml-1">{post.likeCount}</span>
                </Button>
                <Button
                  type="button"
                  variant={ post.userLikenessDegree === -1 ? "default" : "outline" }
                  disabled={ isSubmitting }
                  onClick={ () => handleReaction(-1) }
                  className="rounded-full"
                  aria-label="React with dislike"
                >
                  <ThumbsDown className={ `size-4 ${ post.userLikenessDegree === -1 ? "fill-current" : "" }` } />
                  <span className="ml-1">{post.dislikeCount}</span>
                </Button>
              </div>
            ) : (
              <p className="mt-3 text-sm text-[#9a5a4f]">You cannot react to your own blog post.</p>
            )}
          </section>
        ) : null}

        <section className="space-y-3 rounded-[1.4rem] border border-[#f5d4c2] bg-[#fff8f2] p-4">
          <div>
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#8a4d45]">Family Comments</p>
            <p className="text-xs text-[#9a5a4f]">Share your thoughts about this blog post with your family.</p>
          </div>

          <div className="space-y-2">
            {post.comments.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-[#f2c6b0] bg-white px-3 py-2 text-sm text-[#9a5a4f]">
                No comments yet. Be the first family member to add one.
              </p>
            ) : (
              post.comments.map((comment) => (
                <article key={ comment.id } className="rounded-2xl border border-[#f5d4c2] bg-white px-3 py-3 text-sm text-[#8a4d45]">
                  <TiptapRenderer contentJson={ comment.contentJson } />
                  <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[#a16051]">
                    {comment.commenterName} • {formatDate(comment.createdAt)}
                  </p>
                </article>
              ))
            )}
          </div>

          {isAuthor ? null : canComment ? (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#7a3e3a]" htmlFor="blog-comment-input-detail">
                Add Comment
              </label>
              <div id="blog-comment-input-detail">
                <TipTapCommentEditor
                  value={ commentText }
                  onChange={ setCommentText }
                  placeholder="What did you think about this blog post?"
                  disabled={ isSubmitting }
                  toolbarClassName="border-[#f5d4c2] bg-[#fff3ea]"
                  editorClassName="border-[#f5d4c2] text-[#6a3f39]"
                  buttonClassName="border-[#f3c1a9] text-[#8a4d45]"
                  activeButtonClassName="border-[#b76d68] bg-[#fde0d2] text-[#7a3e3a]"
                />
              </div>
              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={ handleAddComment }
                  disabled={ isSubmitting || isSerializedTipTapDocumentEmpty(commentText) }
                  className="rounded-full bg-[#b76d68] text-white hover:bg-[#9d5954]"
                >
                  {isSubmitting ? "Posting..." : "Post Comment"}
                </Button>
              </div>
            </div>
          ) : null}
        </section>

        <section className="space-y-3 rounded-4xl border border-[#f5d4c2] bg-[#fff8f2] p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[#9a5a4f]">
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#8a4d45]">Discussion Threads</p>
                <FeatureFaqHelp
                  href="/feature-faq?category=Discussion%20Groups"
                  buttonClassName="h-4 w-4 md:h-7 md:w-7 rounded-xl border-[#f3c1a9] bg-gradient-to-b from-[#fff7f2] to-[#fde0d2] text-[#8a4d45] shadow-[0_8px_18px_rgba(183,109,104,0.16)] group-hover:shadow-[0_12px_26px_rgba(183,109,104,0.24)]"
                  iconClassName="h-3 w-3 md:h-4 md:w-4 text-[#8a4d45]"
                  tooltipClassName="bg-[#7a3e3a] text-[#fff7f2]"
                />
              </div>
              <p className="text-xs text-[#9a5a4f]">Follow the conversation that belongs to this blog post.</p>
            </div>

            {canStartDiscussion ? (
              <StartDiscussionDialog
                targetType="blog"
                targetId={ post.id }
                topicLabel={ `${ post.title } Discussion ${ post.discussionThreads.length + 1 }` }
                revalidatePaths={ ["/blogs", `/blogs/${ post.slug }`] }
                onSuccessRoute="/blogs/discussions/:threadId"
                disabled={ isSubmitting }
                triggerLabel="Add Discussion"
                triggerClassName="rounded-full bg-[#b76d68] px-4 text-xs font-semibold text-white hover:bg-[#9d5954]"
              />
            ) : null}
          </div>

          {!canStartDiscussion ? (
            <p className="rounded-2xl border border-dashed border-[#f2c6b0] bg-white px-3 py-2 text-sm text-[#9a5a4f]">
              You cannot create a discussion for your own blog post.
            </p>
          ) : null}

          {post.discussionThreads.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#f2c6b0] bg-white px-3 py-3 text-sm text-[#9a5a4f]">
              <p>No discussion threads have been added for this blog post yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {post.discussionThreads.map((discussionThread) => (
                <article key={ discussionThread.id } className="rounded-2xl border border-[#f5d4c2] bg-white px-4 py-4 text-sm text-[#8a4d45] shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1 flex-1">
                      <p className="text-base font-bold leading-snug text-[#7a3e3a]">{discussionThread.discussTopic}</p>
                      <p className="text-xs uppercase tracking-[0.16em] text-[#a16051]">
                        {discussionThread.memberFirstName} • {formatDate(discussionThread.createdAt)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 shrink-0">
                      {discussionThread.dislikeCount > 0 || discussionThread.likeCount > 0 || discussionThread.loveCount > 0 ? (
                        <div className="flex flex-wrap items-center gap-2">
                          {discussionThread.dislikeCount > 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#f8ebe6] px-2 py-1 text-[0.65rem] font-semibold text-[#8a4d45]">
                              Dislike {discussionThread.dislikeCount}
                            </span>
                          ) : null}
                          {discussionThread.likeCount > 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#fff1e9] px-2 py-1 text-[0.65rem] font-semibold text-[#8a4d45]">
                              Like {discussionThread.likeCount}
                            </span>
                          ) : null}
                          {discussionThread.loveCount > 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#fde4ee] px-2 py-1 text-[0.65rem] font-semibold text-[#aa3368]">
                              Love {discussionThread.loveCount}
                            </span>
                          ) : null}
                        </div>
                      ) : null}

                      <Button
                        type="button"
                        variant="outline"
                        asChild
                        className="shrink-0 rounded-full border-[#f3c1a9] bg-white px-4 text-xs font-semibold text-[#7a3e3a] hover:bg-[#fff3ea]"
                      >
                        <Link href={ `/blogs/discussions/${ discussionThread.id }` }>
                          View
                        </Link>
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
