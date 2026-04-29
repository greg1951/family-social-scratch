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
  likesCount: number;
  commentCount: number;
  likedByMember: boolean;
  verseJson?: string;
  analysisJson?: string;
  selectedTagIds: number[];
  poemComments: PoetryHomeComment[];
}

export interface PoetryHomeComment {
  id: number;
  createdAt: Date;
  commenterName: string;
  text: string;
}

export interface PoemTagOption {
  id: number;
  tagName: string;
  tagDesc?: string | null;
  tagType: string;
  status: string;
  seqNo: number;
}

export type PoetryHomePageDataReturn =
  | { success: false; message: string }
  | {
      success: true;
      poems: PoetryHomePoem[];
      poemTags: PoemTagOption[];
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

export interface TogglePoemLikeInput {
  poemId: number;
}

export type TogglePoemLikeReturn =
  | { success: false; message: string }
  | {
      success: true;
      poem: PoetryHomePoem;
      message: string;
    };

export interface AddPoemCommentInput {
  poemId: number;
  commentText: string;
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
