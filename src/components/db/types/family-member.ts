
export type GenericDatabaseReturn = {
  success: boolean;
  message?: string;
};

export type GetFamilyReturn =
  | { success: false; message: string }
  | {
      success: true;
      status?: string;
      expirationDate?: Date;
      familyId: number;
      familyName: string;
    };
export type GetAllFamiliesReturn =
  | { success: false; message: string }
  | { success: true; familyNames: string[] };

export type GetMemberDetailsReturn =
  | { success: false; message: string }
  | {
      success: true;
      userId: number;
      email: string;
      status: string;
      firstName: string;
      lastName: string;
      nickName?: string;
      birthday?: string;
      cellPhone?: string;
      isFounder: boolean;
      isAdmin?: boolean;
      familyId: number;
      familyName: string;
      memberId: number;
      mfaActive: boolean;
    };
    
export type GetFounderDetailsReturn =
  | { success: false; message: string }
  | {
      success: true;
      email: string;
      status: string;
      firstName: string;
      lastName: string;
      nickName?: string;
      birthday?: string;
      cellPhone?: string;
      memberId: number;
      familyName?: string;
    };

export type InsertFamilyReturn =
  | { success: false; message: string }
  | {
      success: true;
      id: number;
      name: string;
      createdAt: Date;
    };
export type InsertMemberInput = {
  email: string;
  firstName: string;
  lastName: string;
  nickName?: string;
  phone?: string;
  isFounder: boolean;
  familyId: number;
}

/* Keeping all input properties here as id and other props are needed by other functions */
export type InsertMemberReturn =
  | { success: false; message: string }
  | {
      success: true;
      id: number;
      email: string;
      firstName: string;
      lastName: string;
      nickName?: string;
      phone?: string;
      isFounder: boolean;
      createdAt: Date;
    };

export type RegisterMemberInput = {
  email: string;
  firstName: string;
  lastName: string;
  nickName?: string;
  phone?: string;
  password: string;
  isFounder: boolean;
  familyId: number;
}
export type RegisterMemberReturn =
  | { success: false; message: string }
  | {
      success: true;
      id: number;
      createdAt: Date;
    };



export type InsertUserInput = {
  email: string;
  password: string;
  memberId: number;
  familyId: number;
}
export type InsertUserReturn =
  | { success: false; message: string }
  | {
      success: true;
      id: number;
      // email: string;
      // memberId: number;
      // familyId: number;
      createdAt: Date;
    };

export type InsertInviteInput = {
    email: string;
    firstName: string; 
    lastName: string;
    inviteToken?: string;
    status?: string;
    familyId: number;
  };

export type InsertInvitesInput = InsertInviteInput[];

export type InsertInvitesReturn =
  | { success: false; message: string }
  | {
      success: true;
      invites: {
        id: number;
        email: string;
        firstName: string;
        lastName: string;
        status?: string;
        inviteToken?: string;
        expirationDate?: Date;
        // familyId: number;
        createdAt: Date;
      }[];
    };

export type InsertInviteReturn =
  | { success: false; message: string }
  | {
      success: true;
      id: number;
      createdAt: Date;
    };

export type GetAllFamilyMembersReturn =
  | { success: false; message: string }
  | {
      success: true;
      members: {
        id: number;
        email: string;
        firstName: string;
        lastName: string;
        status?: string;
        inviteToken?: string;
        expirationDate?: Date;
        createdAt: Date;
        familyId: number;
      }[];
    };

export type GetMemberNotificationsReturn =
  | { success: false; message: string }
  | {
      success: true;
      memberId: number;
      notifications: {
        memberOptionId: number;
        optionId: number;
        optionName: string;
        optionDesc: string;
        isSelected: boolean;
      }[];
    };

export type MemberRegistrationReturn =
  | { error: true; message: string }
  | {
      error: false;
      memberToRegister: MemberRegistrationInput;
    };

export type MemberRegistrationInput = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  tokenExpiry: Date;
  isValidExpiry: boolean;
  familyName: string;
  familyId: number;
};


export type GetInviteByMemberIdReturn =
  | { error: true; message: string }
  | {
      error: false;      
      inviteId: number;
      familyId: number;
    };

export type GetInviteReturn =
  | { error: true; message: string }
  | {
      error: false;      
      inviteId: number;
      email: string;
      firstName: string;
      lastName: string;
      familyId: number;
    };


export type InsertMemberNotificationsReturn = {
  success: boolean;
  message?: string;
};

export type GetAllOptionsRefReturn =
  | { success: false; message: string }
  | {
      success: true;
      options: {
        id: number;
        optionName: string;
        optionDesc: string;
      }[];
    };

export type StatusUpdateProcessing = {
  inviteId: number;
  newStatus: string;
  originalStatus?: string;
  email: string;
  deleteMember: boolean;
}    

export type StatusUpdateCounts = {
  totalUpdateCount: number;
  totalInviteRecordsCount: number;
  totalDeleteRecordsCount: number;
  userDeleteCount: number;
  memberDeleteCount: number;
  inviteAddCount: number;
  inviteDeleteCount: number;
  totalResendRecordsCount: number;
  resendCount: number;
  resendEmailsSentCount: number;
};