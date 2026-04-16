export interface Book {
  id: number;
  bookTitle: string;
  authorName: string;
  bookLanguage: string;
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
  bookYear: number;
  status: string;
  createdAt: Date;
  memberId: number;
  familyId: number;
  submitterName: string;
  likesCount: number;
  commentCount: number;
  likedByMember: boolean;
  analysisJson?: string;
  selectedTagIds: number[];
  bookComments: BookHomeComment[];
}

export interface BookHomeComment {
  id: number;
  createdAt: Date;
  commenterName: string;
  text: string;
}

export interface BookTagOption {
  id: number;
  tagName: string;
  tagDesc?: string | null;
  status: string;
}

export type BooksHomePageDataReturn =
  | { success: false; message: string }
  | {
      success: true;
      books: BooksHomeBook[];
      bookTags: BookTagOption[];
    };

export interface SaveBooksHomeBookInput {
  id?: number;
  bookTitle: string;
  authorName: string;
  bookLanguage: string;
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

export interface ToggleBookLikeInput {
  bookId: number;
}

export type ToggleBookLikeReturn =
  | { success: false; message: string }
  | {
      success: true;
      book: BooksHomeBook;
      message: string;
    };

export interface AddBookCommentInput {
  bookId: number;
  commentText: string;
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

