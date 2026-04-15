"use client";

import LinkExtension from "@tiptap/extension-link";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor } from "@tiptap/react";
import { BookText, Eye, PenSquare, Plus } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

function formatCreatedAt(createdAt: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(createdAt));
}

export function PoemTermsHomePage({ poemTerms, isAdmin }: PoemTermsHomePageProps) {
  const [selectedTermId, setSelectedTermId] = useState<number | null>(poemTerms[0]?.id ?? null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const selectedTerm = poemTerms.find((term) => term.id === selectedTermId) ?? null;

  const editor = useEditor({
    extensions: [
      StarterKit,
      LinkExtension.configure({
        autolink: true,
        defaultProtocol: "https",
        openOnClick: true,
      }),
    ],
    content: parseTermContent(selectedTerm?.termJson),
    editable: false,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "tiptap min-h-[14rem] rounded-2xl border border-[#d7d0ea] bg-white px-5 py-4 text-[#3b244c] shadow-inner focus:outline-none",
      },
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    const nextContent = parseTermContent(selectedTerm?.termJson);
    const editorJson = serializeTipTapDocument(editor.getJSON());
    const nextJson = serializeTipTapDocument(nextContent);

    if (editorJson !== nextJson) {
      editor.commands.setContent(nextContent);
    }
  }, [editor, selectedTerm]);

  return (
    <section className="w-full px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,rgba(57,27,88,0.96),rgba(104,53,148,0.88)_56%,rgba(195,150,110,0.84))] px-6 py-8 text-white shadow-[0_28px_80px_-40px_rgba(46,18,70,0.95)] sm:px-8 lg:px-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.34em] text-[#f1deff]">
                Family Poetry Cafe
              </p>
              <BackButton />
              {/* <Link
                href="/"
                className="mt-3 inline-flex items-center rounded-full border border-white/35 bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#f6ebff] transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                Back to Main Page
              </Link> */}
              <h1 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">
                Browse the family&apos;s poetry glossary and open each term in a reader-friendly view.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#f3e8ff]">
                Pick a term from the list below, preview its status, and open the full definition in a dialog.
              </p>
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
                <Button
                  type="button"
                  onClick={ () => setIsViewDialogOpen(true) }
                  disabled={ !selectedTerm }
                  className="rounded-full bg-white text-[#4e2374] hover:bg-[#f6ebff]"
                >
                  <Eye />
                  View Term
                </Button>

                { isAdmin ? (
                  <Button
                    type="button"
                    variant="outline"
                    asChild
                    className="rounded-full border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                  >
                    <Link href={ selectedTerm ? `/poem-terms/manage?id=${ selectedTerm.id }` : "/poem-terms/manage" }>
                      { selectedTerm ? <PenSquare /> : <Plus /> }
                      { selectedTerm ? "Edit Selected Term" : "Add Term" }
                    </Link>
                  </Button>
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
                <h2 className="mt-2 text-2xl font-black tracking-tight text-[#43245d]">
                  Select a Poetry Term
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#77578f]">
                  Choose a term to inspect its status and open the full content in the viewer.
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
                <p className="mt-2 text-sm">Add your first glossary term in Neon, then reopen this page.</p>
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
                      className={ `flex w-full items-start justify-between gap-4 rounded-[1.4rem] border px-4 py-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8c62b5] ${ isSelected
                        ? "border-[#8c62b5] bg-[linear-gradient(135deg,rgba(244,236,255,0.95),rgba(252,248,255,0.95))] shadow-[0_18px_45px_-35px_rgba(80,40,120,0.7)]"
                        : "border-[#e6deef] bg-white hover:border-[#c7b2db] hover:bg-[#fcfaff]"
                        }` }
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="text-lg font-bold text-[#43245d]">{ term.term }</p>
                          <span className="rounded-full bg-[#f1e8fb] px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#7b54a0]">
                            { term.status }
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-[#77578f]">
                          Created { formatCreatedAt(term.createdAt) }
                        </p>
                      </div>

                      <div className="shrink-0 rounded-full border border-[#dacdea] px-3 py-1 text-xs font-semibold text-[#7b54a0]">
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

      <Dialog open={ isViewDialogOpen } onOpenChange={ setIsViewDialogOpen }>
        <DialogContent className="max-h-[85vh] overflow-hidden border-[#d7d0ea] bg-[#fcf9ff] sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-[#43245d]">
              { selectedTerm?.term ?? "Poetry Term" }
            </DialogTitle>
            <DialogDescription className="text-[#77578f]">
              Viewing the saved term content from the poem term record.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto pr-1">
            <EditorContent editor={ editor } />
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
