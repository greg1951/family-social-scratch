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
  memberId: number;
}
