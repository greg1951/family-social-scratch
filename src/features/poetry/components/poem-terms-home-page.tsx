"use client";

import LinkExtension from "@tiptap/extension-link";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor } from "@tiptap/react";
import { ArrowLeft, BookText, PenSquare, Plus, Search, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import {
  createTextTipTapDocument,
  parseSerializedTipTapDocument,
  serializeTipTapDocument,
} from "@/components/db/types/poem-term-validation";
import { PoemTerm } from "@/components/db/types/poem-verses";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// import FeatureFaqHelp from "@/components/common/feature-faq-help";

type PoemTermsHomePageProps = {
  poemTerms: PoemTerm[];
  isAdmin: boolean;
};

function parseTermContent(termJson: string | undefined) {
  if (!termJson) {
    return createTextTipTapDocument("Select a poetry term to view its details.");
  }

  const parsed = parseSerializedTipTapDocument(termJson);

  if (parsed.success) {
    return parsed.content;
  }

  return createTextTipTapDocument(parsed.message);
}

function PoemTermPreview({ termJson, expanded = false }: { termJson?: string; expanded?: boolean }) {
  const previewEditor = useEditor({
    extensions: [
      StarterKit,
      LinkExtension.configure({
        autolink: true,
        defaultProtocol: "https",
        openOnClick: true,
      }),
    ],
    content: parseTermContent(termJson),
    editable: false,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "tiptap text-sm leading-6 text-[#5f466f] focus:outline-none",
      },
    },
  });

  useEffect(() => {
    if (!previewEditor) {
      return;
    }

    const nextContent = parseTermContent(termJson);
    const editorJson = serializeTipTapDocument(previewEditor.getJSON());
    const nextJson = serializeTipTapDocument(nextContent);

    if (editorJson !== nextJson) {
      previewEditor.commands.setContent(nextContent);
    }
  }, [previewEditor, termJson]);

  return (
    <div className="font-app overflow-hidden rounded-2xl border border-[#e5daf0] bg-white">
      <div className={ expanded
        ? "px-4 py-4 [&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-5 [&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:pl-5 [&_.tiptap_li]:my-1 [&_.tiptap_blockquote]:border-l-4 [&_.tiptap_blockquote]:border-[#cfbbe3] [&_.tiptap_blockquote]:pl-4"
        : "max-h-40 overflow-hidden px-3 py-3 [&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-5 [&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:pl-5 [&_.tiptap_li]:my-1 [&_.tiptap_blockquote]:border-l-4 [&_.tiptap_blockquote]:border-[#cfbbe3] [&_.tiptap_blockquote]:pl-4" }
      >
        <EditorContent editor={ previewEditor } />
      </div>
    </div>
  );
}

export function PoemTermsHomePage({ poemTerms, isAdmin }: PoemTermsHomePageProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTerms = poemTerms.filter((term) =>
    term.term.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <section className="font-app w-full px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,rgba(57,27,88,0.96),rgba(104,53,148,0.88)_56%,rgba(195,150,110,0.84))] px-6 py-8 text-white shadow-[0_28px_80px_-40px_rgba(46,18,70,0.95)] sm:px-8 lg:px-10">
          <div className="flex flex-col gap-5">
            <div className="max-w-3xl">
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.34em] text-[#f1deff]">
                Family Poetry Nook
              </p>
              {/* <BackButton /> */ }
              <Link
                href="/poetry"
                className="mt-3 inline-flex items-center rounded-full border border-white/35 bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#f6ebff] transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <ArrowLeft className="mr-1.5 size-3.5" />
                Home
              </Link>
              {/* <h1 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">
                Browse the Poetry Terms below.
              </h1> */}
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[1.9rem] border border-white/70 bg-white/88 shadow-[0_24px_70px_-40px_rgba(57,27,88,0.7)] backdrop-blur">
          <div className="border-b border-[#e4d9ee] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(249,244,255,0.86))] px-5 py-5 sm:px-6">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#8154a3]">
              Term Directory
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[#77578f]">
              <h2 className="text-2xl font-black tracking-tight text-[#43245d]">Term Finder</h2>
              {/* <FeatureFaqHelp
                href="/feature-faq?category=Poetry%20Cafe"
                buttonClassName="border-[#d8b5ff] bg-gradient-to-b from-[#fbf4ff] to-[#eddcff] text-[#6e3f98] shadow-[0_8px_18px_rgba(110,63,152,0.22)] group-hover:shadow-[0_12px_26px_rgba(110,63,152,0.3)]"
                iconClassName="text-[#6e3f98]"
                tooltipClassName="bg-[#4e2374] text-[#f6ebff]"
              /> */}
              { isAdmin ? (
                  <Button type="button" variant="outline" asChild className="h-8 shrink-0 whitespace-nowrap rounded-full border-[#d8b5ff] bg-[#fbf4ff] px-3 text-xs font-semibold text-[#43245d] hover:bg-[#eddcff] hover:text-[#43245d]">
                    <Link href="/poem-terms/manage"><Plus className="size-3.5" />Add Term</Link>
                  </Button>
              ) : null }
            </div>
          </div>

          { poemTerms.length === 0 ? (
            <div className="px-5 py-5 sm:px-6">
              <div className="rounded-[1.5rem] border border-dashed border-[#d7d0ea] bg-[#faf8ff] px-6 py-10 text-center text-[#77578f]">
                <BookText className="mx-auto mb-3 size-10 text-[#9a79b8]" />
                <p className="text-lg font-semibold text-[#43245d]">No poem terms are available yet.</p>
                <p className="mt-2 text-sm">Add your first glossary term, then reopen this page.</p>
              </div>
            </div>
          ) : (
            <div className="px-5 py-5 sm:px-6">
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9a79b8]" />
                  <Input
                    type="search"
                    placeholder="Search terms..."
                    value={ searchQuery }
                    onChange={ (e) => setSearchQuery(e.target.value) }
                    className="h-10 rounded-full border-[#d8b5ff] bg-white pl-10 pr-10 text-sm text-[#43245d] placeholder:text-[#b89fcc] focus-visible:ring-[#8c62b5]"
                  />
                  { searchQuery ? (
                    <button
                      type="button"
                      onClick={ () => setSearchQuery("") }
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full text-[#9a79b8] hover:text-[#6e3f98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8c62b5]"
                      aria-label="Clear search"
                    >
                      <X className="size-4" />
                    </button>
                  ) : null }
                </div>
              </div>

              { filteredTerms.length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-[#d7d0ea] bg-[#faf8ff] px-6 py-10 text-center text-[#77578f]">
                  <p className="text-sm">No terms match your search.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                  { filteredTerms.map((term) => (
                    <article key={ term.id } className="rounded-2xl border border-[#e5daf0] bg-white p-4 shadow-sm">
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <p className="text-base font-bold text-[#43245d]">{ term.term }</p>
                        { isAdmin ? (
                          <Button type="button" variant="outline" asChild className="h-7 rounded-full border-[#d8b5ff] bg-[#fbf4ff] px-2 text-[0.65rem] font-semibold text-[#43245d] hover:bg-[#eddcff] hover:text-[#43245d]">
                            <Link href={ `/poem-terms/manage?id=${ term.id }` }><PenSquare className="size-3" />Edit</Link>
                          </Button>
                        ) : null }
                      </div>

                      <Accordion type="single" collapsible>
                        <AccordionItem value={ `term-${ term.id }` } className="border-b-0">
                          <AccordionTrigger className="py-2 text-sm font-semibold text-[#6e3f98] hover:no-underline">
                            Definition
                          </AccordionTrigger>
                          <AccordionContent>
                            <PoemTermPreview termJson={ term.termJson } expanded />
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </article>
                  )) }
                </div>
              ) }
            </div>
          ) }
        </div>
      </div>

    </section>
  );
}
