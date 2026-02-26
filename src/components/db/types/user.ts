export type RegisteredReturnType = {
  id: number;
  email: string;
  password: string;
  mfaSecret: string;
  mfaActivated: boolean;
}

export type ErrorReturnType = {
  error: boolean;
  message?: string;
}

export type UserPasswordReturnType = {
  success: boolean; 
  id?: number; 
  password?: string; 
  salt?: string; 
  message?: string
}

export type GetFullUserCredsReturnType = {
  success: boolean,
  message?: string,
  id?: number; 
  email?: string; 
  password?: string; 
  salt?: string;
  isActivated?: boolean;
  secret?: string;
  familyId?: number;
  memberId?: number;
}

export type GetUser2faReturnType = {
  success: boolean; 
  message?: string;
  id?: number; 
  secret?: string; 
  isActivated?: boolean; 
}

export type Update2faSecretRecordType = {
  email: string; 
  secret: string;
}

export type Update2faActivatedRecordType = {
  email: string; 
  isActivated: boolean;
}

export type EmailByIdReturnType = {
  success: boolean; 
  email?: string; 
  message?: string
}

