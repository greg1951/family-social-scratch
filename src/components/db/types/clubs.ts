export interface Club {
  id: number;
  status: string;
  clubName: string;
  createdAt: Date;
  clubFounderId: number | null;
  familyId: number;
  founderName?: string;
  sessionCount?: number;
  sessions?: ClubSession[];
}

export interface ClubSession {
  id: number;
  status: string;
  startedAt: Date;
  finishesAt: Date | null;
  targetType: string;
  targetId: number;
  clubId: number;
  moderatorId: number | null;
  discussThreadId?: number;
  clubName?: string;
  targetTitle?: string;
  moderatorName?: string;
  discussTopic?: string;
  topicJson?: string | null;
  contentJson?: string | null;
}

export type ClubsHomePageDataReturn =
  | { success: false; message: string }
  | {
      success: true;
      clubs: Club[];
    };

export interface SaveClubInput {
  id?: number;
  clubName: string;
}

export type SaveClubReturn =
  | { success: false; message: string }
  | {
      success: true;
      club: Club;
      message: string;
    };

export interface DeleteClubInput {
  clubId: number;
}

export type DeleteClubReturn =
  | { success: false; message: string }
  | {
      success: true;
      message: string;
    };

export interface CreateClubSessionInput {
  clubId: number;
  targetType: 'book' | 'poem';
  targetId: number;
  startedAt?: string;
  finishesAt?: string;
  topicJson: string;
}

export type CreateClubSessionReturn =
  | { success: false; message: string }
  | {
      success: true;
      clubSessionId: number;
      threadId: number;
      message: string;
    };

export interface UpdateClubSessionInput {
  clubSessionId: number;
  clubId: number;
  startedAt?: string;
  finishesAt?: string;
  topicJson: string;
}

export type UpdateClubSessionReturn =
  | { success: false; message: string }
  | {
      success: true;
      clubSessionId: number;
      threadId: number;
      targetType: 'book' | 'poem';
      targetId: number;
      message: string;
    };

export interface DeleteClubSessionInput {
  clubSessionId: number;
}

export type DeleteClubSessionReturn =
  | { success: false; message: string }
  | {
      success: true;
      targetType: 'book' | 'poem';
      targetId: number;
      message: string;
    };