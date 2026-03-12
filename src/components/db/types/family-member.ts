export type GetFamilyReturn = {
  success: boolean,
  message?: string,
  status?: string;
  expirationDate?: Date;
  familyId?: number;
  familyName?: string; 
}
export type GetAllFamiliesReturn = {
  success: boolean,
  message?: string,
  familyNames?: string[],
}

export type GetMemberDetailsReturn = {
  success: boolean,
  message?: string,
  userId?: number; 
  email? : string;
  status?: string;
  firstName?: string; 
  lastName?: string;
  nickName?: string;
  birthday?: string;
  cellPhone?: string;
  isFounder?: boolean;
  familyId?: number;
  familyName?: string;
  memberId?: number;
  mfaActive?: boolean;
}

export type InsertFamilyReturn = {
  success: boolean,
  message?: string,
  id?: number;
  name?: string;
  createdAt?: Date; 
}
export type InsertMemberInput = {
  email: string;
  firstName: string;
  lastName: string;
  nickName?: string;
  isFounder: boolean;
  familyId: number;
}
export type InsertMemberReturn = {
  success: boolean,
  message?: string,
  id?: number;
  email?: string;
  firstName?: string;
  lastName?: string;
  nickName?: string;
  isFounder?: boolean;
  createdAt?: Date; 
}
export type InsertUserInput = {
  email: string;
  password: string;
  memberId: number;
  familyId: number;
}
export type InsertUserReturn = {
  success: boolean,
  message?: string,
  id?: number;
  email?: string;
  password?: string;
  memberId?: number;
  familyId?: number;
  createdAt?: Date;
}
export type InsertInvitesInput = {
    email: string;
    firstName: string; 
    lastName: string;
    inviteToken?: string;
    familyId: number;
  }[];


export type InsertInvitesReturn = {
  success: boolean,
  message?: string,
  invites?: {
    id: number;
    email: string;
    firstName: string;
    status?: string;
    lastName: string;
    inviteToken?: string;
    expirationDate?: Date;
    familyId: number;
    createdAt: Date;
  }[]
};

export type GetAllFamilyMembersReturn = {
  success: boolean,
  message?: string,
  members?: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    status?: string;
    inviteToken?: string;
    expirationDate?: Date;
    createdAt: Date;
    familyId: number;
  }[]
};

export type GetMemberNotificationsReturn = {
  success: boolean,
  message?: string,
  memberId?: number;
  notifications?: {
    memberOptionId: number;
    optionId: number;
    optionName: string;
    optionDesc: string;
    isSelected: boolean;
  }[]
};
