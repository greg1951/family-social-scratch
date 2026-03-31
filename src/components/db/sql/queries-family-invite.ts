import db from '@/components/db/drizzle';
import { count, eq, and } from 'drizzle-orm';
import { family, familyInvitation, member, optionReference, user, memberOption } from '../schema/family-social-schema-tables';
import { UpdateInviteStatusResult, UpdateInviteTokenInput, UpdateInviteTokenResult } from "@/features/family/types/family-steps";
import { InsertInvitesInput, 
         InsertInvitesReturn, 
         MemberRegistrationReturn, 
         GetInviteByMemberIdReturn,
         GenericDatabaseReturn,
         StatusUpdateProcessing,
         GetInviteReturn,
         InsertInviteInput,
         InsertInviteReturn} from '../types/family-member';
import { get } from 'http';
import { CurrentMembersValues, NewFamilyInvites, UpdateInvite } from '@/features/family/types/family-members';
import { deleteUserByUserId, getUserByEmail } from './queries-user';


/*------------------- insertInvites (bulk insert) ------------------- */
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

/*------------------- insertInvite (singleton insert) ------------------- */
export async function insertInvite(inviteArg: InsertInviteInput)
: Promise<InsertInviteReturn> {

  // console.log("insertInvite-> invite: ", inviteArg);

  const [insertResult] = await db.insert(familyInvitation).values(inviteArg).returning();
  if (!insertResult) {
    return {
      success: false,
      message: `Failed to insert invite for email ${inviteArg.email}`,
    };
  }
  if (insertResult.id === undefined || insertResult.createdAt === undefined) {
    return {
      success: false,
      message: `Insert invite did not return expected id or createdAt for email ${inviteArg.email}`,
    };
  }

  return {
    success: true,
      id: insertResult.id,
      createdAt: insertResult.createdAt as Date,
  };
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

/*----------------------- getInviteToken ----------------------  */
export async function getInviteToken(token: string) : Promise<MemberRegistrationReturn> {
  // console.log('queries-family-invite->getInviteToken->token: ', token);

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
      memberToRegister: {
      id: inviteResetToken.family_invitation.id,
      email: inviteResetToken.family_invitation.email,
      firstName: inviteResetToken.family_invitation.firstName,
      lastName: inviteResetToken.family_invitation.lastName,
      tokenExpiry: inviteResetToken.family_invitation.expirationDate as Date,
      isValidExpiry: isValid,
      familyId: inviteResetToken.family.id,
      familyName: inviteResetToken.family.name,
      }
    };
};

/*------------------ getInvitebyMemberId ------------------ */
export async function getInvitebyMemberId(memberId: number) : Promise<GetInviteByMemberIdReturn> {

  const [inviteMemberResult] = await db
    .select()
    .from(member).innerJoin(family, eq(family.id, member.familyId)).innerJoin(familyInvitation, eq(familyInvitation.familyId, family.id))
    .where(eq(member.id, memberId));

    if (!inviteMemberResult) {
      return {
        error: true,
        message: "Did not find invitation for memberId: " + memberId,
      }
    }
    else {
      return {
        error: false,
        inviteId: inviteMemberResult.family_invitation.id,
        familyId: inviteMemberResult.family.id,
      };
    }
};

/*------------------ getInvitebyInviteId ------------------ */
export async function getInvitebyInviteId(inviteId: number) : Promise<GetInviteReturn> {

  const [inviteMemberResult] = await db
    .select()
    .from(familyInvitation)
    .where(eq(familyInvitation.id, inviteId));

    if (!inviteMemberResult) {
      return {
        error: true,
        message: "Did not find invitation for inviteId: " + inviteId,
      }
    }
    else {
      return {
        error: false,
        inviteId: inviteMemberResult.id,
        familyId: inviteMemberResult.familyId,
        email: inviteMemberResult.email,
        firstName: inviteMemberResult.firstName,
        lastName: inviteMemberResult.lastName,
      };
    }
};
/*------------------ getInvitebyInviteEmail ------------------ */
export async function getInvitebyInviteEmail(email: string) : Promise<GetInviteReturn> {

  const [inviteMemberResult] = await db
    .select()
    .from(familyInvitation)
    .where(eq(familyInvitation.email, email));

    if (!inviteMemberResult) {
      return {
        error: true,
        message: "Did not find invitation for email: " + email,
      }
    }
    else {
      return {
        error: false,
        inviteId: inviteMemberResult.id,
        familyId: inviteMemberResult.familyId,
        email: inviteMemberResult.email,
        firstName: inviteMemberResult.firstName,
        lastName: inviteMemberResult.lastName,
      };
    }
};

/*-------------------- updateFamilyInviteStatus ------------------ */
export async function updateFamilyInviteStatus(id: number, status: string)
: (Promise<UpdateInviteStatusResult>) {

  const updateResult = await db
    .update(familyInvitation)
    .set({
      status: status,
      statusUpdate: new Date(),
    })
    .where(eq(familyInvitation.id, id));

  if (!updateResult) {
    return {
      error: true,
      message: `Failed to update invite status for inviteId ${id}`
    }
  }
  if (status === 'joined')  {
    const updateResult = await db
      .update(familyInvitation)
      .set({
        inviteToken: "",
      })
      .where(eq(familyInvitation.id, id));
      
    if (!updateResult) {
      return {
        error: true,
        message: `Failed to clear invite token for inviteId ${id} after status update to joined`
      }
    }
  }
  return {error: false}
}

/*------------------ addNewInvites ------------------ */
export async function addNewInvites({newInvites, familyId}
  : { newInvites: NewFamilyInvites, familyId: number })
  : Promise<InsertInvitesReturn> {
  // console.log('queries-family-invite->addNewInvites->newInvites: ', newInvites); 

  const invites = newInvites.newInvites.map((invite) => ({
    firstName: invite.firstName,
    lastName: invite.lastName,
    email: invite.email,
    status: 'invited',
    familyId: familyId,
  }));

  const insertResult = await db.insert(familyInvitation).values(invites).returning();
  if (!insertResult) {
    // console.error('queries-family-invite->addNewInvites->FAILED to insert invites: ', invites);
    return {
      success: false,
      message: `Failed to insert new invites`, 
    }
  }
  else {
    // console.log('queries-family-invite->addNewInvites->Successfully inserted invites: ', insertResult);
    const returnInvites = insertResult.map((invite) => ({
      id: invite.id,
      email: invite.email,
      firstName: invite.firstName,
      lastName: invite.lastName,
      familyId: invite.familyId,
      createdAt: invite.createdAt as Date,
    }));

    return {
      success: true,
      invites: returnInvites,
    };  
  }
}

/*----------------- deleteInvite ------------------ */
export async function deleteInvite(inviteId:number) {
  const deleteResult = await db
    .delete(familyInvitation)
    .where(eq(familyInvitation.id, inviteId));

  if (!deleteResult) {
    return {
      success: false,
      message: `Failed to delete invite with inviteId ${inviteId}`,
    };
  }
  return {
    success: true,
  };
}


