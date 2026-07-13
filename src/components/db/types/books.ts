import type { Club } from './clubs';
import type { DiscussionThreadSummary } from './discuss-threads';

export interface Book {
  id: number;
  bookTitle: string;
  authorName: string;
  bookLanguage: string;
  bookSource: string;
  bookSeriesName?: string | null;
  bookYear: number;
  status: string;
  createdAt: Date;
  memberId: number;
  familyId: number;
  submitterName?: string;
  likesCount?: number;
  commentCount?: number;
  verseJson?: string;
  analysisJson?: string;
  selectedTagIds?: number[];
}

export interface BooksHomeBook {
  id: number;
  bookTitle: string;
  authorName: string;
  bookLanguage: string;
  bookSource: string;
  bookSeriesName?: string | null;
  bookYear: number;
  status: string;
  createdAt: Date;
  memberId: number;
  familyId: number;
  submitterName: string;
  dislikeCount: number;
  likeCount: number;
  loveCount: number;
  commentCount: number;
  userReactionType?: number | null;
  analysisJson?: string;
  selectedTagIds: number[];
  bookComments: BookHomeComment[];
  discussionThreads: DiscussionThreadSummary[];
  hasDiscussionThread: boolean;
  hasClubSession: boolean;
  dislikeMemberNames: string[];
  likeMemberNames: string[];
  loveMemberNames: string[];
}

export interface BookHomeComment {
  id: number;
  createdAt: Date;
  commenterName: string;
  commentJson: string;
}

export interface BookTagOption {
  id: number;
  tagName: string;
  tagJson?: string | null;
  bookCategoryId?: number;
  categoryName?: string;
  tagDesc?: string | null;
  tagType?: string;
  status?: string;
  seqNo?: number;
}

export type BooksHomePageDataReturn =
  | { success: false; message: string }
  | {
      success: true;
      books: BooksHomeBook[];
      bookTags: BookTagOption[];
      clubs: Club[];
    };

export interface SaveBooksHomeBookInput {
  id?: number;
  bookTitle: string;
  authorName: string;
  bookLanguage: string;
  bookSource: string;
  bookSeriesName?: string;
  bookYear: number;
  status: string;
  analysisJson: string;
  selectedTagIds: number[];
}

export type SaveBooksHomeBookReturn =
  | { success: false; message: string }
  | {
      success: true;
      book: BooksHomeBook;
      message: string;
    };

export interface ToggleBookReactionInput {
  bookId: number;
  reactionType: number;
}

export type ToggleBookReactionReturn =
  | { success: false; message: string }
  | {
      success: true;
      book: BooksHomeBook;
      message: string;
    };

export interface AddBookCommentInput {
  bookId: number;
  commentText: string;
  clientRequestId?: string;
}

export type AddBookCommentReturn =
  | { success: false; message: string }
  | {
      success: true;
      book: BooksHomeBook;
      message: string;
    };

export type BookTagOptionsReturn =
  | { success: false; message: string }
  | {
      success: true;
      bookTags: BookTagOption[];
    };

export type BooksReturn =
  | { success: false; message: string }
  | {
      success: true;
      books: Book[];
    };

export interface BookTerm {
  id: number;
  term: string;
  termJson: string;
  status: string;
  createdAt: Date;
}

export interface SaveBookTermInput {
  id?: number;
  term: string;
  termJson: string;
  status: string;
}

export type SaveBookTermReturn =
  | { success: false; message: string }
  | {
      success: true;
      bookTerm: BookTerm;
    };

export type GetBookTermReturn =
  | { success: false; message: string }
  | {
      success: true;
      bookTerm: BookTerm;
    };

export type BookTermsReturn =
  | { success: false; message: string }
  | {
      success: true;
      bookTerms: BookTerm[];
    };

export interface BookCategory {
  id: number;
  categoryName: string;
  categoryDesc?: string | null;
  updatedAt: Date;
}

export interface BookCategoryTagReferenceItem {
  id: number;
  bookCategoryId: number;
  tagName: string;
  tagJson: string;
  updatedAt: Date;
}

export interface BookCategoryWithTags {
  category: BookCategory;
  tags: BookCategoryTagReferenceItem[];
}

export interface SaveBookCategoryInput {
  id?: number;
  categoryName: string;
  categoryDesc?: string;
}

export interface SaveBookCategoryTagReferenceInput {
  id?: number;
  bookCategoryId: number;
  tagName: string;
  tagJson: string;
}

export interface DeleteBookCategoryInput {
  id: number;
}

export interface DeleteBookCategoryTagReferenceInput {
  id: number;
}

export type BookCategoryWithTagsReturn =
  | { success: false; message: string }
  | {
      success: true;
      categories: BookCategoryWithTags[];
    };

export type SaveBookCategoryReturn =
  | { success: false; message: string }
  | {
      success: true;
      category: BookCategory;
      message: string;
    };

export type SaveBookCategoryTagReferenceReturn =
  | { success: false; message: string }
  | {
      success: true;
      tag: BookCategoryTagReferenceItem;
      message: string;
    };

export type DeleteBookCategoryReturn =
  | { success: false; message: string }
  | {
      success: true;
      message: string;
    };

export type DeleteBookCategoryTagReferenceReturn =
  | { success: false; message: string }
  | {
      success: true;
      message: string;
    };

