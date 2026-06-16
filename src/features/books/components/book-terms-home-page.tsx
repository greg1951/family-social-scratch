"use client";

import LinkExtension from "@tiptap/extension-link";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor } from "@tiptap/react";
import { BookText, PenSquare, Plus, Search, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import {
  createTextTipTapDocument,
  parseSerializedTipTapDocument,
  serializeTipTapDocument,
} from "@/components/db/types/poem-term-validation";
import { BookTerm } from "@/components/db/types/books";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// import FeatureFaqHelp from "@/components/common/feature-faq-help";

type BookTermsHomePageProps = {
  bookTerms: BookTerm[];
  isAdmin: boolean;
};

function parseTermContent(termJson: string | undefined) {
  if (!termJson) {
    return createTextTipTapDocument("Select a book term to view its details.");
  }

  const parsed = parseSerializedTipTapDocument(termJson);

  if (parsed.success) {
    return parsed.content;
  }

  return createTextTipTapDocument(parsed.message);
}

function BookTermPreview({ termJson, expanded = false }: { termJson?: string; expanded?: boolean }) {
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
        class: "tiptap text-sm leading-6 text-[#355161] focus:outline-none",
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
    <div className="overflow-hidden rounded-2xl border border-[#d9e5ea] bg-white">
      <div className={ expanded
        ? "px-4 py-4 [&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-5 [&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:pl-5 [&_.tiptap_li]:my-1 [&_.tiptap_blockquote]:border-l-4 [&_.tiptap_blockquote]:border-[#b9d2dd] [&_.tiptap_blockquote]:pl-4"
        : "max-h-40 overflow-hidden px-3 py-3 [&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-5 [&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:pl-5 [&_.tiptap_li]:my-1 [&_.tiptap_blockquote]:border-l-4 [&_.tiptap_blockquote]:border-[#b9d2dd] [&_.tiptap_blockquote]:pl-4" }
      >
        <EditorContent editor={ previewEditor } />
      </div>
    </div>
  );
}

export function BookTermsHomePage({ bookTerms, isAdmin }: BookTermsHomePageProps) {
  const [selectedTermId, setSelectedTermId] = useState<number | null>(bookTerms[0]?.id ?? null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTerms = bookTerms.filter((term) =>
    term.term.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const selectedTerm = bookTerms.find((term) => term.id === selectedTermId) ?? null;

  return (
    <section className="font-app w-full px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,rgba(9,56,82,0.96),rgba(30,115,142,0.9)_52%,rgba(217,171,103,0.82))] px-6 py-8 text-white shadow-[0_28px_80px_-40px_rgba(6,34,52,0.95)] sm:px-8 lg:px-10">
          <div className="flex flex-col gap-5">
            <div className="max-w-3xl">
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.34em] text-[#d9f3ff]">
                Reading Room
              </p>
              <Link
                href="/books"
                className="mt-3 inline-flex items-center rounded-full border border-white/35 bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#ecfaff] transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                Back to Books Home Page
              </Link>
              <h1 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">
                Browse the Book Terms below.
              </h1>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[1.9rem] border border-white/70 bg-white/88 shadow-[0_24px_70px_-40px_rgba(9,56,82,0.7)] backdrop-blur">
          <div className="border-b border-[#d9e5ea] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(243,250,252,0.86))] px-5 py-5 sm:px-6">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#42748a]">
              Terms Directory
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[#51707e]">
              <h2 className="text-2xl font-black tracking-tight text-[#183746]">Term Finder</h2>
              {/* <FeatureFaqHelp
                href="/feature-faq?category=Book+Besties"
                buttonClassName="border-[#9dd8f0] bg-gradient-to-b from-[#f4fcff] to-[#d9f2ff] text-[#1d6d8f] shadow-[0_8px_18px_rgba(29,109,143,0.2)] group-hover:shadow-[0_12px_26px_rgba(29,109,143,0.3)]"
                iconClassName="text-[#1d6d8f]"
                tooltipClassName="bg-[#0f435c] text-[#ecfaff]"
              /> */}
              { isAdmin ? (
                <>
                  <Button type="button" variant="outline" asChild disabled={ !selectedTerm } className="h-8 shrink-0 whitespace-nowrap rounded-full border-[#9dd8f0] bg-[#f4fcff] px-3 text-xs font-semibold text-[#183746] hover:bg-[#d9f2ff] hover:text-[#183746] disabled:opacity-50">
                    <Link href={ selectedTerm ? `/book-terms/manage?id=${ selectedTerm.id }` : "#" }><PenSquare className="size-3.5" />Edit Term</Link>
                  </Button>
                  <Button type="button" variant="outline" asChild className="h-8 shrink-0 whitespace-nowrap rounded-full border-[#9dd8f0] bg-[#f4fcff] px-3 text-xs font-semibold text-[#183746] hover:bg-[#d9f2ff] hover:text-[#183746]">
                    <Link href="/book-terms/manage"><Plus className="size-3.5" />Add Term</Link>
                  </Button>
                </>
              ) : null }
            </div>
          </div>

          { bookTerms.length === 0 ? (
            <div className="px-5 py-5 sm:px-6">
              <div className="rounded-[1.5rem] border border-dashed border-[#c8d7df] bg-[#f8fcff] px-6 py-10 text-center text-[#51707e]">
                <BookText className="mx-auto mb-3 size-10 text-[#6f9cb0]" />
                <p className="text-lg font-semibold text-[#183746]">No book terms are available yet.</p>
                <p className="mt-2 text-sm">Add your first glossary term, then reopen this page.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,0.4fr)_minmax(0,0.6fr)]">
              <div className="border-b border-[#d9e5ea] md:border-b-0 md:border-r">
                <div className="border-b border-[#d9e5ea] px-3 py-2.5">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[#6f9cb0]" />
                    <Input
                      type="search"
                      placeholder="Search terms…"
                      value={ searchQuery }
                      onChange={ (e) => setSearchQuery(e.target.value) }
                      className="h-8 rounded-full border-[#c8d7df] bg-white pl-8 pr-7 text-xs text-[#183746] placeholder:text-[#99b5c0] focus-visible:ring-[#3d819b]"
                    />
                    { searchQuery ? (
                      <button
                        type="button"
                        onClick={ () => setSearchQuery("") }
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full text-[#6f9cb0] hover:text-[#3d819b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3d819b]"
                        aria-label="Clear search"
                      >
                        <X className="size-3.5" />
                      </button>
                    ) : null }
                  </div>
                </div>
                <div className="max-h-144 divide-y divide-[#edf4f7] overflow-auto">
                  { filteredTerms.length === 0 ? (
                    <p className="px-5 py-4 text-sm text-[#6f9cb0]">No terms match your search.</p>
                  ) : null }
                  { filteredTerms.map((term) => {
                    const isSelected = term.id === selectedTermId;

                    return (
                      <button
                        key={ term.id }
                        type="button"
                        onClick={ () => setSelectedTermId(term.id) }
                        className={ [
                          "flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#3d819b]",
                          isSelected ? "bg-[#ebf5f9]" : "bg-white hover:bg-[#f5fafe]",
                        ].join(" ") }
                      >
                        <span className={ ["text-sm font-semibold", isSelected ? "text-[#183746]" : "text-[#2a5d73]"].join(" ") }>
                          { term.term }
                        </span>
                        { isSelected ? (
                          <span className="shrink-0 rounded-full bg-[#3d819b] px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-white">
                            Selected
                          </span>
                        ) : null }
                      </button>
                    );
                  }) }
                </div>
              </div>

              <div className="p-5">
                { selectedTerm ? (
                  <div>
                    <p className="mb-3 text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#42748a]">{ selectedTerm.term }</p>
                    <BookTermPreview termJson={ selectedTerm.termJson } expanded />
                  </div>
                ) : (
                  <div className="flex min-h-48 items-center justify-center rounded-2xl border border-dashed border-[#c8d7df] bg-[#f8fcff] px-6 py-10 text-center text-[#51707e]">
                    <p className="text-sm">Select a term from the list to view its definition.</p>
                  </div>
                ) }
              </div>
            </div>
          ) }
        </div>
      </div>
    </section>
  );
}