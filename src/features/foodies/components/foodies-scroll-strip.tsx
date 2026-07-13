"use client";

import { Heart, MessageSquare, MessageSquareText, ThumbsDown, ThumbsUp } from "lucide-react";
import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { extractS3KeyFromValue } from "@/lib/s3-object-key";
import { cn } from "@/lib/utils";

type LatestRecipe = {
  kind: "latest";
  id: number;
  name: string;
  date: string;
  status: string;
  submitterName: string;
  submitterLikenessDegree: number | null;
  commentsCount: number;
  thumbsUp: number;
  love: number;
  hasDiscussionThread: boolean;
  imageSrc: string;
  imageAlt: string;
};

type TopRatedRecipe = {
  kind: "top-rated";
  id: number;
  name: string;
  date: string;
  status: string;
  submitterName: string;
  submitterLikenessDegree: number | null;
  noRating: number;
  thumbsUp: number;
  love: number;
  commentsCount: number;
  hasDiscussionThread: boolean;
  imageSrc: string;
  imageAlt: string;
};

type AllRecipe = {
  kind: "all";
  id: number;
  name: string;
  date: string;
  status: string;
  submitterName: string;
  submitterLikenessDegree: number | null;
  commentsCount: number;
  thumbsUp: number;
  love: number;
  hasDiscussionThread: boolean;
  imageSrc: string;
  imageAlt: string;
};

type RecipeScrollItem = LatestRecipe | TopRatedRecipe | AllRecipe;

type FoodiesScrollStripProps = {
  title: string;
  description: string;
  items: RecipeScrollItem[];
  accentClassName: string;
  selectedItemId?: number;
  onSelectItem?: (id: number) => void;
  onOpenItem?: (id: number) => void;
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

function RecipeImage({ src, alt }: { src: string; alt: string }) {
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

    resolveSignedUrl();

    return () => {
      isCancelled = true;
    };
  }, [src]);

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={ resolvedSrc } alt={ alt } className="h-full w-full object-cover" />;
}

export function FoodiesScrollStrip({
  title,
  description,
  items,
  accentClassName,
  selectedItemId,
  onSelectItem,
  onOpenItem,
}: FoodiesScrollStripProps) {
  return (
    <Card className="overflow-hidden border-white/70 bg-white/85 shadow-[0_22px_65px_-38px_rgba(38,54,26,0.78)] backdrop-blur">
      <CardHeader className="gap-0.5 border-b border-[#dbeacc] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(245,251,235,0.86))] px-4 py-1.5 sm:px-5 sm:py-2.5">
        <div>
          <CardTitle className="mt-0 text-lg font-black tracking-tight text-[#2f4820] sm:text-xl">
            { title }
          </CardTitle>
          {/* <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5f7987]">{ description }</p> */ }
        </div>
      </CardHeader>

      <CardContent className="px-3 pb-1 pt-1 sm:px-5 sm:py-5">
        <div
          className="grid max-h-132 grid-cols-2 gap-2 overflow-y-auto px-1 pb-1 pt-0.5 md:grid-cols-4 lg:grid-cols-4 sm:pt-1"
        >
          { items.map((item) => {
            const isSelected = selectedItemId === item.id;

            return (
              <article
                key={ item.name }
                className="min-w-0"
              >
                <div className={ cn("rounded-[1.6rem] p-px shadow-[0_18px_34px_-24px_rgba(40,62,26,0.68)]", isSelected ? "ring-2 ring-[#578c24] ring-offset-1" : accentClassName) }>
                  <div
                    role={ onSelectItem ? "button" : undefined }
                    tabIndex={ onSelectItem ? 0 : undefined }
                    onClick={ onSelectItem ? () => onSelectItem(item.id) : undefined }
                    onDoubleClick={ onOpenItem ? () => onOpenItem(item.id) : undefined }
                    onKeyDown={ onSelectItem ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelectItem(item.id); } } : undefined }
                    aria-label={ onSelectItem ? (isSelected ? `${ item.name } is selected` : `Select ${ item.name }`) : undefined }
                    aria-pressed={ onSelectItem ? isSelected : undefined }
                    className={ cn(
                      "overflow-hidden rounded-[calc(1.6rem-1px)] border border-white/80 bg-[#fbfdf7]",
                      onSelectItem && "cursor-pointer",
                      onSelectItem && !isSelected && "hover:bg-[#eef7df]",
                      isSelected && "bg-[#e5f2d2]",
                    ) }
                  >
                    <div className="relative aspect-[16/6.7] overflow-hidden sm:aspect-16/10">
                      <RecipeImage src={ item.imageSrc } alt={ item.imageAlt } />
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,rgba(4,24,34,0),rgba(4,24,34,0.78))]" />
                      { item.hasDiscussionThread ? (
                        <div className="pointer-events-none absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/92 text-[#578c24] shadow-sm">
                          <MessageSquare className="size-4" aria-label="Discussion thread available" />
                        </div>
                      ) : null }
                    </div>

                    <div className="space-y-3 px-4 py-4">
                      <div>
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="min-w-0 select-none text-sm font-black leading-snug tracking-tight text-[#2f4820]">{ item.name }</h3>
                          <SubmitterRatingBadge likenessDegree={ item.submitterLikenessDegree } />
                        </div>
                        <div className="mt-1 flex select-none flex-wrap items-center gap-1 text-[11px] text-[#647a50] sm:flex-nowrap">
                          <span className="whitespace-nowrap font-semibold text-[#476232]">{ item.submitterName }</span>
                          <span className="text-[#8ca479]">.</span>
                          <span className="whitespace-nowrap">{ item.date }</span>
                        </div>
                        { item.status === "draft" ? (
                          <div className="mt-2 inline-flex select-none rounded-full border border-[#f0c36c] bg-[#fff6df] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#9a6b15]">
                            Draft
                          </div>
                        ) : null }
                        { item.kind !== "top-rated" ? (
                          <div className="pointer-events-none mt-1 flex select-none flex-wrap items-center gap-2 text-xs text-[#647a50]">
                            <span className="inline-flex items-center gap-1 font-semibold text-[#476232]">
                              <ThumbsUp className="size-3 text-[#578c24]" />
                              { item.thumbsUp.toLocaleString() }
                            </span>
                            <span className="inline-flex items-center gap-1 font-semibold text-[#8f2f58]">
                              <Heart className="size-3 text-[#cf3f7f]" />
                              { item.love.toLocaleString() }
                            </span>
                            <span className="inline-flex items-center gap-1 font-semibold text-[#476232]">
                              <MessageSquareText className="size-3 text-[#578c24]" />
                              { item.commentsCount.toLocaleString() }
                            </span>
                          </div>
                        ) : (
                          <div className="pointer-events-none mt-1 flex select-none flex-wrap items-center gap-2 text-xs text-[#647a50]">
                            <span className="inline-flex items-center gap-1 font-semibold text-[#5a7250]">
                              <ThumbsDown className="size-3 text-[#7a8f5f]" />
                              { item.noRating.toLocaleString() }
                            </span>
                            <span className="inline-flex items-center gap-1 font-semibold text-[#476232]">
                              <ThumbsUp className="size-3 text-[#578c24]" />
                              { item.thumbsUp.toLocaleString() }
                            </span>
                            <span className="inline-flex items-center gap-1 font-semibold text-[#8f2f58]">
                              <Heart className="size-3 text-[#cf3f7f]" />
                              { item.love.toLocaleString() }
                            </span>
                            <span className="inline-flex items-center gap-1 font-semibold text-[#476232]">
                              <MessageSquareText className="size-3 text-[#578c24]" />
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