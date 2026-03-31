import { FounderDetailsReturn } from "../types/family-members";

export async function getMemberDetails(userId: number)
  : Promise<FounderDetailsReturn> {

    return {
      success: false,
      message: "Not implemented yet",
    }

  // let accountDetails: AccountDetails | null = null;
  // if (memberDetails.success) {
  //   accountDetails = {
  //     accountDetails: {
  //       email: memberDetails.email as string,
  //       familyName: memberDetails.familyName,
  //       userId,
  //       memberId: memberDetails.memberId as number,
  //       firstName: memberDetails.firstName as string,
  //       lastName: memberDetails.lastName as string,
  //       nickName: memberDetails.nickName as string,
  //       birthday: memberDetails.birthday as string,
  //       cellPhone: memberDetails.cellPhone as string,
  //       mfaActive: memberDetails.mfaActive as boolean,
  //     }
  //   }
  }
