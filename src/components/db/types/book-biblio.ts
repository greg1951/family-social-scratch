import type { BookTagOption } from './books';

export const BIBLIO_STATUS_OPTIONS = [
  { label: 'Public', value: 'public' },
  { label: 'Private', value: 'private' },
  { label: 'Draft', value: 'draft' },
];

export interface BiblioEntry {
  id: number;
  bookTitle: string;
  authorName: string;
  bookSeriesName: string | null;
  publishedYear: number;
  readYear: number;
  rating: number;
  status: string;
  summaryJson: string;
  commentsJson: string;
  updatedAt: Date | null;
  memberId: number;
  familyId: number;
  memberFirstName: string;
  memberLastName: string;
  selectedTagIds: number[];
  tagNames: string[];
  hasBookPost: boolean;
}

export interface BiblioMemberOption {
  memberId: number;
  firstName: string;
  lastName: string;
  entryCount: number;
}

export interface SaveBiblioEntryInput {
  id?: number;
  bookTitle: string;
  authorName: string;
  bookSeriesName?: string;
  publishedYear: number;
  readYear: number;
  rating: number;
  status: string;
  summaryJson: string;
  commentsJson: string;
  selectedTagIds: number[];
}

export type SaveBiblioEntryReturn =
  | { success: false; message: string }
  | { success: true; entry: BiblioEntry; message: string };

export type DeleteBiblioEntryReturn =
  | { success: false; message: string }
  | { success: true; message: string };

export type MemberBiblioPageDataReturn =
  | { success: false; message: string }
  | {
      success: true;
      entries: BiblioEntry[];
      bookTags: BookTagOption[];
      ownerFirstName: string;
      ownerLastName: string;
      isOwner: boolean;
    };

export type BiblioMemberOptionsReturn =
  | { success: false; message: string }
  | { success: true; members: BiblioMemberOption[] };

export type SearchFamilyBibliosReturn =
  | { success: false; message: string }
  | { success: true; entries: BiblioEntry[]; bookTags: BookTagOption[] };

export interface BookReviewPrefill {
  biblioId: number;
  bookTitle: string;
  authorName: string;
  bookSeriesName: string;
  bookYear: number;
  analysisJson: string;
  selectedTagIds: number[];
}
