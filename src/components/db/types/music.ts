export type MusicTagType = "genre" | "subGenre";

export interface MusicComment {
  id: number;
  createdAt: Date;
  commenterName: string;
  text: string;
}

export interface MusicRecord {
  id: number;
  musicTitle: string;
  artistName: string;
  musicJson: string;
  status: string;
  isSong: boolean;
  musicImageUrl: string | null;
  musicDebutYear: number;
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
  tagNamesByType: Partial<Record<MusicTagType, string[]>>;
}

export interface MusicLyricsRecord {
  id: number;
  lyricsJson: string;
  status: string;
  updatedAt: Date;
  musicId: number;
  memberId: number;
}

export interface MusicDetail extends MusicRecord {
  musicComments: MusicComment[];
  lyrics: MusicLyricsRecord | null;
}

export interface MusicTagOption {
  id: number;
  tagName: string;
  tagDesc?: string | null;
  tagType: MusicTagType;
  status: string;
  seqNo: number;
}

export interface MusicTemplateOption {
  id: number;
  templateName: string;
  isGlobalTemplate: boolean;
  status: string;
  templateJson: string;
  memberId: number | null;
  familyId: number | null;
  label: string;
}

export interface MusicTemplateRecord {
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

export type MusicHomePageDataReturn =
  | { success: false; message: string }
  | {
      success: true;
      musics: MusicRecord[];
      musicTags: MusicTagOption[];
      musicTemplates: MusicTemplateOption[];
    };

export type MusicTemplateManagementDataReturn =
  | { success: false; message: string }
  | {
      success: true;
      templates: MusicTemplateRecord[];
    };

export interface SaveMusicInput {
  id?: number;
  musicTitle: string;
  artistName: string;
  submitterLikenessDegree?: number;
  musicJson: string;
  status: string;
  isSong: boolean;
  musicImageUrl?: string | null;
  musicDebutYear: number;
  templateId: number;
  selectedTagIds: number[];
}

export interface SaveMusicTemplateInput {
  id?: number;
  templateName: string;
  status: string;
  templateJson: string;
}

export interface SaveMusicLyricsInput {
  musicId: number;
  lyricsJson: string;
  status: string;
}

export interface ToggleMusicLikeInput {
  musicId: number;
  likenessDegree: number;
}

export interface AddMusicCommentInput {
  musicId: number;
  commentText: string;
}

export type SaveMusicReturn =
  | { success: false; message: string }
  | {
      success: true;
      music: MusicRecord;
      message: string;
    };

export type SaveMusicTemplateReturn =
  | { success: false; message: string }
  | {
      success: true;
      template: MusicTemplateRecord;
      message: string;
    };

export type SaveMusicLyricsReturn =
  | { success: false; message: string }
  | {
      success: true;
      lyrics: MusicLyricsRecord;
      message: string;
    };

export type GetMusicDetailReturn =
  | { success: false; message: string }
  | {
      success: true;
      music: MusicDetail;
    };

export type ToggleMusicLikeReturn =
  | { success: false; message: string }
  | {
      success: true;
      music: MusicDetail;
      message: string;
    };

export type AddMusicCommentReturn =
  | { success: false; message: string }
  | {
      success: true;
      music: MusicDetail;
      message: string;
    };
