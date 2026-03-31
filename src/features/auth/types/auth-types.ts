export interface AccountDetails {
  accountDetails: {
    email: string;
    familyName: string;
    userId: number;
    memberId: number;
    firstName: string;
    lastName: string;
    nickName?: string;
    birthday?: string;
    cellPhone?: string;
    mfaActive: boolean;
  } 
}
export interface UpdateAccountDetails {
  memberId: number;
  firstName: string;
  lastName: string;
  nickName?: string;
  birthday?: string;
  cellPhone?: string;
}

export interface UpdateMemberReturn {
  success: boolean;
  message?: string;
}
