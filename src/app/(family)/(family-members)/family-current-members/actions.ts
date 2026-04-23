'use server';

import { deleteInvite, updateFamilyInviteStatus, getInvitebyInviteId } from "@/components/db/sql/queries-family-invite";
import { deleteMember, findMemberIdByEmail } from "@/components/db/sql/queries-family-member";
import { deleteUserByUserId, getUserByEmail } from "@/components/db/sql/queries-user";
import { StatusUpdateCounts, StatusUpdateProcessing } from "@/components/db/types/family-member";
import { sendFamilyInviteEmails } from "@/components/emails/send-invites-emails";
import { FounderDetails } from "@/features/family/types/family-members";
import { MemberKeyDetails, RegistrationMemberDetails } from "@/features/family/types/family-steps";
import { error } from "console";
import { revalidatePath } from "next/cache";

/*----------------- processInviteDeletes ------------------ */
export async function processInviteDeletes({updatedInvites, statusUpdateCounts, founderDetails}
  : { updatedInvites: StatusUpdateProcessing[], statusUpdateCounts: StatusUpdateCounts, founderDetails: FounderDetails }  ) {
    
  let errorFound = false;

  if (updatedInvites.length > 0) {
    try {
      for (let ix=0; ix < updatedInvites.length; ix++) {
        if (updatedInvites[ix].newStatus === 'remove') {
          const userResult = await getUserByEmail(updatedInvites[ix].email);  
          if (userResult && userResult.success && userResult.id) {
            const deleteUserResult = await deleteUserByUserId(userResult.id);
            if (deleteUserResult.error) {
              throw new Error(`Failed to delete user with email ${updatedInvites[ix].email}: ${deleteUserResult.message}`);
            } 
            else {
              statusUpdateCounts.userDeleteCount++;
            };
          }
          const memberResult = await findMemberIdByEmail(updatedInvites[ix].email);
          // console.log('processInviteDeletes->memberResult: ', memberResult);
          if (memberResult && memberResult.success && memberResult.memberId) {
            const deleteMemberResult = await deleteMember(memberResult.memberId);
            if (!deleteMemberResult || !deleteMemberResult.success) {
              throw new Error(`Failed to delete member with email ${updatedInvites[ix].email}: ${deleteMemberResult?.message || 'Unknown error'}`);
            } else {
              statusUpdateCounts.memberDeleteCount++;
             }
            }  
            else {
              console.warn(`No member found with email ${updatedInvites[ix].email}. Skipping member delete.`);
            }
          }

          const deleteInviteResult = await deleteInvite(updatedInvites[ix].inviteId);
          if (deleteInviteResult && !deleteInviteResult.success) {
            throw new Error(`Failed to delete invite with id ${updatedInvites[ix].inviteId}: ${deleteInviteResult.message}`);
          }
          statusUpdateCounts.inviteDeleteCount++;
        } // end for loop for deletes
    
    } catch (error) {
      console.error('Error processing member deletes:', error);
      errorFound = true;
    }
    finally {
      console.log(`Finished processing member deletes. 
        Total updates: ${statusUpdateCounts.totalUpdateCount} (includes status changes and deletes), 
        Delete records: ${statusUpdateCounts.totalDeleteRecordsCount}:  
        (User deletes: ${statusUpdateCounts.userDeleteCount}, 
        Member deletes: ${statusUpdateCounts.memberDeleteCount},
        Invite deletes: ${statusUpdateCounts.inviteDeleteCount})`);
    }

    revalidatePath("/family-founder-account");

    if (errorFound) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error occurred during delete processing.',
      }
    }
    else {
      return {
        success: true,
        message: "All member updates processed successfully.",
      }
    }
  } 
}

/*----------------- processInviteUpdates ------------------ */
export async function processInviteUpdates({updatedInvites, statusUpdateCounts, founderDetails}
  : { updatedInvites: StatusUpdateProcessing[], statusUpdateCounts: StatusUpdateCounts, founderDetails: FounderDetails }  ) {

  let errorFound:boolean = false;   

  try {
    for (let ix=0; ix < updatedInvites.length; ix++) {
      if (updatedInvites[ix].newStatus === 'resend' || updatedInvites[ix].newStatus === 'invite') {
        let status:string;
        if (updatedInvites[ix].newStatus === 'invite') {
          status = 'invited';
        }
        else {
          status = 'resend';
        }

        console.log(`Processing invite update for inviteId ${updatedInvites[ix].inviteId} with new status ${status}`);  
        const updateResult = await updateFamilyInviteStatus(updatedInvites[ix].inviteId, status);
        if (updateResult && updateResult.error) {
          throw new Error(`Failed to update invite status for invite id ${updatedInvites[ix].inviteId}: ${updateResult.message}`);
        }
        else {
          if (status === 'invited') {
            statusUpdateCounts.inviteAddCount++;
          } else if (status === 'resend') {
            statusUpdateCounts.resendCount++;
          }
        }
      }
    }
  } catch (error) {
    console.error('Error processing invite updates:', error);
    errorFound = true;

  } finally {
    console.log(`Finished processing invite updates. 
      Total updates: ${statusUpdateCounts.totalUpdateCount}, 
      Resend updates done: ${statusUpdateCounts.resendCount}`);
  }

  if (errorFound) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred during status update processing.',
    };
  } else {
    return {
      success: true,
      message: "All member status updates processed successfully.",
    };
  }

}

type FamilyInvites = {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    status?: string | undefined;
    inviteToken?: string | undefined;
    expirationDate?: Date | undefined;
    createdAt: Date;
}[]

/*----------------- sendInviteEmails ------------------ */
export async function sendInviteEmails({updatedInvites, statusUpdateCounts, founderDetails}
  : { updatedInvites: StatusUpdateProcessing[], statusUpdateCounts: StatusUpdateCounts, founderDetails: FounderDetails }  ) {

  let errorFound:boolean = false;   

  const founder:RegistrationMemberDetails = {
    firstName: founderDetails.firstName,
    lastName: founderDetails.lastName,
    email: founderDetails.email,
    familyId: founderDetails.familyId,
    isFounder: founderDetails.isFounder, 
  };

  


try {
  for (let ix=0; ix < updatedInvites.length; ix++) {
    if (updatedInvites[ix].newStatus === 'resend' || updatedInvites[ix].newStatus === 'invite') {
        let status:string;
        if (updatedInvites[ix].newStatus === 'invite') {
          status = 'invited';
        }
        else {
          status = 'resend';
        }

        const inviteResult = await getInvitebyInviteId(updatedInvites[ix].inviteId);
        const familyInvites: FamilyInvites = [];
        if (!inviteResult.error) {
          familyInvites.push({
            id: inviteResult.inviteId,
            email: inviteResult.email,
            firstName: inviteResult.firstName,
            lastName: inviteResult.lastName,
            status: status,
            createdAt: new Date(),
          });
        }
        console.log(`sendInviteEmails->familyInvites: `, familyInvites);
        const sendResult = await sendFamilyInviteEmails(familyInvites, founderDetails.familyName, founderDetails);
        if (sendResult && sendResult.error) {
          throw new Error(`Failed to send invite email for invite id ${updatedInvites[ix].inviteId}: ${sendResult.message}`);
        }
        else {
          statusUpdateCounts.resendEmailsSentCount++;
        }
      }
    }
  } catch (error) {
    console.error('Error processing invite updates:', error);
    errorFound = true;

  } finally {
    console.log(`Finished processing invite updates. 
      Total updates: ${statusUpdateCounts.totalUpdateCount}, 
      Resend updates done: ${statusUpdateCounts.resendCount},
      Resend emails sent: ${statusUpdateCounts.resendEmailsSentCount}`);
  }

  if (errorFound) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred during status update processing.',
    };
  } else {
    return {
      success: true,
      message: "All member status updates processed successfully.",
    };
  }
}