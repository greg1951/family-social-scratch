export type SubmissionStep = {
  id: number;
  label: string;
  status: 'pending' | 'inProgress' | 'completed' | 'error';
  errorMessage?: string;
};
