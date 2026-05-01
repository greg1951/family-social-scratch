"use client";

import { Heart, MessageSquareText, ThumbsDown, ThumbsUp } from "lucide-react";
import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { extractS3KeyFromValue } from "@/lib/s3-object-key";
import { cn } from "@/lib/utils";

type LatestRecipe = {
  kind: "latest";
  name: string;
  date: string;
  submitterLikenessDegree: number | null;
  commentsCount: number;
  thumbsUp: number;
  love: number;
  imageSrc: string;
  imageAlt: string;
};

type TopRatedRecipe = {
  kind: "top-rated";
  name: string;
  submitterLikenessDegree: number | null;
  noRating: number;
  thumbsUp: number;
  love: number;
  commentsCount: number;
  imageSrc: string;
  imageAlt: string;
};

type RecipeScrollItem = LatestRecipe | TopRatedRecipe;

type FoodiesScrollStripProps = {
  title: string;
  description: string;
  items: RecipeScrollItem[];
  accentClassName: string;
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

      if (!key || !key.startsWith("foodies/")) {
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
}: FoodiesScrollStripProps) {
  return (
    <Card className="overflow-hidden border-white/70 bg-white/80 shadow-[0_22px_65px_-38px_rgba(9,44,62,0.8)] backdrop-blur">
      <CardHeader className="gap-4 border-b border-[#d7ebf3] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(239,249,253,0.82))] px-5 py-5 sm:px-6">
        <div>
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#45829a]">
            Family Foodies
          </p>
          <CardTitle className="mt-2 text-2xl font-black tracking-tight text-[#15384a]">
            { title }
          </CardTitle>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5f7987]">{ description }</p>
        </div>
      </CardHeader>

      <CardContent className="px-4 py-4 sm:px-5 sm:py-5">
        <div
          className="grid max-h-132 grid-cols-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2"
        >
          { items.map((item) => (
            <article
              key={ item.name }
              className="min-w-0"
            >
              <div className={ cn("rounded-[1.6rem] p-px shadow-[0_18px_34px_-24px_rgba(17,53,70,0.72)]", accentClassName) }>
                <div className="overflow-hidden rounded-[calc(1.6rem-1px)] border border-white/80 bg-[#fbfeff]">
                  <div className="relative aspect-16/10 overflow-hidden">
                    <RecipeImage src={ item.imageSrc } alt={ item.imageAlt } />
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,rgba(4,24,34,0),rgba(4,24,34,0.78))]" />
                    { item.kind === "latest" ? (
                      <div className="absolute bottom-3 left-3 rounded-full bg-white/92 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.24em] text-[#275f75] shadow-sm">
                        Fresh recipe
                      </div>
                    ) : item.thumbsUp + item.love > 0 ? (
                      <div className="absolute bottom-3 left-3 rounded-full bg-white/92 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.24em] text-[#275f75] shadow-sm">
                        Fan favorite
                      </div>
                    ) : null }
                  </div>

                  <div className="space-y-3 px-4 py-4">
                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="min-w-0 line-clamp-2 text-base font-black tracking-tight text-[#13364a]">{ item.name }</h3>
                        <SubmitterRatingBadge likenessDegree={ item.submitterLikenessDegree } />
                      </div>
                      { item.kind === "latest" ? (
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-[#607887]">
                          <span>{ item.date }</span>
                          <span className="inline-flex items-center gap-1.5 font-semibold text-[#21536a]">
                            <ThumbsUp className="size-4 text-[#2d87a8]" />
                            { item.thumbsUp.toLocaleString() }
                          </span>
                          <span className="inline-flex items-center gap-1.5 font-semibold text-[#8f2f58]">
                            <Heart className="size-4 text-[#cf3f7f]" />
                            { item.love.toLocaleString() }
                          </span>
                          <span className="inline-flex items-center gap-1.5 font-semibold text-[#21536a]">
                            <MessageSquareText className="size-4 text-[#2d87a8]" />
                            { item.commentsCount.toLocaleString() }
                          </span>
                        </div>
                      ) : (
                        <div className="mt-2 grid gap-2 text-sm text-[#607887]">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="inline-flex items-center gap-1.5 font-semibold text-[#425e6d]">
                              <ThumbsDown className="size-4 text-[#7e99a7]" />
                              { item.noRating.toLocaleString() }
                            </span>
                            <span className="inline-flex items-center gap-1.5 font-semibold text-[#21536a]">
                              <ThumbsUp className="size-4 text-[#2d87a8]" />
                              { item.thumbsUp.toLocaleString() }
                            </span>
                            <span className="inline-flex items-center gap-1.5 font-semibold text-[#8f2f58]">
                              <Heart className="size-4 text-[#cf3f7f]" />
                              { item.love.toLocaleString() }
                            </span>
                          </div>
                          <span className="inline-flex items-center gap-1.5 font-semibold text-[#21536a]">
                            <MessageSquareText className="size-4 text-[#2d87a8]" />
                            { item.commentsCount.toLocaleString() }
                          </span>
                        </div>
                      ) }
                    </div>
                  </div>
                </div>
              </div>
            </article>
          )) }
        </div>
      </CardContent>
    </Card>
  );
}