import db from '@/components/db/drizzle';
import { count, eq, and } from 'drizzle-orm';
import { family, familyInvitation, member, optionReference, user, memberOption } from '../schema/family-social-schema-tables';
import { UpdateInviteTokenInput, UpdateInviteTokenResult } from "@/features/family/types/family-steps";
import { InsertInvitesInput, 
         InsertInvitesReturn, 
         GetInviteTokenReturn } from '../types/family-member';

         
export async function insertInvites(invitesArg: InsertInvitesInput)
: Promise<InsertInvitesReturn> {

    // console.log("insertInvites-> invites: ", invitesArg);

    const insertResult = await db.insert(familyInvitation).values(invitesArg).returning();
    if (!insertResult) {
      return {
        success: false,
        message: `Failed to insert invites`,
      }
    } 
    
    // console.log("insertInvites-> insertResult: ", insertResult);
    const returnInvites = insertResult.map((invite) => ({
      id: invite.id,
      email: invite.email,
      firstName: invite.firstName,
      lastName: invite.lastName,
      familyId: invite.familyId,
      createdAt: invite.createdAt as Date,
    }));
    // console.log("insertInvites-> returnInvites: ", returnInvites);

    return {
      success: true,
      invites: returnInvites,
    }
}


export async function updateFamilyInviteToken({inviteToken }: { inviteToken: UpdateInviteTokenInput })
: (Promise<UpdateInviteTokenResult>) {

  const updateResult = await db
    .update(familyInvitation)
    .set({
      inviteToken: inviteToken.token,
      expirationDate: inviteToken.expiry
    })
    .where(eq(familyInvitation.id, inviteToken.inviteId));

  if (!updateResult) {
    return {
      error: true,
      message: `Failed to update invite token for inviteId ${inviteToken.inviteId}`
    }
  }

  return {error: false, message: "Invite token updated successfully"}
}

export async function getInviteToken(token: string) : Promise<GetInviteTokenReturn> {

  const [inviteResetToken] = await db
    .select()
    .from(familyInvitation).innerJoin(family, eq(family.id, familyInvitation.familyId))
    .where(eq(familyInvitation.inviteToken, token));

    if (!inviteResetToken) {
      return {
        error: true,
        message: "Did not find token"
      }
    };

    let isValid: boolean=false;
    const now = Date.now();
    if (inviteResetToken.family_invitation.expirationDate && now < inviteResetToken.family_invitation.expirationDate.getTime()) {
      isValid=true;
    }

    if (!isValid) {
      return {
        error: true,
        message: "Token has expired"
      }
    }
    
    return {
      error: false,
      email: inviteResetToken.family_invitation.email,
      firstName: inviteResetToken.family_invitation.firstName,
      lastName: inviteResetToken.family_invitation.lastName,
      tokenExpiry: inviteResetToken.family_invitation.expirationDate as Date,
      isValidExpiry: isValid,
      familyId: inviteResetToken.family.id,
      familyName: inviteResetToken.family.name,
    };
};

