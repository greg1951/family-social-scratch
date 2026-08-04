"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Heart, MessageSquare, Search, ThumbsDown, ThumbsUp } from "lucide-react";

import MainDropMenu from "@/components/common/main-dropmenu";
import { BlogHomePost } from "@/components/db/types/blogs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { extractS3KeyFromValue } from "@/lib/s3-object-key";

type BlogDirectoryMode = "all" | "latest" | "top-rated";

function BlogCardCoverImage({ src, alt }: { src: string | null; alt: string | null }) {
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
    <div className="mt-3 overflow-hidden rounded-xl">
      <Image
        src={ resolvedSrc }
        alt={ alt ?? "Blog cover image" }
        width={ 640 }
        height={ 320 }
        unoptimized
        className="h-32 w-full object-cover"
      />
    </div>
  );
}

function formatDate(value: Date | null) {
  if (!value) {
    return "Not published";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function BlogsHomePage({
  posts,
  memberId,
  isFounder,
  isAdmin,
  firstName,
  email,
  memberImageUrl,
  unreadThreadCount,
}: {
  posts: BlogHomePost[];
  memberId: number;
  isFounder?: boolean;
  isAdmin?: boolean;
  firstName: string;
  email: string;
  memberImageUrl?: string | null;
  unreadThreadCount?: number;
}) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState("");
  const [directoryMode, setDirectoryMode] = useState<BlogDirectoryMode>("all");
  const [selectedBlogId, setSelectedBlogId] = useState<number | null>(posts[0]?.id ?? null);
  const deferredSearchValue = useDeferredValue(searchValue);

  const directoryPosts = useMemo(() => {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    if (directoryMode === "all") {
      return [...posts].sort((leftPost, rightPost) => (
        new Date(rightPost.createdAt).getTime() - new Date(leftPost.createdAt).getTime()
      ));
    }

    if (directoryMode === "latest") {
      return posts
        .filter((post) => new Date(post.createdAt).getTime() >= monthAgo.getTime())
        .sort((leftPost, rightPost) => (
          new Date(rightPost.createdAt).getTime() - new Date(leftPost.createdAt).getTime()
        ));
    }

    return posts
      .filter((post) => (post.likeCount + post.loveCount) > 0)
      .sort((leftPost, rightPost) => {
        const rightScore = rightPost.likeCount + rightPost.loveCount;
        const leftScore = leftPost.likeCount + leftPost.loveCount;

        if (rightScore !== leftScore) {
          return rightScore - leftScore;
        }

        return new Date(rightPost.createdAt).getTime() - new Date(leftPost.createdAt).getTime();
      });
  }, [directoryMode, posts]);

  const filteredPosts = useMemo(() => {
    const normalizedQuery = deferredSearchValue.trim().toLowerCase();

    if (!normalizedQuery) {
      return directoryPosts;
    }

    return directoryPosts.filter((post) => (
      post.title.toLowerCase().includes(normalizedQuery)
      || post.authorName.toLowerCase().includes(normalizedQuery)
      || post.status.toLowerCase().includes(normalizedQuery)
      || post.selectedTagNames.some((tagName) => tagName.toLowerCase().includes(normalizedQuery))
    ));
  }, [deferredSearchValue, directoryPosts]);

  const selectedBlog = useMemo(() => (
    filteredPosts.find((post) => post.id === selectedBlogId)
    ?? filteredPosts[0]
    ?? null
  ), [filteredPosts, selectedBlogId]);

  const canEditSelectedBlog = Boolean(
    selectedBlog && (selectedBlog.authorMemberId === memberId || Boolean(isFounder))
  );

  return (
    <section className="font-app w-full px-4 pb-10 pt-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-3xl border border-[#f5d4c2] bg-[linear-gradient(135deg,rgba(183,109,104,0.95),rgba(241,168,134,0.88)_56%,rgba(248,185,150,0.82))] p-6 shadow-[0_16px_40px_rgba(183,109,104,0.18)]">
          <div className="flex items-start justify-between gap-3">
            <div className="max-w-3xl">
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.28em] text-[#7a3e3a] sm:text-[0.72rem] sm:tracking-[0.34em]">
                The Living Room
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Link
                  href="/"
                  className="inline-flex items-center rounded-full border border-white/35 bg-white/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#fff7f2] transition hover:bg-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:px-4 sm:py-2 sm:text-xs sm:tracking-[0.2em]">
                  <ArrowLeft className="font-app mr-1.5 size-3.5 sm:mr-2 sm:size-4" />
                  Home
                </Link>
              </div>
            </div>

            <div className="shrink-0 self-start">
              <MainDropMenu
                firstName={ firstName }
                email={ email }
                sessionFound={ true }
                isFounder={ Boolean(isFounder) }
                isAdmin={ Boolean(isAdmin) }
                memberImageUrl={ memberImageUrl ?? null }
                unreadThreadCount={ unreadThreadCount ?? 0 }
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#f5d4c2] bg-white p-4 shadow-xs sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#8a4d45]">Blog Finder</p>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button asChild className="rounded-full bg-[#b76d68] text-white hover:bg-[#9d5954]">
              <Link href="/blogs/new">Add Blog</Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={ () => {
                if (selectedBlog) {
                  router.push(`/blogs/${selectedBlog.slug}`);
                }
              } }
              disabled={ !selectedBlog }
              className="rounded-full border-[#f2c2ab] text-[#8a4d45] hover:bg-[#fff3ea]"
            >
              View Blog
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={ () => {
                if (selectedBlog && canEditSelectedBlog) {
                  router.push(`/blogs/edit/${selectedBlog.id}`);
                }
              } }
              disabled={ !selectedBlog || !canEditSelectedBlog }
              className="rounded-full border-[#f2c2ab] text-[#8a4d45] hover:bg-[#fff3ea]"
            >
              Edit Blog
            </Button>
          </div>

          <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
            <div className="relative min-w-[16rem] flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#a46056]" />
              <Input
                type="search"
                value={ searchValue }
                onChange={ (event) => setSearchValue(event.target.value) }
                placeholder="Search by title, author, status, or tag"
                className="h-10 rounded-full border-[#f2c6b0] bg-white pl-10 pr-4 text-sm text-[#6a3f39]"
                aria-label="Search blogs"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm text-[#8a4d45] md:justify-end">
              <label className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border border-[#f3d0bf] bg-white px-3 py-1.5 text-xs font-semibold text-[#8a4d45] sm:px-4 sm:py-2 sm:text-sm">
                <input
                  type="radio"
                  name="blog-directory-mode"
                  value="all"
                  checked={ directoryMode === "all" }
                  onChange={ () => setDirectoryMode("all") }
                  className="size-3.5 border-[#e7a67a] text-[#b76d68] sm:size-4"
                />
                All Blogs
              </label>
              <label className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border border-[#f3d0bf] bg-white px-3 py-1.5 text-xs font-semibold text-[#8a4d45] sm:px-4 sm:py-2 sm:text-sm">
                <input
                  type="radio"
                  name="blog-directory-mode"
                  value="latest"
                  checked={ directoryMode === "latest" }
                  onChange={ () => setDirectoryMode("latest") }
                  className="size-3.5 border-[#e7a67a] text-[#b76d68] sm:size-4"
                />
                Latest Month
              </label>
              <label className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border border-[#f3d0bf] bg-white px-3 py-1.5 text-xs font-semibold text-[#8a4d45] sm:px-4 sm:py-2 sm:text-sm">
                <input
                  type="radio"
                  name="blog-directory-mode"
                  value="top-rated"
                  checked={ directoryMode === "top-rated" }
                  onChange={ () => setDirectoryMode("top-rated") }
                  className="size-3.5 border-[#e7a67a] text-[#b76d68] sm:size-4"
                />
                Top Rated Blogs
              </label>
            </div>
          </div>

          <div className="mt-4 max-h-[68vh] overflow-y-auto pr-1">
            {posts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#f2c6b0] bg-[#fffaf6] p-8 text-center text-[#8a4d45]">
                No blog posts yet.
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#f2c6b0] bg-[#fff7f2] p-8 text-center text-[#8a4d45]">
                {directoryMode === "top-rated"
                  ? "No top-rated blogs match this view yet."
                  : "No blog posts match that search yet."}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {filteredPosts.map((post) => {
                  const isSelected = post.id === selectedBlogId;

                  return (
                    <button
                      key={ post.id }
                      type="button"
                      onClick={ () => setSelectedBlogId(post.id) }
                      onDoubleClick={ () => router.push(`/blogs/${post.slug}`) }
                      className={ `flex h-full flex-col rounded-2xl border p-4 text-left shadow-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b76d68] ${isSelected
                        ? "border-[#e7a67a] bg-[linear-gradient(135deg,rgba(255,240,231,0.95),rgba(255,249,244,0.95))]"
                        : "border-[#f5d4c2] bg-[#fffaf6] hover:border-[#f0b08d]"
                        }` }
                    >
                      <h2 className="mt-2 line-clamp-2 text-lg font-bold text-[#7a3e3a]">{post.title}</h2>
                      <p className="mt-1 text-sm text-[#9a5a4f]">By {post.authorName} • {formatDate(post.publishedAt ?? post.createdAt)}</p>

                      <BlogCardCoverImage src={ post.coverImageS3Key } alt={ post.coverImageAlt } />

                      {post.status === "draft" ? (
                        <div className="mt-1">
                          <span className="inline-flex items-center rounded-full border border-[#f2c6b0] bg-[#fff0e8] px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-[#8a4d45]">
                            Draft
                          </span>
                        </div>
                      ) : null}

                      {post.selectedTagNames.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {post.selectedTagNames.slice(0, 4).map((tagName) => (
                            <span
                              key={ `${ post.id }-${ tagName }` }
                              className="inline-flex items-center rounded-full border border-[#f3c1a9] bg-[#fff1e9] px-2 py-0.5 text-[0.65rem] font-semibold text-[#8a4d45]"
                            >
                              {tagName}
                            </span>
                          ))}
                          {post.selectedTagNames.length > 4 ? (
                            <span className="inline-flex items-center rounded-full border border-[#f3c1a9] bg-white px-2 py-0.5 text-[0.65rem] font-semibold text-[#8a4d45]">
                              +{post.selectedTagNames.length - 4}
                            </span>
                          ) : null}
                        </div>
                      ) : null}

                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-semibold text-[#8a4d45]">
                        <span className="inline-flex items-center gap-1">
                          <ThumbsDown className="size-3.5 text-[#a66b5a]" />
                          {post.dislikeCount}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <ThumbsUp className="size-3.5 text-[#b76d68]" />
                          {post.likeCount}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Heart className="size-3.5 text-[#c46875]" />
                          {post.loveCount}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MessageSquare className="size-3.5 text-[#9d5b4b]" />
                          {post.commentCount}
                        </span>
                        {post.hasDiscussionThread ? (
                          <span
                            className="inline-flex items-center gap-1 rounded-full border border-[#f3c1a9] bg-white px-1.5 py-0.5 text-[#8a4d45]"
                            title="Discussion group available"
                            aria-label="Discussion group available"
                          >
                            <MessageSquare className="size-3.5" />
                          </span>
                        ) : null}
                      </div>

                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
