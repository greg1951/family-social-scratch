"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
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
        <div className="rounded-3xl border border-[#d8e7cf] bg-[linear-gradient(135deg,#f5fbe8,#eef8df_50%,#e2f0cc)] p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#5a7d42]">{post.status}</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-[#2f4820]">{post.title}</h1>
              <div className="mt-3 flex justify-start">
                <Button asChild variant="outline" className="rounded-full border-[#bad1aa] text-[#355e24] hover:bg-[#f2f9eb]">
                  <Link href="/blogs" className="inline-flex items-center gap-1.5">
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    Back to Blogs
                  </Link>
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {canEdit ? (
                <Button asChild variant="outline" className="rounded-full border-[#bad1aa] text-[#355e24] hover:bg-[#f2f9eb]">
                  <Link href={ `/blogs/edit/${post.id}` }>Edit</Link>
                </Button>
              ) : null}
              {canDelete ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={ handleDeletePost }
                  disabled={ isSubmitting }
                  className="rounded-full border-[#d9b6b6] text-[#7d2f2f] hover:bg-[#fff3f3]"
                >
                  Delete
                </Button>
              ) : null}
            </div>
          </div>
          {post.excerpt ? (
            <p className="mt-4 text-sm leading-6 text-[#3f5634]">{post.excerpt}</p>
          ) : null}
        </div>

        <section className="rounded-2xl border border-[#d8e7cf] bg-[#f7fcea] px-5 py-3 shadow-xs">
          <p className="text-sm font-semibold text-[#4d6640]">By {post.authorName} • {formatDate(post.publishedAt ?? post.createdAt)}</p>
        </section>

        <article className="rounded-2xl border border-[#d8e7cf] bg-white p-5 shadow-xs">
          <TiptapRenderer contentJson={ post.contentJson } />
        </article>

        <section className="rounded-2xl border border-[#d8e7cf] bg-[#f7fcea] p-5 shadow-xs">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#5a7d42]">Blog Tags</p>
          <div className="mt-2">
            {post.selectedTagNames.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-[#cadfbb] bg-white px-3 py-2 text-sm text-[#5a7450]">
                No tags were selected for this blog post.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {post.selectedTagNames.map((tagName) => (
                  <span
                    key={ tagName }
                    className="inline-flex items-center rounded-full border border-[#c7ddbc] bg-[#eef8df] px-3 py-1 text-xs font-semibold text-[#355e24]"
                  >
                    {tagName}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-[#d8e7cf] bg-[#f7fcea] p-5 shadow-xs">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#5a7d42]">Reactions</p>
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
            <p className="mt-3 text-sm text-[#5a7450]">You cannot react to your own blog post.</p>
          )}
        </section>

        <section className="space-y-3 rounded-[1.4rem] border border-[#d8e7cf] bg-[#f7fcea] p-4">
          <div>
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#5a7d42]">Family Comments</p>
            <p className="text-xs text-[#5a7450]">Share your thoughts about this blog post with your family.</p>
          </div>

          <div className="space-y-2">
            {post.comments.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-[#cadfbb] bg-white px-3 py-2 text-sm text-[#5a7450]">
                No comments yet. Be the first family member to add one.
              </p>
            ) : (
              post.comments.map((comment) => (
                <article key={ comment.id } className="rounded-2xl border border-[#d8e7cf] bg-white px-3 py-3 text-sm text-[#3f5634]">
                  <TiptapRenderer contentJson={ comment.contentJson } />
                  <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[#678057]">
                    {comment.commenterName} • {formatDate(comment.createdAt)}
                  </p>
                </article>
              ))
            )}
          </div>

          {isAuthor ? (
            <p className="rounded-2xl border border-dashed border-[#cadfbb] bg-white px-3 py-2 text-sm text-[#5a7450]">
              Your blog accepts comments from other family members. You cannot comment on your own post.
            </p>
          ) : canComment ? (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#355228]" htmlFor="blog-comment-input-detail">
                Add Comment
              </label>
              <div id="blog-comment-input-detail">
                <TipTapCommentEditor
                  value={ commentText }
                  onChange={ setCommentText }
                  placeholder="What did you think about this blog post?"
                  disabled={ isSubmitting }
                  toolbarClassName="border-[#d8e7cf] bg-[#f0f8e6]"
                  editorClassName="border-[#d8e7cf] text-[#29401f]"
                  buttonClassName="border-[#c7ddbc] text-[#46653a]"
                  activeButtonClassName="border-[#3d6e2c] bg-[#e8f6dd] text-[#244419]"
                />
              </div>
              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={ handleAddComment }
                  disabled={ isSubmitting || isSerializedTipTapDocumentEmpty(commentText) }
                  className="rounded-full bg-[#3f6f2d] text-white hover:bg-[#315722]"
                >
                  {isSubmitting ? "Posting..." : "Post Comment"}
                </Button>
              </div>
            </div>
          ) : null}
        </section>

        <section className="space-y-3 rounded-4xl border border-[#d8e7cf] bg-[#f7fcea] p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[#5a7450]">
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#5a7d42]">Discussion Threads</p>
                <FeatureFaqHelp
                  href="/feature-faq?category=Discussion%20Groups"
                  buttonClassName="h-4 w-4 md:h-7 md:w-7 rounded-xl border-[#c7ddbc] bg-gradient-to-b from-[#f8fdf2] to-[#e8f6dd] text-[#3f6f2d] shadow-[0_8px_18px_rgba(63,111,45,0.2)] group-hover:shadow-[0_12px_26px_rgba(63,111,45,0.3)]"
                  iconClassName="h-3 w-3 md:h-4 md:w-4 text-[#3f6f2d]"
                  tooltipClassName="bg-[#2f4820] text-[#f5fbe8]"
                />
              </div>
              <p className="text-xs text-[#5a7450]">Follow the conversation that belongs to this blog post.</p>
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
                triggerClassName="rounded-full bg-[#3f6f2d] px-4 text-xs font-semibold text-white hover:bg-[#315722]"
              />
            ) : null}
          </div>

          {!canStartDiscussion ? (
            <p className="rounded-2xl border border-dashed border-[#cadfbb] bg-white px-3 py-2 text-sm text-[#5a7450]">
              You cannot create a discussion for your own blog post.
            </p>
          ) : null}

          {post.discussionThreads.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#cadfbb] bg-white px-3 py-3 text-sm text-[#5a7450]">
              <p>No discussion threads have been added for this blog post yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {post.discussionThreads.map((discussionThread) => (
                <article key={ discussionThread.id } className="rounded-2xl border border-[#d8e7cf] bg-white px-4 py-4 text-sm text-[#3f5634] shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1 flex-1">
                      <p className="text-base font-bold leading-snug text-[#2f4820]">{discussionThread.discussTopic}</p>
                      <p className="text-xs uppercase tracking-[0.16em] text-[#678057]">
                        {discussionThread.memberFirstName} • {formatDate(discussionThread.createdAt)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 shrink-0">
                      {discussionThread.dislikeCount > 0 || discussionThread.likeCount > 0 || discussionThread.loveCount > 0 ? (
                        <div className="flex flex-wrap items-center gap-2">
                          {discussionThread.dislikeCount > 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#efebe8] px-2 py-1 text-[0.65rem] font-semibold text-[#4f433d]">
                              Dislike {discussionThread.dislikeCount}
                            </span>
                          ) : null}
                          {discussionThread.likeCount > 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#eef8df] px-2 py-1 text-[0.65rem] font-semibold text-[#355e24]">
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
                        className="shrink-0 rounded-full border-[#c7ddbc] bg-white px-4 text-xs font-semibold text-[#2f4820] hover:bg-[#eef8df]"
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
