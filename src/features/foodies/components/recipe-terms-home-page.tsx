"use client";

import LinkExtension from "@tiptap/extension-link";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import { BookText, PenSquare, Plus, Search, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import {
  createTextTipTapDocument,
  parseSerializedTipTapDocument,
  serializeTipTapDocument,
} from "@/components/db/types/poem-term-validation";
import { RecipeTerm } from "@/components/db/types/recipes";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import FeatureFaqHelp from "@/components/common/feature-faq-help";

type RecipeTermsHomePageProps = {
  recipeTerms: RecipeTerm[];
  isAdmin: boolean;
};

function parseTermContent(termJson: string | undefined) {
  if (!termJson) {
    return createTextTipTapDocument("Select a recipe term to view its details.");
  }

  const parsed = parseSerializedTipTapDocument(termJson);

  if (parsed.success) {
    return parsed.content;
  }

  return createTextTipTapDocument(parsed.message);
}

function RecipeTermPreview({ termJson, expanded = false }: { termJson?: string; expanded?: boolean }) {
  const previewEditor = useEditor({
    extensions: [
      StarterKit,
      Underline,
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
        class: "tiptap text-sm leading-6 text-[#4e6640] focus:outline-none",
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
    <div className="font-app overflow-hidden rounded-2xl border border-[#ccdfb9] bg-white">
      <div className={ expanded
        ? "px-4 py-4 [&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-5 [&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:pl-5 [&_.tiptap_li]:my-1"
        : "max-h-40 overflow-hidden px-3 py-3 [&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-5 [&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:pl-5 [&_.tiptap_li]:my-1" }
      >
        <EditorContent editor={ previewEditor } />
      </div>
    </div>
  );
}

export function RecipeTermsHomePage({ recipeTerms, isAdmin }: RecipeTermsHomePageProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTerms = recipeTerms.filter((term) =>
    term.term.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <section className="font-app w-full px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,rgba(49,67,29,0.95),rgba(87,124,36,0.88)_56%,rgba(199,216,126,0.82))] px-6 py-8 text-white shadow-[0_28px_80px_-40px_rgba(40,54,21,0.95)] sm:px-8 lg:px-10">
          <div className="flex flex-col gap-5">
            <div className="max-w-3xl">
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.34em] text-[#e9ffd0]">
                The Kitchen
              </p>
              <Link
                href="/foodies"
                className="mt-3 inline-flex items-center rounded-full border border-white/35 bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#f1ffe4] transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                Back to Foodies Home Page
              </Link>
              <h1 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">
                Browse the Recipe Terms below.
              </h1>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[1.9rem] border border-white/70 bg-white/88 shadow-[0_24px_70px_-40px_rgba(38,54,26,0.75)] backdrop-blur">
          <div className="border-b border-[#dbeacc] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(245,251,235,0.88))] px-5 py-5 sm:px-6">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#5f7a40]">
              Term Directory
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[#647a50]">
              <h2 className="text-2xl font-black tracking-tight text-[#2f4820]">Term Finder</h2>
              <FeatureFaqHelp
                href="/feature-faq?category=Family+Foodies"
                buttonClassName="border-[#cfe8b2] bg-gradient-to-b from-[#f7ffed] to-[#e5f7cb] text-[#4f7a2a] shadow-[0_8px_18px_rgba(79,122,42,0.2)] group-hover:shadow-[0_12px_26px_rgba(79,122,42,0.3)]"
                iconClassName="text-[#4f7a2a]"
                tooltipClassName="bg-[#2f4820] text-[#f1ffe4]"
              />
              { isAdmin ? (
                <Button type="button" variant="outline" asChild className="h-8 shrink-0 whitespace-nowrap rounded-full border-[#cfe8b2] bg-[#f7fce8] px-3 text-xs font-semibold text-[#2f4820] hover:bg-[#e5f7cb] hover:text-[#2f4820]">
                  <Link href="/recipe-terms/manage"><Plus className="size-3.5" />Add Term</Link>
                </Button>
              ) : null }
            </div>
          </div>

          { recipeTerms.length === 0 ? (
            <div className="px-5 py-5 sm:px-6">
              <div className="rounded-[1.5rem] border border-dashed border-[#dbeacc] bg-[#faf8ff] px-6 py-10 text-center text-[#647a50]">
                <BookText className="mx-auto mb-3 size-10 text-[#9fd46a]" />
                <p className="text-lg font-semibold text-[#2f4820]">No recipe terms are available yet.</p>
                <p className="mt-2 text-sm">The family glossary will be populated soon.</p>
              </div>
            </div>
          ) : (
            <div className="px-5 py-5 sm:px-6">
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9fd46a]" />
                  <Input
                    type="search"
                    placeholder="Search terms..."
                    value={ searchQuery }
                    onChange={ (e) => setSearchQuery(e.target.value) }
                    className="h-10 rounded-full border-[#cfe8b2] bg-white pl-10 pr-10 text-sm text-[#2f4820] placeholder:text-[#9fba80] focus-visible:ring-[#4f7a2a]"
                  />
                  { searchQuery ? (
                    <button
                      type="button"
                      onClick={ () => setSearchQuery("") }
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full text-[#9fd46a] hover:text-[#4f7a2a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f7a2a]"
                      aria-label="Clear search"
                    >
                      <X className="size-4" />
                    </button>
                  ) : null }
                </div>
              </div>

              { filteredTerms.length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-[#dbeacc] bg-[#f7fdf0] px-6 py-10 text-center text-[#647a50]">
                  <p className="text-sm">No terms match your search.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                  { filteredTerms.map((term) => (
                    <article key={ term.id } className="rounded-2xl border border-[#ccdfb9] bg-white p-4 shadow-sm">
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <p className="text-base font-bold text-[#2f4820]">{ term.term }</p>
                        { isAdmin ? (
                          <Button type="button" variant="outline" asChild className="h-7 rounded-full border-[#cfe8b2] bg-[#f7fce8] px-2 text-[0.65rem] font-semibold text-[#2f4820] hover:bg-[#e5f7cb] hover:text-[#2f4820]">
                            <Link href={ `/recipe-terms/manage?id=${ term.id }` }><PenSquare className="size-3" />Edit</Link>
                          </Button>
                        ) : null }
                      </div>

                      <Accordion type="single" collapsible>
                        <AccordionItem value={ `term-${ term.id }` } className="border-b-0">
                          <AccordionTrigger className="py-2 text-sm font-semibold text-[#4f7a2a] hover:no-underline">
                            Definition
                          </AccordionTrigger>
                          <AccordionContent>
                            <RecipeTermPreview termJson={ term.termJson } expanded />
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
