export type ThreadMemberDetails = {
  email: string;
  status: string;
  memberId: number;
  firstName: string;
  lastName: string;
  nickName?: string;
  familyName: string;
  familyId: number;
  isFounder?: boolean;
  isLoggedIn?: boolean;
}

export type ThreadMemberReturn =
  | { success: false; message: string }
  | {
      success: true;
      threadMemberDetails: ThreadMemberDetails;
    };
