export type SubmissionStep = {
  id: number;
  label: string;
  status: 'pending' | 'inProgress' | 'completed' | 'error';
  errorMessage?: string;
};

export type MemberKeyDetails = {
  isLoggedIn: boolean;
  email: string;
  isFounder: boolean;
  firstName: string;
  familyId: number;
  familyName: string;
  memberId: number;
}

export type NotificationFDirtyields = {
  notifications?: {
    isSelected?: boolean;
  }[]
}

export type NotificationsFormValues = {
  notifications: {
    memberOptionId: number;
    optionId: number;
    optionName: string;
    isSelected: boolean;
  }[];
}