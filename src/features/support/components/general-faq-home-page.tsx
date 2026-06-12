"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

import { generalFaqItems } from "../types/constants";
import { useState, useMemo } from "react";
import { HelpCircle, ArrowLeft } from "lucide-react";
import type { FaqVideoItem } from "@/components/db/sql/queries-videos";
import Link from "next/link";


// --- State for category selection ---
export function GeneralFaqHomePage({ faqVideos }: { faqVideos: FaqVideoItem[] }) {
  const faqItems = generalFaqItems;

  const [selectedCategory, setSelectedCategory] = useState("");

  // Get unique categories from faqItems
  const categories = useMemo(() => {
    const set = new Set(faqItems.map((item) => item.category).filter(Boolean));
    return ["", "All", ...Array.from(set)];
  }, [faqItems]);

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
            Support
          </p>
          <h1 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">
            Frequently Asked Questions
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#eafcff]">
            Browse the most common questions and answers for account access, family setup, and support workflow.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            {/* <div className="inline-flex rounded-full border border-white/35 bg-white/15 px-4 py-2 text-sm font-semibold">
              { filteredFaqItems.length } Published FAQ{ filteredFaqItems.length === 1 ? "" : "s" }
            </div> */}
            <Link href="/" className="inline-flex items-center rounded-full border border-white/40 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#edfcff] transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
              <ArrowLeft className="mr-2 size-4" />
              Return to Main Page
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <section className="rounded-[1.8rem] border border-[#d8e8ed] bg-white p-5 shadow-[0_18px_50px_-36px_rgba(7,63,72,0.55)] sm:p-6">
            <div className="mb-4">
              <h2 className="text-lg font-bold tracking-tight text-[#164657]">Video Help</h2>
              <p className="text-sm text-[#4a6d79]">Watch short walkthroughs grouped by video name, caption, and sequence.</p>
            </div>

            { faqVideos.length === 0 ? (
              <div className="rounded-[1.4rem] border border-dashed border-[#c3d7de] bg-[#f8fcff] px-5 py-5 text-center text-[#4a6d79]">
                <HelpCircle className="mx-auto mb-3 size-9 text-[#608f9d]" />
                <p className="text-base font-semibold text-[#164657]">No published videos are available right now.</p>
                <p className="mt-1 text-sm">Please check back soon.</p>
              </div>
            ) : (
              <Accordion type="multiple" className="rounded-[1.3rem] border border-[#d5e4e9] bg-[linear-gradient(180deg,#ffffff,#f8fcff)] px-3 py-2 sm:px-4">
                {faqVideos.map((videoItem) => (
                  <AccordionItem key={videoItem.id} value={`video-${videoItem.id}`}>
                    <AccordionTrigger>
                      <div className="text-left">
                        <p className="text-base font-semibold text-[#164657]">{videoItem.videoName}</p>
                        <p className="text-xs text-slate-600">{videoItem.caption} | video #{videoItem.seqNo} | {videoItem.durationMinutes} min</p>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 text-sm text-[#305867]">
                        <details className="rounded-xl border border-[#cfe0e8] bg-white/80 p-3">
                          <summary className="cursor-pointer text-sm font-semibold text-[#164657]">Preview Video</summary>
                          <div className="mt-3 overflow-hidden rounded-lg border border-[#d8e8ed] bg-black">
                            <video
                              controls
                              preload="metadata"
                              className="h-auto w-full"
                              src={videoItem.playbackUrl}
                            >
                              Your browser does not support the video tag.
                            </video>
                          </div>
                        </details>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </section>

          <section className="rounded-[1.8rem] border border-[#d8e8ed] bg-white p-5 shadow-[0_18px_50px_-36px_rgba(7,63,72,0.55)] sm:p-6">
            <div className="mb-4">
              <h2 className="text-lg font-bold tracking-tight text-[#164657]">Text Help</h2>
              <p className="text-sm text-[#4a6d79]">Browse FAQ topics with details and screenshots.</p>
            </div>

            <div className="mb-4 flex justify-start">
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

            { filteredFaqItems.length === 0 ? (
              <div className="rounded-[1.4rem] border border-dashed border-[#c3d7de] bg-[#f8fcff] px-5 py-5 text-center text-[#4a6d79]">
                <HelpCircle className="mx-auto mb-3 size-9 text-[#608f9d]" />
                <p className="text-base font-semibold text-[#164657]">No published FAQs are available right now.</p>
                <p className="mt-1 text-sm">Please check back soon.</p>
              </div>
            ) : (
              <div className="grid gap-1.5">
                { filteredFaqItems.map((faqItem) => (
                  <article
                    key={ faqItem.value }
                    className="rounded-[1.3rem] border border-[#d5e4e9] bg-[linear-gradient(180deg,#ffffff,#f8fcff)] p-2 sm:p-3"
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
          </section>
        </div>
      </div>
    </section>
  );
}