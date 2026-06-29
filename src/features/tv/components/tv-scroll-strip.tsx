"use client";

import { Heart, MessageSquare, MessageSquareText, ThumbsDown, ThumbsUp } from "lucide-react";
import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { normalizeShowSiteBackgroundHex } from "@/features/support/types/constants";
import { extractS3KeyFromValue } from "@/lib/s3-object-key";
import { cn } from "@/lib/utils";

type LatestShow = {
  kind: "latest";
  id: number;
  name: string;
  date: string;
  submitterLikenessDegree: number | null;
  commentsCount: number;
  thumbsUp: number;
  love: number;
  hasDiscussionThread: boolean;
  imageSrc: string | null;
  imageAlt: string;
  showSiteUrl: string | null;
  showSiteBackground: string;
};

type TopRatedShow = {
  kind: "top-rated";
  id: number;
  name: string;
  submitterLikenessDegree: number | null;
  noRating: number;
  thumbsUp: number;
  love: number;
  commentsCount: number;
  imageSrc: string | null;
  imageAlt: string;
  showSiteUrl: string | null;
  showSiteBackground: string;
  hasDiscussionThread: boolean;
};

type TvScrollItem = LatestShow | TopRatedShow;

type TvScrollStripProps = {
  title: string;
  description: string;
  items: TvScrollItem[];
  accentClassName: string;
  selectedShowId?: number;
  onSelectShow?: (id: number) => void;
  onOpenShow?: (id: number) => void;
};

function SubmitterRatingIcon({ likenessDegree }: { likenessDegree: number | null }) {
  if (likenessDegree === 1) {
    return <ThumbsUp className="size-4 text-[#2d87a8]" aria-label="Submitter rated thumbs up" />;
  }

  if (likenessDegree === 2) {
    return <Heart className="size-4 text-[#cf3f7f]" aria-label="Submitter rated love" />;
  }

  return null;
}

function SubmitterRatingBadge({ likenessDegree }: { likenessDegree: number | null }) {
  if (![1, 2].includes(likenessDegree ?? -1)) {
    return null;
  }

  return (
    <span className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#eef8fc] p-2 shadow-sm">
      <SubmitterRatingIcon likenessDegree={ likenessDegree } />
    </span>
  );
}

function ShowImage({ src, alt }: { src: string; alt: string }) {
  const [resolvedSrc, setResolvedSrc] = useState(src);

  useEffect(() => {
    let isCancelled = false;

    const resolveSignedUrl = async () => {
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

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={ resolvedSrc } alt={ alt } className="h-full w-full object-cover" />;
}

export function TvScrollStrip({
  title,
  description,
  items,
  accentClassName,
  selectedShowId,
  onSelectShow,
  onOpenShow,
}: TvScrollStripProps) {
  return (
    <Card className="overflow-hidden border-white/70 bg-white/80 shadow-[0_22px_65px_-38px_rgba(9,44,62,0.8)] backdrop-blur">
      <CardHeader className="gap-2 border-b border-[#d7ebf3] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(239,249,253,0.82))] px-5 py-3 sm:px-6">
        <div>
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#45829a]">
            TV Picks
          </p>
          <CardTitle className="mt-2 text-xl font-black tracking-tight text-[#15384a]">
            { title }
          </CardTitle>
          {/* <p className="mt-1 max-w-2xl text-xs leading-5 text-[#5f7987]">{ description }</p> */ }
        </div>
      </CardHeader>

      <CardContent className="px-4 py-2 sm:px-5 sm:py-3">
        <div
          className="grid max-h-800 grid-cols-2 gap-2 overflow-y-auto px-1 pb-1 pt-1 lg:grid-cols-3"
        >
          { items.map((item) => {
            const isSelected = selectedShowId === item.id;

            return (
              <article
                key={ item.id }
                className="min-w-0"
              >
                <div className={ cn("rounded-4xl p-px shadow-[0_16px_28px_-24px_rgba(17,53,70,0.72)]", isSelected ? "ring-2 ring-[#2d87a8] ring-offset-1" : accentClassName) }>
                  <div
                    role={ onSelectShow ? "button" : undefined }
                    tabIndex={ onSelectShow ? 0 : undefined }
                    onClick={ onSelectShow ? () => onSelectShow(item.id) : undefined }
                    onDoubleClick={ onOpenShow ? () => onOpenShow(item.id) : undefined }
                    onKeyDown={ onSelectShow ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelectShow(item.id); } } : undefined }
                    aria-label={ onSelectShow ? (isSelected ? `${ item.name } is selected` : `Select ${ item.name }`) : undefined }
                    aria-pressed={ onSelectShow ? isSelected : undefined }
                    className={ cn(
                      "overflow-hidden rounded-[calc(1.25rem-1px)] border border-white/80 bg-[#fbfeff]",
                      onSelectShow && "cursor-pointer",
                      onSelectShow && !isSelected && "hover:bg-[#f0faff]",
                      isSelected && "bg-[#eaf7ff]",
                    ) }
                  >
                    <div className="relative aspect-16/6 overflow-hidden sm:aspect-[16/8.7]">
                      { item.imageSrc ? (
                        <ShowImage src={ item.imageSrc } alt={ item.imageAlt } />
                      ) : item.showSiteUrl ? (
                        <div className="flex h-full w-full items-center justify-center px-4 py-6" style={ { backgroundColor: normalizeShowSiteBackgroundHex(item.showSiteBackground) } }>
                          <span className="text-center text-lg font-black leading-tight tracking-tight text-white/80">{ item.name }</span>
                        </div>
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-[#1b3a4b]">
                          <span className="text-center text-sm font-semibold text-white/70">{ item.name }</span>
                        </div>
                      ) }
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-[linear-gradient(180deg,rgba(4,24,34,0),rgba(4,24,34,0.78))]" />
                      <div className="pointer-events-none absolute right-2 top-2 flex flex-col items-end gap-1.5">
                        { item.hasDiscussionThread ? (
                          <div className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/92 text-[#2d87a8] shadow-sm">
                            <MessageSquare className="size-3.5" aria-label="Discussion thread available" />
                          </div>
                        ) : null }
                      </div>
                    </div>

                    <div className="space-y-2 px-3 py-3">
                      <div>
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="min-w-0 text-sm font-black leading-snug tracking-tight text-[#13364a]">
                            { item.showSiteUrl ? (
                              <a
                                href={ item.showSiteUrl }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline-offset-2 hover:underline"
                                onClick={ (event) => event.stopPropagation() }
                                onKeyDown={ (event) => event.stopPropagation() }
                              >
                                { item.name }
                              </a>
                            ) : (
                              item.name
                            ) }
                          </h3>
                          <SubmitterRatingBadge likenessDegree={ item.submitterLikenessDegree } />
                        </div>
                        { item.kind === "latest" ? (
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-[#607887]">
                            <span>{ item.date }</span>
                            <span className="inline-flex items-center gap-1 font-semibold text-[#21536a]">
                              <ThumbsUp className="size-3.5 text-[#2d87a8]" />
                              { item.thumbsUp.toLocaleString() }
                            </span>
                            <span className="inline-flex items-center gap-1 font-semibold text-[#8f2f58]">
                              <Heart className="size-3.5 text-[#cf3f7f]" />
                              { item.love.toLocaleString() }
                            </span>
                            <span className="inline-flex items-center gap-1 font-semibold text-[#21536a]">
                              <MessageSquareText className="size-3.5 text-[#2d87a8]" />
                              { item.commentsCount.toLocaleString() }
                            </span>
                          </div>
                        ) : (
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-[#607887]">
                            <span className="inline-flex items-center gap-1 font-semibold text-[#5c6c76]">
                              <ThumbsDown className="size-3.5 text-[#5c6c76]" />
                              { item.noRating.toLocaleString() }
                            </span>
                            <span className="inline-flex items-center gap-1 font-semibold text-[#21536a]">
                              <ThumbsUp className="size-3.5 text-[#2d87a8]" />
                              { item.thumbsUp.toLocaleString() }
                            </span>
                            <span className="inline-flex items-center gap-1 font-semibold text-[#8f2f58]">
                              <Heart className="size-3.5 text-[#cf3f7f]" />
                              { item.love.toLocaleString() }
                            </span>
                            <span className="inline-flex items-center gap-1 font-semibold text-[#21536a]">
                              <MessageSquareText className="size-3.5 text-[#2d87a8]" />
                              { item.commentsCount.toLocaleString() }
                            </span>
                          </div>
                        ) }
                      </div>
                    </div>

                  </div>
                </div>
              </article>
            );
          }) }
        </div>
      </CardContent>
    </Card>
  );
}