export type ShowTagType = "genre" | "adjective" | "channel";

export interface ShowComment {
  id: number;
  createdAt: Date;
  commenterName: string;
  text: string;
}

export interface TvShow {
  id: number;
  showTitle: string;
  showCaption: string;
  showJson: string;
  status: string;
  showImageUrl: string | null;
  showFirstYear: number;
  showLastYear: number;
  seasonCount: number;
  updatedAt: Date;
  memberId: number;
  familyId: number;
  submitterName: string;
  submitterLikenessDegree: number | null;
  commentCount: number;
  noRatingCount: number;
  thumbsUpCount: number;
  loveCount: number;
  likedByMember: boolean;
  likenessDegree: number | null;
  selectedTagIds: number[];
  tagNamesByType: Partial<Record<ShowTagType, string[]>>;
}

export interface TvShowDetail extends TvShow {
  showComments: ShowComment[];
}

export interface ShowTagOption {
  id: number;
  tagName: string;
  tagDesc?: string | null;
  tagType: ShowTagType;
  status: string;
  seqNo: number;
}

export interface ShowTemplateOption {
  id: number;
  templateName: string;
  isGlobalTemplate: boolean;
  status: string;
  templateJson: string;
  memberId: number | null;
  familyId: number | null;
  label: string;
}

export interface ShowTemplateRecord {
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

export type TvHomePageDataReturn =
  | { success: false; message: string }
  | {
      success: true;
      shows: TvShow[];
      showTags: ShowTagOption[];
      showTemplates: ShowTemplateOption[];
    };

export type TvTemplateManagementDataReturn =
  | { success: false; message: string }
  | {
      success: true;
      templates: ShowTemplateRecord[];
    };

export interface SaveShowInput {
  id?: number;
  showTitle: string;
  showCaption: string;
  submitterLikenessDegree?: number;
  showJson: string;
  status: string;
  showImageUrl?: string | null;
  showFirstYear: number;
  showLastYear: number;
  seasonCount: number;
  templateId: number;
  selectedTagIds: number[];
}

export interface SaveShowTemplateInput {
  id?: number;
  templateName: string;
  status: string;
  templateJson: string;
}

export interface ToggleShowLikeInput {
  showId: number;
  likenessDegree: number;
}

export interface AddShowCommentInput {
  showId: number;
  commentText: string;
}

export type SaveShowReturn =
  | { success: false; message: string }
  | {
      success: true;
      show: TvShow;
      message: string;
    };

export type SaveShowTemplateReturn =
  | { success: false; message: string }
  | {
      success: true;
      template: ShowTemplateRecord;
      message: string;
    };

export type GetShowDetailReturn =
  | { success: false; message: string }
  | {
      success: true;
      show: TvShowDetail;
    };

export type ToggleShowLikeReturn =
  | { success: false; message: string }
  | {
      success: true;
      show: TvShowDetail;
      message: string;
    };

export type AddShowCommentReturn =
  | { success: false; message: string }
  | {
      success: true;
      show: TvShowDetail;
      message: string;
    };
