export type MovieTagType = "genre" | "adjective" | "channel";

export interface MovieComment {
  id: number;
  createdAt: Date;
  commenterName: string;
  text: string;
}

export interface MovieRecord {
  id: number;
  movieTitle: string;
  movieCaption: string;
  movieJson: string;
  status: string;
  movieImageUrl: string | null;
  movieDebutYear: number;
  updatedAt: Date;
  memberId: number;
  familyId: number;
  submitterName: string;
  commentCount: number;
  noRatingCount: number;
  thumbsUpCount: number;
  loveCount: number;
  likedByMember: boolean;
  likenessDegree: number | null;
  selectedTagIds: number[];
  tagNamesByType: Partial<Record<MovieTagType, string[]>>;
}

export interface MovieDetail extends MovieRecord {
  movieComments: MovieComment[];
}

export interface MovieTagOption {
  id: number;
  tagName: string;
  tagDesc?: string | null;
  tagType: MovieTagType;
  status: string;
  seqNo: number;
}

export interface MovieTemplateOption {
  id: number;
  templateName: string;
  isGlobalTemplate: boolean;
  status: string;
  templateJson: string;
  memberId: number | null;
  familyId: number | null;
  label: string;
}

export interface MovieTemplateRecord {
  id: number;
  templateName: string;
  status: string;
  isGlobalTemplate: boolean;
  templateJson: string;
  memberId: number | null;
  familyId: number | null;
  updatedAt: Date;
  ownerName: string;
  canEdit: boolean;
}

export type MovieHomePageDataReturn =
  | { success: false; message: string }
  | {
      success: true;
      movies: MovieRecord[];
      movieTags: MovieTagOption[];
      movieTemplates: MovieTemplateOption[];
    };

export type MovieTemplateManagementDataReturn =
  | { success: false; message: string }
  | {
      success: true;
      templates: MovieTemplateRecord[];
    };

export interface SaveMovieInput {
  id?: number;
  movieTitle: string;
  movieCaption: string;
  movieJson: string;
  status: string;
  movieImageUrl?: string | null;
  movieDebutYear: number;
  templateId: number;
  selectedTagIds: number[];
}

export interface SaveMovieTemplateInput {
  id?: number;
  templateName: string;
  status: string;
  templateJson: string;
}

export interface ToggleMovieLikeInput {
  movieId: number;
  likenessDegree: number;
}

export interface AddMovieCommentInput {
  movieId: number;
  commentText: string;
}

export type SaveMovieReturn =
  | { success: false; message: string }
  | {
      success: true;
      movie: MovieRecord;
      message: string;
    };

export type SaveMovieTemplateReturn =
  | { success: false; message: string }
  | {
      success: true;
      template: MovieTemplateRecord;
      message: string;
    };

export type GetMovieDetailReturn =
  | { success: false; message: string }
  | {
      success: true;
      movie: MovieDetail;
    };

export type ToggleMovieLikeReturn =
  | { success: false; message: string }
  | {
      success: true;
      movie: MovieDetail;
      message: string;
    };

export type AddMovieCommentReturn =
  | { success: false; message: string }
  | {
      success: true;
      movie: MovieDetail;
      message: string;
    };