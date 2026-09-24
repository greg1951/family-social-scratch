"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Film, GlobeLock, Heart, HouseHeart, MessageSquare, ThumbsDown, ThumbsUp, ArrowLeft } from "lucide-react";

import MainDropMenu from "@/components/common/main-dropmenu";
import MemberAvatar from "@/components/common/member-avatar";
import FeatureFaqHelp from "@/components/common/feature-faq-help";
import {
  FilterSidebar,
  FilterSidebarCheckbox,
  FilterSidebarGroup,
  FilterSidebarDateScope,
  FilterSidebarProvider,
  FilterSidebarRadio,
  FilterSidebarSearch,
  FilterSidebarTrigger,
  type FilterSidebarPalette,
} from "@/components/common/filter-sidebar";
import { BlogHomePost } from "@/components/db/types/blogs";
import { Button } from "@/components/ui/button";
import EditPostIcon from "@/components/common/edit-post-icon";
import { extractS3KeyFromValue } from "@/lib/s3-object-key";

type BlogDirectoryMode = "all" | "latest" | "top-rated" | "my-blogs";

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const blogsFilterPalette: FilterSidebarPalette = {
  sidebarBackground: "#fffaf6",
  sidebarForeground: "#7a3e3a",
  sidebarBorder: "#f5d4c2",
  label: "#8a4d45",
  muted: "#9a5a4f",
  inputBorder: "#f2c6b0",
  inputText: "#6a3f39",
  chipBorder: "#f3d0bf",
  chipText: "#8a4d45",
  chipHoverBackground: "#fff3ea",
  checkBorder: "#e7a67a",
  checkboxText: "#8a4d45",
  accent: "#b76d68",
  accentHoverBackground: "#9d5954",
  triggerBorder: "#f3c1a9",
  triggerBackground: "#fffaf6",
  triggerText: "#8a4d45",
  triggerHoverBackground: "#fff1e9",
};

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
  showManagementActions = false,
  initialPrivateOnly = false,
}: {
  posts: BlogHomePost[];
  memberId: number;
  isFounder?: boolean;
  isAdmin?: boolean;
  firstName: string;
  email: string;
  memberImageUrl?: string | null;
  unreadThreadCount?: number;
  showManagementActions?: boolean;
  initialPrivateOnly?: boolean;
}) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState("");
  const [directoryMode, setDirectoryMode] = useState<BlogDirectoryMode>("all");
  const [dateScope, setDateScope] = useState<"everything" | "date-range">("everything");
  const [startDate, setStartDate] = useState(() => {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    return toDateInputValue(threeMonthsAgo);
  });
  const [endDate, setEndDate] = useState(() => toDateInputValue(new Date()));
  const [appliedStartDate, setAppliedStartDate] = useState(startDate);
  const [appliedEndDate, setAppliedEndDate] = useState(endDate);
  const [privateOnly, setPrivateOnly] = useState(initialPrivateOnly);
  const [selectedBlogId, setSelectedBlogId] = useState<number | null>(posts[0]?.id ?? null);
  const deferredSearchValue = useDeferredValue(searchValue);
  const isDateRangeScope = dateScope === "date-range";
  const hasPendingDateChanges = startDate !== appliedStartDate || endDate !== appliedEndDate;

  function handleApplyDateRange() {
    setAppliedStartDate(startDate);
    setAppliedEndDate(endDate);
    setDateScope("date-range");
  }

  const directoryPosts = useMemo(() => {
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    const startDateValue = isDateRangeScope && appliedStartDate
      ? new Date(`${appliedStartDate}T00:00:00`)
      : null;
    const endDateValue = isDateRangeScope && appliedEndDate
      ? new Date(`${appliedEndDate}T23:59:59.999`)
      : null;
    const scopedPosts = posts.filter((post) => {
      const createdAt = new Date(post.createdAt);

      if (startDateValue && createdAt < startDateValue) {
        return false;
      }

      if (endDateValue && createdAt > endDateValue) {
        return false;
      }

      return true;
    });

    if (directoryMode === "all") {
      return [...scopedPosts].sort((leftPost, rightPost) => (
        new Date(rightPost.createdAt).getTime() - new Date(leftPost.createdAt).getTime()
      ));
    }

    if (directoryMode === "latest") {
      return scopedPosts
        .filter((post) => new Date(post.createdAt).getTime() >= twoMonthsAgo.getTime())
        .sort((leftPost, rightPost) => (
          new Date(rightPost.createdAt).getTime() - new Date(leftPost.createdAt).getTime()
        ));
    }

    if (directoryMode === "my-blogs") {
      return scopedPosts
        .filter((post) => String(post.authorMemberId) === String(memberId))
        .sort((leftPost, rightPost) => (
          new Date(rightPost.createdAt).getTime() - new Date(leftPost.createdAt).getTime()
        ));
    }

    return scopedPosts
      .filter((post) => (post.likeCount + post.loveCount) > 0)
      .sort((leftPost, rightPost) => {
        const rightScore = rightPost.likeCount + rightPost.loveCount;
        const leftScore = leftPost.likeCount + leftPost.loveCount;

        if (rightScore !== leftScore) {
          return rightScore - leftScore;
        }

        return new Date(rightPost.createdAt).getTime() - new Date(leftPost.createdAt).getTime();
      });
  }, [appliedEndDate, appliedStartDate, directoryMode, isDateRangeScope, memberId, posts]);

  const filteredPosts = useMemo(() => {
    const normalizedQuery = deferredSearchValue.trim().toLowerCase();
    const postsForView = privateOnly
      ? directoryPosts.filter((post) => post.status === "private")
      : directoryPosts;

    if (!normalizedQuery) {
      return postsForView;
    }

    return postsForView.filter((post) => (
      post.title.toLowerCase().includes(normalizedQuery)
      || post.authorName.toLowerCase().includes(normalizedQuery)
      || post.status.toLowerCase().includes(normalizedQuery)
      || post.selectedTagNames.some((tagName) => tagName.toLowerCase().includes(normalizedQuery))
    ));
  }, [deferredSearchValue, directoryPosts, privateOnly]);

  const selectedBlog = useMemo(() => (
    filteredPosts.find((post) => post.id === selectedBlogId)
    ?? filteredPosts[0]
    ?? null
  ), [filteredPosts, selectedBlogId]);

  const canEditSelectedBlog = Boolean(
    selectedBlog && (selectedBlog.authorMemberId === memberId || Boolean(isFounder))
  );

  return (
    <FilterSidebarProvider palette={ blogsFilterPalette }>
      <FilterSidebar title="Blog Filters">
        <FilterSidebarSearch
          value={ searchValue }
          onChange={ setSearchValue }
          placeholder="Search by title, author, status, or tag"
          ariaLabel="Search blogs"
        />
        <FilterSidebarDateScope
          radioName="blog-date-scope"
          dateScope={ dateScope }
          onDateScopeChange={ setDateScope }
          startDate={ startDate }
          endDate={ endDate }
          onStartDateChange={ setStartDate }
          onEndDateChange={ setEndDate }
          isDateRangeScope={ isDateRangeScope }
          hasPendingChanges={ hasPendingDateChanges }
          onApply={ handleApplyDateRange }
        />
        <FilterSidebarGroup label="Blog View" className="flex flex-wrap gap-2">
          <FilterSidebarRadio name="blog-directory-mode" value="all" checked={ directoryMode === "all" } onChange={ () => setDirectoryMode("all") }>
            All Blogs
          </FilterSidebarRadio>
          {!showManagementActions ? (
            <FilterSidebarRadio name="blog-directory-mode" value="my-blogs" checked={ directoryMode === "my-blogs" } onChange={ () => setDirectoryMode("my-blogs") }>
              My Blogs
            </FilterSidebarRadio>
          ) : null}
          <FilterSidebarRadio name="blog-directory-mode" value="latest" checked={ directoryMode === "latest" } onChange={ () => setDirectoryMode("latest") }>
            Latest Month
          </FilterSidebarRadio>
          <FilterSidebarRadio name="blog-directory-mode" value="top-rated" checked={ directoryMode === "top-rated" } onChange={ () => setDirectoryMode("top-rated") }>
            Top Rated Blogs
          </FilterSidebarRadio>
          {showManagementActions ? (
            <FilterSidebarCheckbox checked={ privateOnly } onChange={ setPrivateOnly }>
              Private Blogs Only
            </FilterSidebarCheckbox>
          ) : null}
        </FilterSidebarGroup>
      </FilterSidebar>

    <section className="font-app min-w-0 flex-1 w-full px-4 pb-10 pt-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-3xl border border-[#f5d4c2] bg-[linear-gradient(135deg,rgba(183,109,104,0.95),rgba(241,168,134,0.88)_56%,rgba(248,185,150,0.82))] p-6 shadow-[0_16px_40px_rgba(183,109,104,0.18)]">
          <div className="flex items-start justify-between gap-3">
            <div className="max-w-3xl">
              <p className="text-[1rem] font-bold uppercase tracking-[0.34em] text-[#7a3e3a]">
                The Living Room
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Link
                  href="/"
                  className="inline-flex items-center rounded-full border border-white/35 bg-white/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#fff7f2] transition hover:bg-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:px-4 sm:py-2 sm:text-xs sm:tracking-[0.2em]">
                  <HouseHeart className="font-app mr-1.5 size-3.5 sm:mr-2 sm:size-4" />
                  Go Home
                </Link>
                {showManagementActions ? (
                  <Link
                    href="/blogs"
                    className="inline-flex items-center rounded-full border border-white/35 bg-white/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#fff7f2] transition hover:bg-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:px-4 sm:py-2 sm:text-xs sm:tracking-[0.2em]">
                    <ArrowLeft className="font-app mr-1.5 size-3.5 sm:mr-2 sm:size-4" />
                    Return to Living Room
                  </Link>
                ) : (
                  <Link
                    href="/member-blogs"
                    className="inline-flex items-center rounded-full border border-white/35 bg-white/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#fff7f2] transition hover:bg-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:px-4 sm:py-2 sm:text-xs sm:tracking-[0.2em]">
                    <MessageSquare className="font-app mr-1.5 size-3.5 sm:mr-2 sm:size-4" />
                    My Blogs
                  </Link>
                )}
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
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#8a4d45]">Blog Finder</p>
              <FeatureFaqHelp
                href={ showManagementActions
                  ? "/feature-faq?category=Member%20Blogs"
                  : "/feature-faq?category=Living%20Room" }
                buttonClassName="border-[#f5d4c2] bg-gradient-to-b from-[#fffaf7] to-[#fde8dd] text-[#a45a4f]"
                iconClassName="h-3 w-3 text-[#a45a4f]"
                tooltipClassName="bg-[#7a3e3a] text-[#fff7f2]"
              />
              <EditPostIcon tooltip="Filter Blogs" tooltipClassName="bg-[#7a3e3a] text-[#fff7f2]">
                <FilterSidebarTrigger ariaLabel="Toggle blog filters" />
              </EditPostIcon>
            </div>
          </div>

          {showManagementActions ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button asChild className="rounded-full bg-[#b76d68] text-white hover:bg-[#9d5954]">
                <Link href="/member-blogs/new">Add Blog</Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={ () => {
                  if (selectedBlog) {
                    router.push(showManagementActions
                      ? `/blogs/${selectedBlog.slug}?from=member-blogs`
                      : `/blogs/${selectedBlog.slug}`);
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
                    router.push(`/member-blogs/edit/${selectedBlog.id}`);
                  }
                } }
                disabled={ !selectedBlog || !canEditSelectedBlog }
                className="rounded-full border-[#f2c2ab] text-[#8a4d45] hover:bg-[#fff3ea]"
              >
                Edit Blog
              </Button>
            </div>
          ) : null}

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
                    <div
                      key={ post.id }
                      role="button"
                      tabIndex={ 0 }
                      onClick={ () => setSelectedBlogId(post.id) }
                      onDoubleClick={ () => router.push(showManagementActions
                        ? `/blogs/${post.slug}?from=member-blogs`
                        : `/blogs/${post.slug}`) }
                      onKeyDown={ (event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedBlogId(post.id);
                        }
                      } }
                      className={ `flex h-full select-none flex-col rounded-2xl border p-4 text-left shadow-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b76d68] ${isSelected
                        ? "border-[#e7a67a] bg-[linear-gradient(135deg,rgba(255,240,231,0.95),rgba(255,249,244,0.95))]"
                        : "border-[#f5d4c2] bg-[#fffaf6] hover:border-[#f0b08d]"
                        }` }
                    >
                      <div className="mt-2 flex items-start gap-2">
                        <h2 className="line-clamp-2 flex-1 text-lg font-bold text-[#7a3e3a]">{post.title}</h2>
                        {post.status === "private" ? (
                          <span
                            className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-[#e3b7b7] bg-[#fff3f3] text-[#8a3e3e]"
                            title="Private blog"
                            aria-label="Private blog"
                          >
                            <GlobeLock className="size-4" aria-hidden="true" />
                          </span>
                        ) : null}
                        {post.videoUrl ? (
                          <a
                            href={ post.videoUrl }
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={ (event) => event.stopPropagation() }
                            onDoubleClick={ (event) => event.stopPropagation() }
                            className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-[#f3c1a9] bg-white text-[#9d5954] hover:bg-[#fff1e9]"
                            aria-label={ `Watch ${ post.title } on YouTube` }
                            title={ `Watch on YouTube (${ post.videoMinutes } min)` }
                          >
                            <Film className="size-4" aria-hidden="true" />
                          </a>
                        ) : null}
                      </div>
                      <div className="relative">
                        <BlogCardCoverImage src={ post.coverImageS3Key } alt={ post.coverImageAlt } />
                        <span className="absolute left-3 top-3 inline-flex" title={ post.authorName }>
                          <MemberAvatar
                            imageUrl={ post.authorImageUrl }
                            firstName={ post.authorName }
                            sizeClassName="h-10 w-10"
                            chromeClassName="border-2 border-white shadow-md"
                          />
                        </span>
                      </div>

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

                      <p className="mt-2 text-sm text-[#9a5a4f]">
                        { formatDate(post.publishedAt ?? post.createdAt) }
                      </p>

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

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
    </FilterSidebarProvider>
  );
}
