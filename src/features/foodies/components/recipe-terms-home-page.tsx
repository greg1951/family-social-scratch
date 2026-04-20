"use client";

import LinkExtension from "@tiptap/extension-link";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import { BookText, Eye, PenSquare, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import {
  createTextTipTapDocument,
  parseSerializedTipTapDocument,
  serializeTipTapDocument,
} from "@/components/db/types/poem-term-validation";
import { RecipeTerm } from "@/components/db/types/recipes";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const [selectedTermId, setSelectedTermId] = useState<number | null>(recipeTerms[0]?.id ?? null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const selectedTerm = recipeTerms.find((term) => term.id === selectedTermId) ?? null;

  return (
    <section className="font-app w-full px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,rgba(49,67,29,0.95),rgba(87,124,36,0.88)_56%,rgba(199,216,126,0.82))] px-6 py-8 text-white shadow-[0_28px_80px_-40px_rgba(40,54,21,0.95)] sm:px-8 lg:px-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.34em] text-[#e9ffd0]">
                Family Foodies
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

            <div className="flex flex-col gap-3 rounded-[1.6rem] border border-white/20 bg-white/10 p-4 shadow-inner backdrop-blur sm:min-w-[20rem]">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-[#e9ffd0]">Terms</p>
                  <p className="mt-2 text-2xl font-black">{ recipeTerms.length }</p>
                  <p className="text-sm text-[#f1ffe4]">available now</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-[#e9ffd0]">Selected</p>
                  <p className="mt-2 text-lg font-black leading-tight">
                    { selectedTerm?.term ?? "None" }
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="outline"
                  disabled={ !selectedTerm }
                  onClick={ () => setIsViewDialogOpen(true) }
                  className="rounded-full border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white disabled:opacity-50"
                >
                  <Eye />
                  View Selected Term
                </Button>
                { isAdmin ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      asChild
                      disabled={ !selectedTerm }
                      className="rounded-full border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white disabled:opacity-50"
                    >
                      <Link href={ selectedTerm ? `/recipe-terms/manage?id=${ selectedTerm.id }` : "#" }>
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
                      <Link href="/recipe-terms/manage">
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

        <div className="overflow-hidden rounded-[1.9rem] border border-white/70 bg-white/88 shadow-[0_24px_70px_-40px_rgba(38,54,26,0.75)] backdrop-blur">
          <div className="border-b border-[#dbeacc] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(245,251,235,0.88))] px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#5f7a40]">
                  Term Directory
                </p>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#647a50]">
                  { isAdmin ? "View any term in full, or select one to edit." : "Select a term, then use View Selected Term to read the full glossary entry." }
                </p>
              </div>

              <div className="rounded-full border border-[#dbeacc] bg-[#f7fce8] px-4 py-2 text-sm font-semibold text-[#415d2c]">
                { recipeTerms.length } term{ recipeTerms.length !== 1 ? "s" : "" }
              </div>
            </div>
          </div>

          <div className="px-5 py-5 sm:px-6">
            { recipeTerms.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-[#dbeacc] bg-[#faf8ff] px-6 py-10 text-center text-[#647a50]">
                <BookText className="mx-auto mb-3 size-10 text-[#9fd46a]" />
                <p className="text-lg font-semibold text-[#2f4820]">No recipe terms are available yet.</p>
                <p className="mt-2 text-sm">The family glossary will be populated soon.</p>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                { recipeTerms.map((term) => {
                  const isSelected = term.id === selectedTermId;

                  return (
                    <button
                      key={ term.id }
                      type="button"
                      onClick={ () => setSelectedTermId(term.id) }
                      className={ `flex w-full flex-col gap-3 rounded-[1.4rem] border px-4 py-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#578c24] ${ isSelected
                        ? "border-[#578c24] bg-[linear-gradient(135deg,rgba(237,250,208,0.95),rgba(252,253,248,0.95))] shadow-[0_18px_45px_-35px_rgba(40,54,21,0.7)]"
                        : "border-[#dbeacc] bg-white hover:border-[#ccdfb9] hover:bg-[#fdfcfa]"
                        }` }
                    >
                      <div className="min-w-0 w-full">
                        <p className="text-lg font-bold text-[#2f4820]">{ term.term }</p>
                      </div>

                      <RecipeTermPreview termJson={ term.termJson } />

                      <div className="self-start rounded-full border border-[#dbeacc] px-3 py-1 text-xs font-semibold text-[#415d2c]">
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
        <DialogContent className="border-[#ccdfb9] bg-[#f7fce8] sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-[#2f4820]">{ selectedTerm?.term ?? "Recipe Term" }</DialogTitle>
            <DialogDescription className="text-[#647a50]">
              Read the full recipe glossary entry.
            </DialogDescription>
          </DialogHeader>
          { selectedTerm ? (
            <div className="max-h-[70vh] overflow-auto rounded-2xl border border-[#ccdfb9] bg-white">
              <RecipeTermPreview termJson={ selectedTerm.termJson } expanded />
            </div>
          ) : null }
        </DialogContent>
      </Dialog>
    </section>
  );
}
