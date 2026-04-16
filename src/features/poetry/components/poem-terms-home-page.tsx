"use client";

import LinkExtension from "@tiptap/extension-link";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor } from "@tiptap/react";
import { BookText, PenSquare, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import BackButton from "@/components/common/back-button";

import {
  createTextTipTapDocument,
  parseSerializedTipTapDocument,
  serializeTipTapDocument,
} from "@/components/db/types/poem-term-validation";
import { PoemTerm } from "@/components/db/types/poem-verses";
import { Button } from "@/components/ui/button";

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

function PoemTermPreview({ termJson }: { termJson?: string }) {
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
    <div className="overflow-hidden rounded-2xl border border-[#e5daf0] bg-white">
      <div className="max-h-40 overflow-hidden px-3 py-3">
        <EditorContent editor={ previewEditor } />
      </div>
    </div>
  );
}

export function PoemTermsHomePage({ poemTerms, isAdmin }: PoemTermsHomePageProps) {
  const [selectedTermId, setSelectedTermId] = useState<number | null>(poemTerms[0]?.id ?? null);

  const selectedTerm = poemTerms.find((term) => term.id === selectedTermId) ?? null;

  return (
    <section className="w-full px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,rgba(57,27,88,0.96),rgba(104,53,148,0.88)_56%,rgba(195,150,110,0.84))] px-6 py-8 text-white shadow-[0_28px_80px_-40px_rgba(46,18,70,0.95)] sm:px-8 lg:px-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.34em] text-[#f1deff]">
                Family Poetry Cafe
              </p>
              {/* <BackButton /> */ }
              <Link
                href="/poetry"
                className="mt-3 inline-flex items-center rounded-full border border-white/35 bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#f6ebff] transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                Back to Poetry Home Page
              </Link>
              <h1 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">
                Browse the Poetry Terms below.
              </h1>
            </div>

            <div className="flex flex-col gap-3 rounded-[1.6rem] border border-white/20 bg-white/10 p-4 shadow-inner backdrop-blur sm:min-w-[20rem]">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-[#ead3ff]">Terms</p>
                  <p className="mt-2 text-2xl font-black">{ poemTerms.length }</p>
                  <p className="text-sm text-[#f3e8ff]">available now</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-[#ead3ff]">Selected</p>
                  <p className="mt-2 text-lg font-black leading-tight">
                    { selectedTerm?.term ?? "None" }
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                { isAdmin ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      asChild
                      disabled={ !selectedTerm }
                      className="rounded-full border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white disabled:opacity-50"
                    >
                      <Link href={ selectedTerm ? `/poem-terms/manage?id=${ selectedTerm.id }` : "#" }>
                        <PenSquare />
                        Edit Selected Term
                      </Link>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      asChild
                      className="rounded-full border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                    >
                      <Link href="/poem-terms/manage">
                        <Plus />
                        Add Term
                      </Link>
                    </Button>
                  </>
                ) : null }
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[1.9rem] border border-white/70 bg-white/88 shadow-[0_24px_70px_-40px_rgba(57,27,88,0.7)] backdrop-blur">
          <div className="border-b border-[#e4d9ee] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(249,244,255,0.86))] px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#8154a3]">
                  Term Directory
                </p>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#77578f]">
                  Editors can select a term to edit.
                </p>
              </div>

              <div className="rounded-full border border-[#e4d9ee] bg-[#faf6ff] px-4 py-2 text-sm font-semibold text-[#77578f]">
                { poemTerms.length } term{ poemTerms.length !== 1 ? "s" : "" }
              </div>
            </div>
          </div>

          <div className="px-5 py-5 sm:px-6">
            { poemTerms.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-[#d7d0ea] bg-[#faf8ff] px-6 py-10 text-center text-[#77578f]">
                <BookText className="mx-auto mb-3 size-10 text-[#9a79b8]" />
                <p className="text-lg font-semibold text-[#43245d]">No poem terms are available yet.</p>
                <p className="mt-2 text-sm">Add your first glossary term, then reopen this page.</p>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                { poemTerms.map((term) => {
                  const isSelected = term.id === selectedTermId;

                  return (
                    <button
                      key={ term.id }
                      type="button"
                      onClick={ () => setSelectedTermId(term.id) }
                      className={ `flex w-full flex-col gap-3 rounded-[1.4rem] border px-4 py-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8c62b5] ${ isSelected
                        ? "border-[#8c62b5] bg-[linear-gradient(135deg,rgba(244,236,255,0.95),rgba(252,248,255,0.95))] shadow-[0_18px_45px_-35px_rgba(80,40,120,0.7)]"
                        : "border-[#e6deef] bg-white hover:border-[#c7b2db] hover:bg-[#fcfaff]"
                        }` }
                    >
                      <div className="min-w-0 w-full">
                        <p className="text-lg font-bold text-[#43245d]">{ term.term }</p>
                      </div>

                      <PoemTermPreview termJson={ term.termJson } />

                      <div className="self-start rounded-full border border-[#dacdea] px-3 py-1 text-xs font-semibold text-[#7b54a0]">
                        { isSelected ? "Selected" : "Select" }
                      </div>
                    </button>
                  );
                }) }
              </div>
            ) }
          </div>
        </div>
      </div>
    </section>
  );
}
