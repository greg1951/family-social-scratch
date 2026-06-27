"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

import { featureFaqItems } from "../types/constants";
import { useEffect, useMemo, useState } from "react";
import { HelpCircle } from "lucide-react";
import BackButton from "@/components/common/back-button";

const FEATURE_FAQ_CATEGORY_ALIASES: Record<string, string> = {
  "tv and move reviews": "TV and Movie Reviews",
  "tv and movie reviews": "TV and Movie Reviews",
};

function normalizeFeatureFaqCategory(category: string) {
  const normalizedCategory = category.trim();

  if (!normalizedCategory) {
    return "";
  }

  return FEATURE_FAQ_CATEGORY_ALIASES[normalizedCategory.toLowerCase()] ?? normalizedCategory;
}


// --- State for category selection ---
export function FeaturesFaqHomePage({ defaultCategory = "" }: { defaultCategory?: string }) {
  const faqItems = featureFaqItems;

  // Get unique categories from faqItems
  const categories = useMemo(() => {
    const set = new Set(faqItems.map((item) => item.category).filter(Boolean));
    return ["", "All", ...Array.from(set)];
  }, [faqItems]);

  const initialCategory = useMemo(() => {
    const normalizedCategory = normalizeFeatureFaqCategory(defaultCategory);
    if (!normalizedCategory) {
      return "";
    }

    return categories.includes(normalizedCategory) ? normalizedCategory : "";
  }, [categories, defaultCategory]);

  const [selectedCategory, setSelectedCategory] = useState(initialCategory);

  useEffect(() => {
    setSelectedCategory(initialCategory);
  }, [initialCategory]);

  // Filtered FAQ items
  const filteredFaqItems = useMemo(() => {
    if (!selectedCategory || selectedCategory === "All") return faqItems;
    return faqItems.filter((item) => item.category === selectedCategory);
  }, [faqItems, selectedCategory]);

  return (
    <section className="font-app w-full px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,rgba(10,64,79,0.95),rgba(24,115,143,0.9)_50%,rgba(249,197,121,0.85))] px-6 py-8 text-white shadow-[0_28px_80px_-40px_rgba(6,34,52,0.9)] sm:px-8">
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.34em] text-[#def8ff]">
            Support Frequently Asked Questions
          </p>
          <h1 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">
            Features
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-6 text-[#eafcff]">
            Browse the most common questions and answers about My Family Social Features.
          </p>
          <p className="mt-3 max-w-2xl text-xs leading-6 text-[#eafcff]">
            Current FAQ questions use TV Room as an example, but the information applies to many My Family Social features.
          </p>
          <div className="mt-0 flex items-center gap-4">
            <BackButton tw="border-white/35 bg-white/15 px-3 py-2 text-sm font-semibold text-[#eafcff] transition hover:-translate-y-0.5 " />
          </div>
        </div>

        {/* Category Selection */ }
        <div className="mt-3 flex justify-start">
          <select
            className="border border-[#d8e8ed] rounded-lg px-3 py-2 text-sm text-[#164657] bg-white focus:outline-none focus:ring-2 focus:ring-[#1976d2]"
            value={ selectedCategory }
            onChange={ (e) => setSelectedCategory(e.target.value) }
          >
            <option value="">Select FAQ Category</option>
            <option value="All">All</option>
            { categories.slice(2).map((cat) => (
              <option key={ cat } value={ cat }>{ cat }</option>
            )) }
          </select>
        </div>

        <div className="rounded-[1.8rem] border border-[#d8e8ed] bg-white p-5 shadow-[0_18px_50px_-36px_rgba(7,63,72,0.55)] sm:p-6">
          { filteredFaqItems.length === 0 ? (
            <div className="rounded-[1.4rem] border border-dashed border-[#c3d7de] bg-[#f8fcff] px-5 py-5 text-center text-[#4a6d79]">
              <HelpCircle className="mx-auto mb-3 size-9 text-[#608f9d]" />
              <p className="text-base font-semibold text-[#164657]">No published FAQs are available right now.</p>
              <p className="mt-1 text-sm">Please check back soon.</p>
            </div>
          ) : (
            <div className="grid gap-2">
              { filteredFaqItems.map((faqItem) => (
                <article
                  key={ faqItem.value }
                  className="rounded-[1.3rem] border border-[#d5e4e9] bg-[linear-gradient(180deg,#ffffff,#f8fcff)] p-2 sm:p-5"
                >
                  <Accordion type="single" collapsible>
                    <AccordionItem value={ faqItem.value }>
                      <AccordionTrigger>
                        <div>
                          { faqItem.trigger }
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        { faqItem.content }
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </article>
              )) }
            </div>
          ) }
        </div>
      </div>
    </section>
  );
}