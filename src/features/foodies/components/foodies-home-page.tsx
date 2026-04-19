"use client";

import { Clock3, Heart, MessageSquareText, Search, Sparkles, ThumbsUp, Utensils } from "lucide-react";
import { useDeferredValue, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";

import {
  toggleRecipeLikeAction,
  addRecipeCommentAction,
  getFoodiesRecipeDetailAction,
} from "@/app/(features)/(foodies)/foodies/actions";
import { FoodiesRecipe, FoodiesRecipeDetail } from "@/components/db/types/recipes";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FoodiesScrollStrip } from "@/features/foodies/components/foodies-scroll-strip";
import { MemberKeyDetails } from "@/features/family/types/family-steps";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatCreatedAt(createdAt: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(createdAt));
}

function createFinderCategory(recipe: FoodiesRecipe) {
  const primaryTag = recipe.tagNamesByType.course_type?.[0]
    ?? recipe.tagNamesByType.cuisine?.[0]
    ?? recipe.tagNamesByType.meal_time?.[0]
    ?? recipe.tagNamesByType.cooking_method?.[0]
    ?? recipe.tagNamesByType.dietary?.[0];

  return primaryTag ?? "General";
}

export function FoodiesHomePage({
  recipes,
  member,
}: {
  recipes: FoodiesRecipe[];
  member: MemberKeyDetails;
}) {
  const [isEngaging, startEngageTransition] = useTransition();
  const [selectedRecipeDetail, setSelectedRecipeDetail] = useState<FoodiesRecipeDetail | null>(null);
  const [commentText, setCommentText] = useState("");

  const selectedRecipeRecord = recipes[0] ?? null;
  const latestRecipeRecords = [...recipes]
    .sort((leftRecipe, rightRecipe) => +new Date(rightRecipe.updatedAt) - +new Date(leftRecipe.updatedAt))
    .slice(0, 8);

  const latestRecipes = latestRecipeRecords
    .map((recipe) => ({
      kind: "latest" as const,
      name: recipe.recipeTitle,
      date: formatDate(recipe.updatedAt),
      commentsCount: recipe.commentCount,
      thumbsUp: recipe.thumbsUpCount,
      love: recipe.loveCount,
      imageSrc: recipe.recipeImageUrl ?? "/images/foodies/banana-bread-tablet.png",
      imageAlt: `${ recipe.recipeTitle } recipe photo`,
    }));

  const topRatedRecipes = [...recipes]
    .sort((leftRecipe, rightRecipe) => {
      const leftScore = (leftRecipe.thumbsUpCount + (leftRecipe.loveCount * 2));
      const rightScore = (rightRecipe.thumbsUpCount + (rightRecipe.loveCount * 2));

      if (leftScore !== rightScore) {
        return rightScore - leftScore;
      }

      if (leftRecipe.commentCount !== rightRecipe.commentCount) {
        return rightRecipe.commentCount - leftRecipe.commentCount;
      }

      return +new Date(rightRecipe.updatedAt) - +new Date(leftRecipe.updatedAt);
    })
    .slice(0, 8)
    .map((recipe) => ({
      kind: "top-rated" as const,
      name: recipe.recipeTitle,
      noRating: recipe.noRatingCount,
      thumbsUp: recipe.thumbsUpCount,
      love: recipe.loveCount,
      commentsCount: recipe.commentCount,
      imageSrc: recipe.recipeImageUrl ?? "/images/foodies/vegetable-soup-tablet.png",
      imageAlt: `${ recipe.recipeTitle } recipe photo`,
    }));

  const recipeFinderRows = recipes.map((recipe) => ({
    id: recipe.id,
    name: recipe.recipeTitle,
    chef: recipe.submitterName,
    category: createFinderCategory(recipe),
    prepTimeMins: recipe.prepTimeMins,
    cookTimeMins: recipe.cookTimeMins,
    comments: recipe.commentCount,
  }));

  const [searchValue, setSearchValue] = useState("");
  const [selectedRecipe, setSelectedRecipe] = useState(recipeFinderRows[0]?.id ?? 0);
  const deferredSearchValue = useDeferredValue(searchValue);

  const filteredRecipes = recipeFinderRows.filter((recipe) => {
    const query = deferredSearchValue.trim().toLowerCase();

    if (!query) {
      return true;
    }

    return [recipe.name, recipe.chef, recipe.category, String(recipe.prepTimeMins), String(recipe.cookTimeMins)]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });

  useEffect(() => {
    if (!selectedRecipe) {
      setSelectedRecipeDetail(null);
      return;
    }

    let isCancelled = false;

    startEngageTransition(async () => {
      const result = await getFoodiesRecipeDetailAction({ recipeId: selectedRecipe });

      if (isCancelled) {
        return;
      }

      if (!result.success) {
        setSelectedRecipeDetail(null);
        return;
      }

      setSelectedRecipeDetail(result.recipe);
    });

    return () => {
      isCancelled = true;
    };
  }, [selectedRecipe]);

  const selectedRecipeName = recipeFinderRows.find((recipe) => recipe.id === selectedRecipe)?.name ?? "";
  const selectedRecipeBasic =
    (selectedRecipeDetail?.id === selectedRecipe
      ? selectedRecipeDetail
      : recipes.find((recipe) => recipe.id === selectedRecipe))
    ?? selectedRecipeRecord;
  const canEditSelectedRecipe = selectedRecipeBasic?.memberId === member.memberId;
  const topRatedRecipesWithReactions = topRatedRecipes.filter((recipe) => recipe.thumbsUp + recipe.love > 0).length;

  function handleSelectRecipe(recipeId: number) {
    setCommentText("");
    const recipe = recipes.find((r) => r.id === recipeId);
    if (recipe) {
      setSelectedRecipe(recipeId);
      setSelectedRecipeDetail(null);
    }
  }

  function handleToggleLike(likenessDegree: number) {
    if (!selectedRecipeBasic) {
      return;
    }

    startEngageTransition(async () => {
      const result = await toggleRecipeLikeAction({
        recipeId: selectedRecipeBasic.id,
        likenessDegree,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      setSelectedRecipeDetail(result.recipe);
      toast.success(result.message);
    });
  }

  function handleAddComment() {
    if (!selectedRecipeBasic) {
      return;
    }

    const normalizedComment = commentText.trim();

    if (normalizedComment.length < 2) {
      toast.error("Enter at least 2 characters before posting your comment.");
      return;
    }

    startEngageTransition(async () => {
      const result = await addRecipeCommentAction({
        recipeId: selectedRecipeBasic.id,
        commentText: normalizedComment,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      setSelectedRecipeDetail(result.recipe);
      setCommentText("");
      toast.success(result.message);
    });
  }

  return (
    <section className="w-full px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,rgba(49,67,29,0.95),rgba(87,124,36,0.88)_56%,rgba(199,216,126,0.82))] px-6 py-8 text-white shadow-[0_28px_80px_-40px_rgba(40,54,21,0.95)] sm:px-8 lg:px-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.34em] text-[#e9ffd0]">
                Family Foodies
              </p>
              <Link
                href="/"
                className="mt-3 inline-flex items-center rounded-full border border-white/35 bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#f1ffe4] transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                Back to Main Page
              </Link>
              <h1 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">
                Keep your family&apos;s recipes together in one place
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#f1ffe4] sm:text-base">
                Browse the latest uploads and top family favorites. , then add your own.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/foodies/add-recipe"
                  className="inline-flex items-center rounded-full border border-white/35 bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#f1ffe4] transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <Sparkles className="mr-2 size-4" />
                  Add Recipe
                </Link>
                <Link
                  href="/foodies/templates"
                  className="inline-flex items-center rounded-full border border-white/35 bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#f1ffe4] transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  Manage Templates
                </Link>
                { canEditSelectedRecipe && selectedRecipeBasic ? (
                  <Link
                    href={ `/foodies/edit-recipe/${ selectedRecipeBasic.id }` }
                    className="inline-flex items-center rounded-full border border-white/35 bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#f1ffe4] transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    Edit Recipe
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="inline-flex items-center rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white/55"
                  >
                    Edit Recipe
                  </button>
                ) }
              </div>
            </div>

            <div className="grid gap-3 rounded-[1.6rem] border border-white/20 bg-white/10 p-4 shadow-inner backdrop-blur sm:grid-cols-3 lg:min-w-[24rem]">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[#e9ffd0]">Latest</p>
                <p className="mt-2 text-2xl font-black">{ latestRecipes.length }</p>
                <p className="text-sm text-[#f1ffe4]">fresh recipes</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[#e9ffd0]">Top Rated</p>
                <p className="mt-2 text-2xl font-black">{ topRatedRecipesWithReactions }</p>
                <p className="text-sm text-[#f1ffe4]">with reactions</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[#e9ffd0]">Finder</p>
                <p className="mt-2 text-2xl font-black">{ recipes.length }</p>
                <p className="text-sm text-[#f1ffe4]">searchable recipes</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:items-start">
          <div className="space-y-6">
            <FoodiesScrollStrip
              title="Latest Recipes"
              description="New dishes added by family members. Use arrows on larger screens, or scroll vertically on small screens."
              items={ latestRecipes }
              accentClassName="bg-[linear-gradient(135deg,#d3f0b3,#fff6c9)]"
            />

            <FoodiesScrollStrip
              title="Top Rated Recipes"
              description="Family reaction totals based on no-rating, thumbs-up, and love reactions, plus comment counts."
              items={ topRatedRecipes }
              accentClassName="bg-[linear-gradient(135deg,#ffd7a8,#ffd0b7)]"
            />
          </div>

          <div className="overflow-hidden rounded-[1.9rem] border border-white/70 bg-white/82 shadow-[0_24px_70px_-40px_rgba(38,54,26,0.75)] backdrop-blur">
            <div className="border-b border-[#dbeacc] bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(245,251,235,0.88))] px-5 py-5 sm:px-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#5f7a40]">
                    Recipe Directory
                  </p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-[#2f4820]">Recipe Finder</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[#647a50]">
                    Search the recipe list, then select a row to keep one dish highlighted while you browse details.
                  </p>
                </div>

                <div className="rounded-full border border-[#dbeacc] bg-[#f7fce8] px-4 py-2 text-sm font-semibold text-[#415d2c]">
                  { filteredRecipes.length } recipes found
                </div>
              </div>

              <div className="relative mt-5">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#647a50]" />
                <Input
                  type="search"
                  value={ searchValue }
                  onChange={ (event) => setSearchValue(event.target.value) }
                  placeholder="Search by recipe, chef, category, or time"
                  className="h-12 rounded-full border-[#ccdfb9] bg-white pl-11 pr-4 text-sm text-[#2f4820] shadow-sm"
                  aria-label="Search recipes"
                />
              </div>
            </div>

            <div className="px-4 py-4 sm:px-6 sm:py-5">
              <div className="mb-4 flex flex-wrap items-center gap-3 rounded-[1.35rem] bg-[linear-gradient(135deg,#f4fae7,#fbfff3)] px-4 py-3 text-sm text-[#4f6f36]">
                <Utensils className="size-4 text-[#5e8a2f]" />
                <span className="font-semibold text-[#2f4820]">Selected recipe:</span>
                <span>{ selectedRecipeName || "Choose a recipe from the list" }</span>
              </div>

              <div className="overflow-hidden rounded-[1.4rem] border border-[#dbeacc]">
                <div className="max-h-232 overflow-auto">
                  <table className="min-w-4xl border-collapse text-left">
                    <thead className="sticky top-0 z-10 bg-[#f1f8df] text-xs uppercase tracking-[0.18em] text-[#5b7544]">
                      <tr>
                        <th className="px-4 py-3 font-bold">Recipe Name</th>
                        <th className="px-4 py-3 font-bold">Chef</th>
                        <th className="px-4 py-3 font-bold">Category</th>
                        <th className="px-4 py-3 font-bold">Prep Time</th>
                        <th className="px-4 py-3 font-bold">Cook Time</th>
                        <th className="px-4 py-3 font-bold">Comments</th>
                      </tr>
                    </thead>
                    <tbody>
                      { filteredRecipes.map((recipe) => {
                        const isSelected = selectedRecipe === recipe.id;

                        return (
                          <tr
                            key={ recipe.id }
                            className="border-t border-[#e7f0d9] bg-white transition hover:bg-[#fbfff3]"
                          >
                            <td className="px-2 py-2 sm:px-3">
                              <button
                                type="button"
                                onClick={ () => handleSelectRecipe(recipe.id) }
                                className={ [
                                  "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9fd46a]",
                                  isSelected ? "bg-[#f3fce7] shadow-sm" : "hover:bg-[#f7fde9]",
                                ].join(" ") }
                              >
                                <span className="font-semibold text-[#2f4820]">{ recipe.name }</span>
                                { isSelected ? (
                                  <span className="rounded-full bg-[#425c2d] px-2 py-1 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-white">
                                    Selected
                                  </span>
                                ) : null }
                              </button>
                            </td>
                            <td className="px-4 py-3 text-sm text-[#4e6640]">{ recipe.chef }</td>
                            <td className="px-4 py-3 text-sm text-[#4e6640]">{ recipe.category }</td>
                            <td className="px-4 py-3 text-sm text-[#4e6640]">
                              <span className="inline-flex items-center gap-2 font-semibold text-[#476232]">
                                <Clock3 className="size-4 text-[#5d7f3f]" />
                                { recipe.prepTimeMins > 0 ? `${ recipe.prepTimeMins } min` : "-" }
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-[#4e6640]">
                              { recipe.cookTimeMins > 0 ? `${ recipe.cookTimeMins } min` : "-" }
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold text-[#476232]">
                              <span className="inline-flex items-center gap-2">
                                <MessageSquareText className="size-4 text-[#5d7f3f]" />
                                { recipe.comments }
                              </span>
                            </td>
                          </tr>
                        );
                      }) }
                    </tbody>
                  </table>
                </div>

                { filteredRecipes.length === 0 ? (
                  <div className="border-t border-[#e7f0d9] px-4 py-8 text-center text-sm text-[#647a50]">
                    No recipes match that search yet.
                  </div>
                ) : null }
              </div>
            </div>

            <div className="overflow-hidden rounded-[1.9rem] border border-white/70 bg-white/90 shadow-[0_24px_70px_-40px_rgba(38,54,26,0.75)]">
              <div className="border-b border-[#dbeacc] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(245,251,235,0.88))] px-5 py-5 sm:px-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#5f7a40]">
                      Recipe Reactions
                    </p>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-[#647a50]">
                      Like or love this recipe, and share your thoughts with the family.
                    </p>
                  </div>
                  <div className="inline-flex items-center rounded-full border border-[#dbeacc] bg-[#f7fce8] px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[#415d2c]">
                    <MessageSquareText className="mr-2 size-3.5" />
                    { selectedRecipeDetail?.commentCount ?? selectedRecipeBasic?.commentCount ?? 0 } comments
                  </div>
                </div>
              </div>

              <div className="space-y-5 px-5 py-5 sm:px-6">
                { selectedRecipeBasic ? (
                  <>
                    <div className="space-y-3 rounded-[1.4rem] border border-[#dbeacc] bg-[#f7fce8] p-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <Button
                          type="button"
                          onClick={ () => handleToggleLike(1) }
                          disabled={ !selectedRecipeBasic || isEngaging }
                          className="rounded-full bg-[#578c24] text-white hover:bg-[#4a7320]"
                          aria-label={ selectedRecipeDetail?.likenessDegree === 1 ? "Remove thumbs up" : "Add thumbs up" }
                        >
                          <ThumbsUp className={ `size-4 ${ selectedRecipeDetail?.likenessDegree === 1 ? "fill-white" : "" }` } />
                        </Button>
                        <Button
                          type="button"
                          onClick={ () => handleToggleLike(2) }
                          disabled={ !selectedRecipeBasic || isEngaging }
                          className="rounded-full bg-[#d9842a] text-white hover:bg-[#c5731f]"
                          aria-label={ selectedRecipeDetail?.likenessDegree === 2 ? "Remove love" : "Add love" }
                        >
                          <Heart className={ `size-4 ${ selectedRecipeDetail?.likenessDegree === 2 ? "fill-white" : "" }` } />
                        </Button>
                      </div>
                      <div className="flex flex-wrap items-center gap-4">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-[#476232]">
                          <ThumbsUp className="size-4 text-[#578c24]" />
                          { (selectedRecipeDetail?.thumbsUpCount ?? selectedRecipeBasic?.thumbsUpCount ?? 0).toLocaleString() }
                        </span>
                        <span className="inline-flex items-center gap-1.5 font-semibold text-[#476232]">
                          <Heart className="size-4 fill-[#d9842a] text-[#d9842a]" />
                          { (selectedRecipeDetail?.loveCount ?? selectedRecipeBasic?.loveCount ?? 0).toLocaleString() }
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3 rounded-[1.4rem] border border-[#dbeacc] bg-[#f7fce8] p-4">
                      <div>
                        <p className="text-sm font-semibold text-[#2f4820]">Family Comments</p>
                        <p className="text-sm text-[#647a50]">Share your thoughts on this recipe with your family.</p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-[#2f4820]" htmlFor="recipe-comment-input">
                          Add Comment
                        </label>
                        <textarea
                          id="recipe-comment-input"
                          value={ commentText }
                          onChange={ (event) => setCommentText(event.target.value) }
                          placeholder="What do you think about this recipe?"
                          disabled={ !selectedRecipeBasic || isEngaging }
                          className="min-h-24 w-full rounded-xl border border-[#dbeacc] bg-white px-3 py-2 text-sm text-[#2f4820] outline-none transition focus-visible:ring-2 focus-visible:ring-[#578c24]"
                        />
                        <div className="flex justify-end">
                          <Button
                            type="button"
                            onClick={ handleAddComment }
                            disabled={ !selectedRecipeBasic || isEngaging || commentText.trim().length < 2 }
                            className="rounded-full bg-[#578c24] text-white hover:bg-[#4a7320]"
                          >
                            Post Comment
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        { selectedRecipeDetail?.id === selectedRecipe && selectedRecipeDetail.recipeComments.length === 0 ? (
                          <p className="rounded-2xl border border-dashed border-[#dbeacc] bg-white px-3 py-2 text-sm text-[#647a50]">
                            No comments yet. Be the first family member to add one.
                          </p>
                        ) : selectedRecipeDetail?.id !== selectedRecipe ? (
                          <p className="rounded-2xl border border-dashed border-[#dbeacc] bg-white px-3 py-2 text-sm text-[#647a50]">
                            Loading comments...
                          </p>
                        ) : (
                          (selectedRecipeDetail?.recipeComments ?? []).map((comment) => (
                            <article key={ comment.id } className="rounded-2xl border border-[#dbeacc] bg-white px-3 py-3 text-sm text-[#4e6640]">
                              <p className="whitespace-pre-wrap leading-6">{ comment.text || "(No text in comment)" }</p>
                              <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[#7a8f5f]">
                                { comment.commenterName } · { formatCreatedAt(comment.createdAt) }
                              </p>
                            </article>
                          ))
                        ) }
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="rounded-[1.5rem] border border-dashed border-[#dbeacc] bg-[#faf8ff] px-6 py-10 text-center text-[#647a50]">
                    <MessageSquareText className="mx-auto mb-3 size-10 text-[#8fa973]" />
                    <p className="text-lg font-semibold text-[#2f4820]">Select a recipe to view comments.</p>
                    <p className="mt-2 text-sm">Choose a recipe from the finder list to see and post comments.</p>
                  </div>
                ) }
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}