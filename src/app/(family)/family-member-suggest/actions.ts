import { CurrentFamilyMember } from "@/features/family/types/family-members";
// import { revalidatePath } from "next/cache";
import { MemberKeyDetails } from "@/features/family/types/family-steps";
import { insertInvite, insertInvites } from "@/components/db/sql/queries-family-invite";
import { inviteStatusSuggested } from "@/features/family/constants/family-steps";
import { InsertInviteInput } from "@/components/db/types/family-member";



export const createSuggestedInvite= async ({
  suggestedInvite,
  }:{
    suggestedInvite: InsertInviteInput;
  }) => {
   
  /* Let the logic begin */
  if (suggestedInvite) {
    const insertInvitesResult = await insertInvite(suggestedInvite);

    console.log('createSuggestedInvite->insertInvitesResult: ', insertInvitesResult);

    if (!insertInvitesResult.success) {
      return {
        error: true,
        message: insertInvitesResult.message,
      }
    }
    // revalidatePath("/family-member-account");
    return {
      error: false,
      }
    }
  }
