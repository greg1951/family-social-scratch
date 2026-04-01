"use client";

import { Clock3, MessageSquareText, Search, Star, Utensils } from "lucide-react";
import { useDeferredValue, useState } from "react";
import Link from "next/link";

import { Input } from "@/components/ui/input";
import { FoodiesScrollStrip } from "@/features/foodies/components/foodies-scroll-strip";

const latestRecipes = [
  {
    kind: "latest" as const,
    name: "Steamed Dumplings",
    date: "March 12, 2026",
    imageSrc: "/images/foodies/steamed-dumplings-tablet.png",
    imageAlt: "Steamed dumplings recipe photo",
  },
  {
    kind: "latest" as const,
    name: "Tofu Burger",
    date: "March 3, 2026",
    imageSrc: "/images/foodies/tofu-burger-tablet.png",
    imageAlt: "Tofu burger recipe photo",
  },
  {
    kind: "latest" as const,
    name: "Banana Bread",
    date: "February 24, 2026",
    imageSrc: "/images/foodies/banana-bread-tablet.png",
    imageAlt: "Banana bread recipe photo",
  },
  {
    kind: "latest" as const,
    name: "Vegetable Soup",
    date: "February 11, 2026",
    imageSrc: "/images/foodies/vegetable-soup-tablet.png",
    imageAlt: "Vegetable soup recipe photo",
  },
];

const topRatedRecipes = [
  {
    kind: "top-rated" as const,
    name: "Mac N Cheese",
    rating: 5,
    recommendations: 226,
    imageSrc: "/images/foodies/mac-n-cheese-tablet.png",
    imageAlt: "Mac and cheese recipe photo",
  },
  {
    kind: "top-rated" as const,
    name: "Veggie Pizza",
    rating: 5,
    recommendations: 192,
    imageSrc: "/images/foodies/veggie-pizza-tablet.png",
    imageAlt: "Veggie pizza recipe photo",
  },
  {
    kind: "top-rated" as const,
    name: "Scalloped Pineapple",
    rating: 4,
    recommendations: 168,
    imageSrc: "/images/foodies/scalloped-pineapple-tablet.png",
    imageAlt: "Scalloped pineapple recipe photo",
  },
  {
    kind: "top-rated" as const,
    name: "Wiener Schnizel",
    rating: 4,
    recommendations: 154,
    imageSrc: "/images/foodies/wiener-schnizel-tablet.png",
    imageAlt: "Wiener schnizel recipe photo",
  },
];

const recipeFinderRows = [
  {
    name: "Steamed Dumplings",
    chef: "Nina",
    category: "Dinner",
    prepTime: "25 min",
    cookTime: "15 min",
    comments: 33,
  },
  {
    name: "Tofu Burger",
    chef: "Isaac",
    category: "Lunch",
    prepTime: "20 min",
    cookTime: "12 min",
    comments: 24,
  },
  {
    name: "Banana Bread",
    chef: "Grace",
    category: "Dessert",
    prepTime: "15 min",
    cookTime: "55 min",
    comments: 41,
  },
  {
    name: "Vegetable Soup",
    chef: "Ruth",
    category: "Soup",
    prepTime: "18 min",
    cookTime: "35 min",
    comments: 28,
  },
  {
    name: "Mac N Cheese",
    chef: "Mila",
    category: "Comfort Food",
    prepTime: "14 min",
    cookTime: "22 min",
    comments: 47,
  },
  {
    name: "Veggie Pizza",
    chef: "Ben",
    category: "Dinner",
    prepTime: "25 min",
    cookTime: "18 min",
    comments: 36,
  },
  {
    name: "Scalloped Pineapple",
    chef: "Henry",
    category: "Side Dish",
    prepTime: "20 min",
    cookTime: "40 min",
    comments: 19,
  },
  {
    name: "Wiener Schnizel",
    chef: "Owen",
    category: "Dinner",
    prepTime: "22 min",
    cookTime: "16 min",
    comments: 22,
  },
];

export function FoodiesHomePage() {
  const [searchValue, setSearchValue] = useState("");
  const [selectedRecipe, setSelectedRecipe] = useState(recipeFinderRows[0]?.name ?? "");
  const deferredSearchValue = useDeferredValue(searchValue);

  const filteredRecipes = recipeFinderRows.filter((recipe) => {
    const query = deferredSearchValue.trim().toLowerCase();

    if (!query) {
      return true;
    }

    return [recipe.name, recipe.chef, recipe.category]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });

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
              {/* <p className="mt-4 max-w-2xl text-sm leading-7 text-[#f1ffe4] sm:text-base">
                Discover the latest dishes, see the top-rated classics, and quickly find the next recipe your family wants to cook.
              </p> */}
            </div>

            <div className="grid gap-3 rounded-[1.6rem] border border-white/20 bg-white/10 p-4 shadow-inner backdrop-blur sm:grid-cols-3 lg:min-w-[24rem]">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[#e9ffd0]">Latest</p>
                <p className="mt-2 text-2xl font-black">4</p>
                <p className="text-sm text-[#f1ffe4]">fresh recipes</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[#e9ffd0]">Top Rated</p>
                <p className="mt-2 text-2xl font-black">4.6</p>
                <p className="text-sm text-[#f1ffe4]">average rating</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[#e9ffd0]">Finder</p>
                <p className="mt-2 text-2xl font-black">8</p>
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
              description="Favorites with star ratings and recommendation totals from your family cooking circle."
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
                  placeholder="Search by recipe, chef, or category"
                  className="h-12 rounded-full border-[#ccdfb9] bg-white pl-11 pr-4 text-sm text-[#2f4820] shadow-sm"
                  aria-label="Search recipes"
                />
              </div>
            </div>

            <div className="px-4 py-4 sm:px-6 sm:py-5">
              <div className="mb-4 flex flex-wrap items-center gap-3 rounded-[1.35rem] bg-[linear-gradient(135deg,#f4fae7,#fbfff3)] px-4 py-3 text-sm text-[#4f6f36]">
                <Utensils className="size-4 text-[#5e8a2f]" />
                <span className="font-semibold text-[#2f4820]">Selected recipe:</span>
                <span>{ selectedRecipe || "Choose a recipe from the list" }</span>
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
                        const isSelected = selectedRecipe === recipe.name;

                        return (
                          <tr
                            key={ recipe.name }
                            className="border-t border-[#e7f0d9] bg-white transition hover:bg-[#fbfff3]"
                          >
                            <td className="px-2 py-2 sm:px-3">
                              <button
                                type="button"
                                onClick={ () => setSelectedRecipe(recipe.name) }
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
                                { recipe.prepTime }
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-[#4e6640]">{ recipe.cookTime }</td>
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
          </div>
        </div>
      </div>
    </section>
  );
}