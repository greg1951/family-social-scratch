export type GetFamilyReturn = {
  success: boolean,
  message?: string,
  familyId?: number;
  familyName?: string; 
}

export type GetMemberDetailsReturn = {
  success: boolean,
  message?: string,
  familyId?: number;
  memberId?: number;
  userId?: number; 
  firstName?: string; 
  lastName?: string;
  nickName?: string;
  birthday?: string;
  cellPhone?: string;
  mfaActive?: boolean;
}
