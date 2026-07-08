import type { Club } from './clubs';
import type { DiscussionThreadSummary } from './discuss-threads';

export interface Poem {
  id: number;
  poemTitle: string;
  poetName: string;
  poemSource: string;
  poemYear: number;
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

export type PoemsReturn =
  | { success: false; message: string }
  | {
      success: true;
      poems: Poem[];
    };

export interface PoetryHomePoem {
  id: number;
  poemTitle: string;
  poetName: string;
  poemSource: string;
  poemYear: number;
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
  verseJson?: string;
  analysisJson?: string;
  selectedTagIds: number[];
  poemComments: PoetryHomeComment[];
  discussionThreads: DiscussionThreadSummary[];
  hasDiscussionThread: boolean;
  hasClubSession: boolean;
  dislikeMemberNames: string[];
  likeMemberNames: string[];
  loveMemberNames: string[];
}

export interface PoetryHomeComment {
  id: number;
  createdAt: Date;
  commenterName: string;
  commentJson: string;
}

export interface PoemTagOption {
  id: number;
  tagName: string;
  tagJson?: string | null;
  poemCategoryId?: number;
  categoryName?: string;
  tagDesc?: string | null;
  tagType?: string;
  status?: string;
  seqNo?: number;
}

export type PoetryHomePageDataReturn =
  | { success: false; message: string }
  | {
      success: true;
      poems: PoetryHomePoem[];
      poemTags: PoemTagOption[];
      clubs: Club[];
    };

export interface SavePoetryHomePoemInput {
  id?: number;
  poemTitle: string;
  poetName: string;
  poemSource: string;
  poemYear: number;
  status: string;
  verseJson: string;
  analysisJson: string;
  selectedTagIds: number[];
}

export type SavePoetryHomePoemReturn =
  | { success: false; message: string }
  | {
      success: true;
      poem: PoetryHomePoem;
      message: string;
    };

export interface TogglePoemReactionInput {
  poemId: number;
  reactionType: number;
}

export type TogglePoemReactionReturn =
  | { success: false; message: string }
  | {
      success: true;
      poem: PoetryHomePoem;
      message: string;
    };

export interface AddPoemCommentInput {
  poemId: number;
  commentText: string;
  clientRequestId?: string;
}

export type AddPoemCommentReturn =
  | { success: false; message: string }
  | {
      success: true;
      poem: PoetryHomePoem;
      message: string;
    };

export type PoemTagOptionsReturn =
  | { success: false; message: string }
  | {
      success: true;
      poemTags: PoemTagOption[];
    };

export type GetPoetryHomePoemReturn =
  | { success: false; message: string }
  | {
      success: true;
      poem: PoetryHomePoem;
    };

export interface PoemTerm {
  id: number;
  term: string;
  termJson: string;
  status: string;
  createdAt: Date;
}

export interface SavePoemTermInput {
  id?: number;
  term: string;
  termJson: string;
  status: string;
}

export type SavePoemTermReturn =
  | { success: false; message: string }
  | {
      success: true;
      poemTerm: PoemTerm;
    };

export type GetPoemTermReturn =
  | { success: false; message: string }
  | {
      success: true;
      poemTerm: PoemTerm;
    };

export type PoemTermsReturn =
  | { success: false; message: string }
  | {
      success: true;
      poemTerms: PoemTerm[];
    };

export interface PoemCategory {
  id: number;
  categoryName: string;
  categoryDesc?: string | null;
  updatedAt: Date;
}

export interface PoemCategoryTagReferenceItem {
  id: number;
  poemCategoryId: number;
  tagName: string;
  tagJson: string;
  updatedAt: Date;
}

export interface PoemCategoryWithTags {
  category: PoemCategory;
  tags: PoemCategoryTagReferenceItem[];
}

export interface SavePoemCategoryInput {
  id?: number;
  categoryName: string;
  categoryDesc?: string;
}

export interface SavePoemCategoryTagReferenceInput {
  id?: number;
  poemCategoryId: number;
  tagName: string;
  tagJson: string;
}

export interface DeletePoemCategoryInput {
  id: number;
}

export interface DeletePoemCategoryTagReferenceInput {
  id: number;
}

export type PoemCategoryWithTagsReturn =
  | { success: false; message: string }
  | {
      success: true;
      categories: PoemCategoryWithTags[];
    };

export type SavePoemCategoryReturn =
  | { success: false; message: string }
  | {
      success: true;
      category: PoemCategory;
      message: string;
    };

export type SavePoemCategoryTagReferenceReturn =
  | { success: false; message: string }
  | {
      success: true;
      tag: PoemCategoryTagReferenceItem;
      message: string;
    };

export type DeletePoemCategoryTagReferenceReturn =
  | { success: false; message: string }
  | {
      success: true;
      message: string;
    };

export type DeletePoemCategoryReturn =
  | { success: false; message: string }
  | {
      success: true;
      message: string;
    };
