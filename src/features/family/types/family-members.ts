export type NewFamilyMember = {
  id: string
  firstName: string
  lastName: string
  email: string
}

export type GetMemberDetailsByEmailReturn = {
  success: boolean;
  message?: string;
  memberId?: number;
}


export interface NewFamilyInvite {
  id: string
  firstName: string
  lastName: string
  email: string
}

export interface NewFamilyInvites {
  newInvites: NewFamilyInvite[];
}

export type CurrentFamilyMember = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
}

export type CurrentMemberDirtyFields = {
  currentMembers?: {
    status?: string;
  }[]
}

export type CurrentMembersValues = {
  currentMembers: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    status: string;
  }[];
}

export type UpdateInvite = {
  id: number;
  status: string;
}

export type StandardResponse = {
  success: boolean;
  message: string;
}

export type FounderDetails = {
  email: string;
  status: string;
  memberId: number;
  firstName: string;
  lastName: string;
  nickName?: string;
  birthday?: string;
  cellPhone?: string;
  familyName: string;
  familyId: number;
  isFounder?: boolean;
  mfaActive?: boolean;
  isLoggedIn?: boolean;
}

export type FounderDetailsReturn =
  | { success: false; message: string }
  | {
      success: true;
      founderDetails: FounderDetails;
    };

