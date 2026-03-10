export type GetFamilyReturn = {
  success: boolean,
  message?: string,
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
    familyId: number;
  }[];


export type InsertInvitesReturn = {
  success: boolean,
  message?: string,
  invites?: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    familyId: number;
    createdAt: Date;
    }[]
}

