import { getFamilyFounderDetails } from "@/components/db/sql/queries-family-member";
import { FounderDetailsReturn, FounderDetails } from "../types/family-members";
import { getUser2fa } from "@/components/db/sql/queries-user";

export async function getFounderDetails(familyId: number)
  : Promise<FounderDetailsReturn> {

  const founderDetailsResult = await getFamilyFounderDetails(familyId);
  let founderDetailsReturn: FounderDetailsReturn | null = null;
  if (!founderDetailsResult.success) {
    console.error(`Error fetching founder details for familyId ${ familyId }: ${ founderDetailsResult.message }`);
    return {
      success: false,
      message: "Founder details not found",
    };
  } else {
    const mfaActiveResult = await getUser2fa(founderDetailsResult.email);
    if (!mfaActiveResult.success) {
      console.error(`Error fetching 2FA status for founder with email ${ founderDetailsResult.email }: ${ mfaActiveResult.message }`);
      return {
        success: false,
        message: "Error fetching MFA status",
      };
    }
    const founderDetails: FounderDetails  = {
      email: founderDetailsResult.email,
      status: founderDetailsResult.status,
      memberId: founderDetailsResult.memberId,
      firstName: founderDetailsResult.firstName,
      lastName: founderDetailsResult.lastName,
      nickName: founderDetailsResult.nickName!,
      birthday: founderDetailsResult.birthday!,
      cellPhone: founderDetailsResult.cellPhone!,
      familyName: founderDetailsResult.familyName!,
      familyId,
      isFounder: true,
      mfaActive: mfaActiveResult.isActivated,
    };
    founderDetailsReturn = {
      success: true,
      founderDetails,
    };
    return founderDetailsReturn;
  }
}
