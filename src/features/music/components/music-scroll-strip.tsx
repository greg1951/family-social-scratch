"use client";

import { Heart, MessageSquare, MessageSquareText, ThumbsDown, ThumbsUp } from "lucide-react";
import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { extractS3KeyFromValue } from "@/lib/s3-object-key";
import { cn } from "@/lib/utils";

type LatestMusicItem = {
  kind: "latest";
  id: number;
  name: string;
  date: string;
  reviewType: "Song" | "Album";
  hasLyrics: boolean;
  hasDiscussionThread: boolean;
  submitterLikenessDegree: number | null;
  commentsCount: number;
  thumbsUp: number;
  love: number;
  imageSrc: string;
  imageAlt: string;
};

type TopRatedMusicItem = {
  kind: "top-rated";
  id: number;
  name: string;
  submitterLikenessDegree: number | null;
  noRating: number;
  thumbsUp: number;
  love: number;
  commentsCount: number;
  hasDiscussionThread: boolean;
  imageSrc: string;
  imageAlt: string;
};

type MusicScrollItem = LatestMusicItem | TopRatedMusicItem;

type MusicScrollStripProps = {
  title: string;
  description: string;
  items: MusicScrollItem[];
  accentClassName: string;
  selectedItemId?: number;
  onSelectItem?: (id: number) => void;
  onOpenItem?: (id: number) => void;
};

function SubmitterRatingIcon({ likenessDegree }: { likenessDegree: number | null }) {
  if (likenessDegree === 1) {
    return <ThumbsUp className="size-4 text-[#245475]" aria-label="Submitter rated thumbs up" />;
  }

  if (likenessDegree === 2) {
    return <Heart className="size-4 text-[#b33f6c]" aria-label="Submitter rated love" />;
  }

  return null;
}

function SubmitterRatingBadge({ likenessDegree }: { likenessDegree: number | null }) {
  if (![1, 2].includes(likenessDegree ?? -1)) {
    return null;
  }

  return (
    <span className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#eef6fb] p-2 shadow-sm">
      <SubmitterRatingIcon likenessDegree={ likenessDegree } />
    </span>
  );
}

export function MusicScrollStrip({
  title,
  description,
  items,
  accentClassName,
  selectedItemId,
  onSelectItem,
  onOpenItem,
}: MusicScrollStripProps) {
  function MusicImage({ src, alt }: { src: string; alt: string }) {
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

  return (
    <Card className="overflow-hidden border-white/70 bg-white/80 shadow-[0_22px_65px_-38px_rgba(9,44,62,0.8)] backdrop-blur">
      <CardHeader className="gap-4 border-b border-[#d7ebf3] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(239,249,253,0.82))] px-5 py-5 sm:px-6">
        <div>
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#45829a]">
            Music Salon
          </p>
          <CardTitle className="mt-2 text-2xl font-black tracking-tight text-[#15384a]">
            { title }
          </CardTitle>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5f7987]">{ description }</p>
        </div>
      </CardHeader>

      <CardContent className="px-4 py-4 sm:px-5 sm:py-5">
        <div
          className="grid max-h-800 grid-cols-2 gap-3 overflow-y-auto px-1 pb-1 pt-1 lg:grid-cols-3"
        >
          { items.map((item) => {
            const isSelected = selectedItemId === item.id;

            return (
              <article
                key={ item.name }
                className="min-w-0"
              >
                <div className={ cn("rounded-[1.6rem] p-px shadow-[0_18px_34px_-24px_rgba(17,53,70,0.72)]", isSelected ? "ring-2 ring-[#245475] ring-offset-1" : accentClassName) }>
                  <div
                    role={ onSelectItem ? "button" : undefined }
                    tabIndex={ onSelectItem ? 0 : undefined }
                    onClick={ onSelectItem ? () => onSelectItem(item.id) : undefined }
                    onDoubleClick={ onOpenItem ? () => onOpenItem(item.id) : undefined }
                    onKeyDown={ onSelectItem ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelectItem(item.id); } } : undefined }
                    aria-label={ onSelectItem ? (isSelected ? `${ item.name } is selected` : `Select ${ item.name }`) : undefined }
                    aria-pressed={ onSelectItem ? isSelected : undefined }
                    className={ cn(
                      "overflow-hidden rounded-[calc(1.6rem-1px)] border border-white/80 bg-[#fbfeff]",
                      onSelectItem && "cursor-pointer",
                      onSelectItem && !isSelected && "hover:bg-[#f8f5ff]",
                      isSelected && "bg-[#f0f5ff]",
                    ) }
                  >
                    <div className="relative aspect-[16/6.7] overflow-hidden sm:aspect-16/10">
                      <MusicImage src={ item.imageSrc } alt={ item.imageAlt } />
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,rgba(4,24,34,0),rgba(4,24,34,0.78))]" />
                      { item.kind !== "top-rated" && item.reviewType === "Song" && item.hasLyrics ? (
                        <div className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-white/92 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.24em] text-[#275f75] shadow-sm">
                          Lyrics
                        </div>
                      ) : null }
                      { item.hasDiscussionThread ? (
                        <div className="pointer-events-none absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/92 text-[#2d87a8] shadow-sm">
                          <MessageSquare className="size-4" aria-label="Discussion thread available" />
                        </div>
                      ) : null }
                    </div>

                    <div className="space-y-3 px-4 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="min-w-0 text-base font-black leading-snug tracking-tight text-[#13364a]">{ item.name }</h3>
                          { item.kind === "latest" ? (
                            <p className="mt-1 text-sm text-[#607887]">{ item.date }</p>
                          ) : null }
                        </div>

                        <SubmitterRatingBadge likenessDegree={ item.submitterLikenessDegree } />
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-[#21536a]">
                        { item.kind === "top-rated" ? (
                          <span className="inline-flex items-center gap-1.5 text-[#5f6a70]">
                            <ThumbsDown className="size-4 text-[#66757d]" />
                            { item.noRating.toLocaleString() }
                          </span>
                        ) : null }
                        <span className="inline-flex items-center gap-1.5 text-[#245475]">
                          <ThumbsUp className="size-4 text-[#2d87a8]" />
                          { item.thumbsUp.toLocaleString() }
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-[#8d2f59]">
                          <Heart className="size-4 fill-[#bf3f73] text-[#bf3f73]" />
                          { item.love.toLocaleString() }
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-[#245475]">
                          <MessageSquareText className="size-4 text-[#2d87a8]" />
                          { item.commentsCount.toLocaleString() }
                        </span>
                        { item.kind === "latest" ? (
                          <span className="ml-auto inline-flex items-center rounded-full bg-[#eef6fb] px-2.5 py-1 text-xs uppercase tracking-[0.16em] text-[#2d6a82]">
                            { item.reviewType }
                          </span>
                        ) : null }
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