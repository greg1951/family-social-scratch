export type NewFamilyMember = {
  id: string
  firstName: string
  lastName: string
  email: string
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



