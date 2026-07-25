"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDeferredValue, useMemo, useState } from "react";
import { ArrowLeft, Heart, MessageSquare, Search, ThumbsDown, ThumbsUp } from "lucide-react";

import MainDropMenu from "@/components/common/main-dropmenu";
import { BlogHomePost } from "@/components/db/types/blogs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type BlogDirectoryMode = "all" | "latest" | "top-rated";

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
        <div className="rounded-3xl border border-[#d8e7cf] bg-[linear-gradient(135deg,#f5fbe8,#edf7db_55%,#e2f0cc)] p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#5a7d42]">Family Blog</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-[#2f4820]">Stories, updates, and reflections</h1>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button asChild variant="outline" className="rounded-full border-[#bad1aa] text-[#355e24] hover:bg-[#f2f9eb]">
                  <Link href="/" className="inline-flex items-center gap-1">
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    <span>Home</span>
                  </Link>
                </Button>
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

        <div className="rounded-2xl border border-[#d8e7cf] bg-white p-4 shadow-xs sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#5a7d42]">Blog Finder</p>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button asChild className="rounded-full bg-[#3f6f2d] text-white hover:bg-[#315722]">
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
              className="rounded-full border-[#bad1aa] text-[#355e24] hover:bg-[#f2f9eb]"
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
              className="rounded-full border-[#bad1aa] text-[#355e24] hover:bg-[#f2f9eb]"
            >
              Edit Blog
            </Button>
          </div>

          <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
            <div className="relative min-w-[16rem] flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#5a7d42]" />
              <Input
                type="search"
                value={ searchValue }
                onChange={ (event) => setSearchValue(event.target.value) }
                placeholder="Search by title, author, status, or tag"
                className="h-10 rounded-full border-[#c9dcc0] bg-white pl-10 pr-4 text-sm text-[#29401f]"
                aria-label="Search blogs"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm text-[#355161] md:justify-end">
              <label className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border border-[#c8d7df] bg-white px-3 py-1.5 text-xs font-semibold text-[#2a5a6f] sm:px-4 sm:py-2 sm:text-sm">
                <input
                  type="radio"
                  name="blog-directory-mode"
                  value="all"
                  checked={ directoryMode === "all" }
                  onChange={ () => setDirectoryMode("all") }
                  className="size-3.5 border-[#9ec3d2] text-[#0f5c78] sm:size-4"
                />
                All Blogs
              </label>
              <label className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border border-[#c8d7df] bg-white px-3 py-1.5 text-xs font-semibold text-[#2a5a6f] sm:px-4 sm:py-2 sm:text-sm">
                <input
                  type="radio"
                  name="blog-directory-mode"
                  value="latest"
                  checked={ directoryMode === "latest" }
                  onChange={ () => setDirectoryMode("latest") }
                  className="size-3.5 border-[#9ec3d2] text-[#0f5c78] sm:size-4"
                />
                Latest Month
              </label>
              <label className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border border-[#c8d7df] bg-white px-3 py-1.5 text-xs font-semibold text-[#2a5a6f] sm:px-4 sm:py-2 sm:text-sm">
                <input
                  type="radio"
                  name="blog-directory-mode"
                  value="top-rated"
                  checked={ directoryMode === "top-rated" }
                  onChange={ () => setDirectoryMode("top-rated") }
                  className="size-3.5 border-[#9ec3d2] text-[#0f5c78] sm:size-4"
                />
                Top Rated Blogs
              </label>
            </div>
          </div>

          <div className="mt-4 max-h-[68vh] overflow-y-auto pr-1">
            {posts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#cadfbb] bg-white p-8 text-center text-[#4d6640]">
                No blog posts yet.
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#cadfbb] bg-[#fcfef8] p-8 text-center text-[#4d6640]">
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
                      className={ `flex h-full flex-col rounded-2xl border p-4 text-left shadow-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3d819b] ${isSelected
                        ? "border-[#3d819b] bg-[linear-gradient(135deg,rgba(231,247,255,0.95),rgba(248,252,255,0.95))]"
                        : "border-[#d8e7cf] bg-[#fcfef8] hover:border-[#bad1aa]"
                        }` }
                    >
                      <h2 className="mt-2 line-clamp-2 text-lg font-bold text-[#2f4820]">{post.title}</h2>
                      <p className="mt-1 text-sm text-[#5a7450]">By {post.authorName} • {formatDate(post.publishedAt ?? post.createdAt)}</p>

                      {post.status === "draft" ? (
                        <div className="mt-1">
                          <span className="inline-flex items-center rounded-full border border-[#d8c7a6] bg-[#fff7e8] px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-[#8a6234]">
                            Draft
                          </span>
                        </div>
                      ) : null}

                      {post.selectedTagNames.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {post.selectedTagNames.slice(0, 4).map((tagName) => (
                            <span
                              key={ `${ post.id }-${ tagName }` }
                              className="inline-flex items-center rounded-full border border-[#c7ddbc] bg-[#eef8df] px-2 py-0.5 text-[0.65rem] font-semibold text-[#355e24]"
                            >
                              {tagName}
                            </span>
                          ))}
                          {post.selectedTagNames.length > 4 ? (
                            <span className="inline-flex items-center rounded-full border border-[#c9dcc0] bg-white px-2 py-0.5 text-[0.65rem] font-semibold text-[#5a7450]">
                              +{post.selectedTagNames.length - 4}
                            </span>
                          ) : null}
                        </div>
                      ) : null}

                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-semibold text-[#4d6640]">
                        <span className="inline-flex items-center gap-1">
                          <ThumbsDown className="size-3.5 text-[#8c6a55]" />
                          {post.dislikeCount}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <ThumbsUp className="size-3.5 text-[#466f35]" />
                          {post.likeCount}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Heart className="size-3.5 text-[#b04f5f]" />
                          {post.loveCount}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MessageSquare className="size-3.5 text-[#5a7d42]" />
                          {post.commentCount}
                        </span>
                        {post.hasDiscussionThread ? (
                          <span
                            className="inline-flex items-center gap-1 rounded-full border border-[#c7ddbc] bg-white px-1.5 py-0.5 text-[#3f6f2d]"
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
