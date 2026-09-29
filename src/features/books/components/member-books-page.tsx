"use client";

import { ArrowLeft, BookOpen, Eye, HouseHeart, PenSquare, Plus, Star } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import type { BiblioEntry } from "@/components/db/types/book-biblio";
import type { BookTagOption } from "@/components/db/types/books";
import { Button } from "@/components/ui/button";
import FeatureFaqHelp from "@/components/common/feature-faq-help";
import EditPostIcon from "@/components/common/edit-post-icon";
import {
  FilterSidebar,
  FilterSidebarGroup,
  FilterSidebarProvider,
  FilterSidebarRadio,
  FilterSidebarSearch,
  FilterSidebarTrigger,
  type FilterSidebarPalette,
} from "@/components/common/filter-sidebar";
import { BiblioEntryDialog } from "@/features/books/components/dialogs/biblio-entry-dialog";
import { useBiblioDialog } from "@/features/books/hooks/use-biblio-dialog";

const biblioFilterPalette: FilterSidebarPalette = {
  sidebarBackground: "#f8fcff",
  sidebarForeground: "#183746",
  sidebarBorder: "#d9e5ea",
  label: "#3d819b",
  muted: "#51707e",
  inputBorder: "#c8d7df",
  inputText: "#183746",
  chipBorder: "#c8d7df",
  chipText: "#183746",
  chipHoverBackground: "#f3f9fc",
  checkBorder: "#9ec3d2",
  checkboxText: "#2a5a6f",
  accent: "#0f5c78",
  accentHoverBackground: "#0a4860",
  triggerBorder: "#c9e2ec",
  triggerBackground: "#f6fbfe",
  triggerText: "#183746",
  triggerHoverBackground: "#dff2f9",
};

type BiblioStatusFilter = "all" | "public" | "private" | "draft";

type MemberBooksPageProps = {
  entries: BiblioEntry[];
  bookTags: BookTagOption[];
  isOwner: boolean;
  heading: string;
  subheading: string;
  showOwnerNames?: boolean;
  initialSearch?: string;
  loadError?: string | null;
};

function RatingStars({ rating }: { rating: number }) {
  if (rating < 1) {
    return <span className="text-xs text-[#7d97a3]">Not rated</span>;
  }

  return (
    <span className="inline-flex items-center gap-0.5" aria-label={ `Rated ${ rating } out of 5` }>
      { [1, 2, 3, 4, 5].map((starIndex) => (
        <Star
          key={ starIndex }
          className={ `size-3.5 ${ starIndex <= rating ? "fill-[#d9ab67] text-[#d9ab67]" : "text-[#c8d7df]" }` }
        />
      )) }
    </span>
  );
}

export default function MemberBooksPage({
  entries,
  bookTags,
  isOwner,
  heading,
  subheading,
  showOwnerNames = false,
  initialSearch = "",
  loadError = null,
}: MemberBooksPageProps) {
  const router = useRouter();
  const [biblioEntries, setBiblioEntries] = useState(entries);
  const [searchValue, setSearchValue] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState<BiblioStatusFilter>("all");
  const [selectedEntryId, setSelectedEntryId] = useState<number | null>(entries[0]?.id ?? null);

  const biblioDialog = useBiblioDialog({
    onEntrySaved(savedEntry) {
      setBiblioEntries((currentEntries) => {
        const hasEntry = currentEntries.some((entry) => entry.id === savedEntry.id);

        if (hasEntry) {
          return currentEntries.map((entry) => (entry.id === savedEntry.id ? savedEntry : entry));
        }

        return [savedEntry, ...currentEntries];
      });
      setSelectedEntryId(savedEntry.id);
      router.refresh();
    },
    onEntryDeleted(deletedBiblioId) {
      setBiblioEntries((currentEntries) => currentEntries.filter((entry) => entry.id !== deletedBiblioId));
      setSelectedEntryId((currentSelectedId) => (currentSelectedId === deletedBiblioId ? null : currentSelectedId));
      router.refresh();
    },
  });

  const filteredEntries = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return biblioEntries.filter((entry) => {
      if (statusFilter !== "all" && entry.status.trim().toLowerCase() !== statusFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return (
        entry.bookTitle.toLowerCase().includes(normalizedSearch)
        || entry.authorName.toLowerCase().includes(normalizedSearch)
        || (entry.bookSeriesName ?? "").toLowerCase().includes(normalizedSearch)
        || entry.tagNames.some((tagName) => tagName.toLowerCase().includes(normalizedSearch))
      );
    });
  }, [biblioEntries, searchValue, statusFilter]);

  function handleCreateReview(entry: BiblioEntry) {
    router.push(`/books?biblioId=${ entry.id }`);
  }

  const selectedEntry = filteredEntries.find((entry) => entry.id === selectedEntryId) ?? null;

  return (
    <FilterSidebarProvider palette={ biblioFilterPalette }>
      <FilterSidebar title="Bibliography Filters">
        <FilterSidebarSearch
          value={ searchValue }
          onChange={ setSearchValue }
          placeholder="Search by book title, author, series, or tag"
          ariaLabel="Search bibliography"
        />
        { isOwner ? (
          <FilterSidebarGroup label="Status" className="flex flex-wrap gap-2">
            <FilterSidebarRadio name="biblio-status" value="all" checked={ statusFilter === "all" } onChange={ () => setStatusFilter("all") }>All</FilterSidebarRadio>
            <FilterSidebarRadio name="biblio-status" value="public" checked={ statusFilter === "public" } onChange={ () => setStatusFilter("public") }>Public</FilterSidebarRadio>
            <FilterSidebarRadio name="biblio-status" value="private" checked={ statusFilter === "private" } onChange={ () => setStatusFilter("private") }>Private</FilterSidebarRadio>
            <FilterSidebarRadio name="biblio-status" value="draft" checked={ statusFilter === "draft" } onChange={ () => setStatusFilter("draft") }>Draft</FilterSidebarRadio>
          </FilterSidebarGroup>
        ) : null }
      </FilterSidebar>

      <section className="font-app min-w-0 flex-1 px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,rgba(9,56,82,0.96),rgba(30,115,142,0.9)_52%,rgba(217,171,103,0.82))] px-6 py-8 text-white shadow-[0_28px_80px_-40px_rgba(6,34,52,0.95)] sm:px-8 lg:px-10">
          <p className="text-[1rem] font-bold uppercase tracking-[0.34em] text-[#d9f3ff]">{ heading }</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/books"
              className="inline-flex items-center rounded-full border border-white/35 bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#ecfaff] transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <ArrowLeft className="mr-1.5 size-3.5" />
              Library Home
            </Link>
            <Link
              href="/"
              className="inline-flex items-center rounded-full border border-white/35 bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#ecfaff] transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <HouseHeart className="mr-1.5 size-3.5" />
              Go Home
            </Link>
          </div>
          <p className="mt-4 max-w-3xl text-sm text-[#d9f3ff]">{ subheading }</p>
        </div>

        <div className="overflow-hidden rounded-[1.9rem] border border-white/70 bg-white/88 shadow-[0_24px_70px_-40px_rgba(9,56,82,0.7)] backdrop-blur">
          <div className="border-b border-[#d9e5ea] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(243,250,252,0.86))] px-5 py-5 sm:px-6">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#42748a]">Bibliography</p>
              <FeatureFaqHelp
                href="/feature-faq?category=Bibliography"
                buttonClassName="h-4 w-4 md:h-7 md:w-7 border-[#9dd8f0] bg-gradient-to-b from-[#f4fcff] to-[#d9f2ff] text-[#1d6d8f] shadow-[0_8px_18px_rgba(29,109,143,0.2)] group-hover:shadow-[0_12px_26px_rgba(29,109,143,0.3)]"
                iconClassName="h-3 w-3 md:h-4 md:w-4 text-[#1d6d8f]"
                tooltipClassName="bg-[#0f435c] text-[#ecfaff]"
              />
              <EditPostIcon tooltip="Filter Bibliography" tooltipClassName="bg-[#0f435c] text-[#ecfaff]">
                <FilterSidebarTrigger ariaLabel="Toggle bibliography filters" />
              </EditPostIcon>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {/* <h2 className="text-2xl font-black tracking-tight text-[#183746]">
                { filteredEntries.length } book{ filteredEntries.length === 1 ? "" : "s" }
              </h2> */}
              <Button
                type="button"
                variant="outline"
                onClick={ () => biblioDialog.openDialog("view", selectedEntry) }
                disabled={ !selectedEntry }
                className="h-8 rounded-full border-[#c9e2ec] bg-[#f6fbfe] px-3 text-xs font-semibold text-[#183746] hover:bg-[#dff2f9] hover:text-[#183746] disabled:opacity-50"
              >
                <Eye className="size-3.5" />
                View
              </Button>
              { isOwner ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={ () => biblioDialog.openDialog("edit", selectedEntry) }
                    disabled={ !selectedEntry }
                    className="h-8 rounded-full border-[#c9e2ec] bg-[#f6fbfe] px-3 text-xs font-semibold text-[#183746] hover:bg-[#dff2f9] hover:text-[#183746] disabled:opacity-50"
                  >
                    <PenSquare className="size-3.5" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={ () => biblioDialog.openDialog("add") }
                    className="h-8 rounded-full border-[#c9e2ec] bg-[#f6fbfe] px-3 text-xs font-semibold text-[#183746] hover:bg-[#dff2f9] hover:text-[#183746]"
                  >
                    <Plus className="size-3.5" />
                    Add Book
                  </Button>
                  <Button
                    type="button"
                    onClick={ () => selectedEntry && handleCreateReview(selectedEntry) }
                    disabled={ !selectedEntry || selectedEntry.hasBookPost }
                    className="h-8 rounded-full bg-[#0f5c78] px-3 text-xs font-semibold text-white hover:bg-[#0a4860] disabled:opacity-50"
                  >
                    <BookOpen className="size-3.5" />
                    { selectedEntry?.hasBookPost ? "Review Posted" : "Create Review" }
                  </Button>
                </>
              ) : null }
            </div>
          </div>

          <div className="px-5 py-5 sm:px-6">
            { filteredEntries.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-[#c8d7df] bg-[#f8fcff] px-6 py-10 text-center text-[#51707e]">
                <BookOpen className="mx-auto mb-3 size-10 text-[#6f9cb0]" />
                { loadError ? (
                  <>
                    <p className="text-lg font-semibold text-[#183746]">This bibliography could not be loaded.</p>
                    <p className="mt-2 text-sm">{ loadError }</p>
                  </>
                ) : (
                  <p className="text-sm">No books match the current search.</p>
                ) }
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1.5 md:grid-cols-3 xl:grid-cols-4">
                { filteredEntries.map((entry) => {
                  const isSelected = entry.id === selectedEntryId;

                  return (
                    <button
                      key={ entry.id }
                      type="button"
                      onClick={ () => setSelectedEntryId(entry.id) }
                      onDoubleClick={ () => biblioDialog.openDialog("view", entry) }
                      aria-pressed={ isSelected }
                      className={ `min-w-0 w-full select-none space-y-2 rounded-[1.4rem] border px-2 py-2 text-left shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3d819b] sm:px-4 sm:py-4 ${ isSelected
                        ? "border-[#3d819b] bg-[linear-gradient(135deg,rgba(231,247,255,0.95),rgba(248,252,255,0.95))] shadow-[0_18px_45px_-35px_rgba(9,56,82,0.7)]"
                        : "border-[#deeaef] bg-white hover:border-[#a6c6d3] hover:bg-[#fbfdff]" }` }
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="wrap-break-word text-sm font-bold leading-snug text-[#183746]">{ entry.bookTitle }</p>
                          <p className="text-xs text-[#51707e]">{ entry.authorName }{ entry.publishedYear ? ` · ${ entry.publishedYear }` : "" }</p>
                          { entry.bookSeriesName ? (
                            <p className="text-xs italic text-[#6f8f9d]">{ entry.bookSeriesName }</p>
                          ) : null }
                          { showOwnerNames ? (
                            <p className="mt-1 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[#648596]">
                              { entry.memberFirstName } { entry.memberLastName }
                            </p>
                          ) : null }
                        </div>
                        { isOwner ? (
                          <span className="shrink-0 rounded-full bg-[#eef6fa] px-2 py-1 text-[0.6rem] font-bold uppercase tracking-[0.16em] text-[#2d667d]">
                            { entry.status }
                          </span>
                        ) : null }
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-[#51707e]">
                        <RatingStars rating={ entry.rating } />
                        <span>Read: { entry.readYear > 0 ? entry.readYear : "Not recorded" }</span>
                      </div>

                      { entry.tagNames.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          { entry.tagNames.map((tagName) => (
                            <span key={ tagName } className="rounded-full border border-[#dbe6ec] bg-[#f8fcff] px-2 py-0.5 text-[0.65rem] font-semibold text-[#2a5a6f]">
                              { tagName }
                            </span>
                          )) }
                        </div>
                      ) : null }
                    </button>
                  );
                }) }
              </div>
            ) }
          </div>
        </div>
      </div>

      <BiblioEntryDialog
        isOpen={ biblioDialog.isDialogOpen }
        onOpenChange={ biblioDialog.setIsDialogOpen }
        mode={ biblioDialog.dialogMode }
        draft={ biblioDialog.draft }
        setDraft={ biblioDialog.setDraft }
        bookTags={ bookTags }
        isSaving={ biblioDialog.isSaving }
        onSave={ biblioDialog.handleSave }
        onDelete={ biblioDialog.handleDelete }
        onToggleTag={ biblioDialog.handleToggleTag }
      />
      </section>
    </FilterSidebarProvider>
  );
}
