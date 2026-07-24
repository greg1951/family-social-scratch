'use server';

import { createThreadConversationWithInitialPost } from "@/components/db/sql/queries-thread-convos";
import { insertInvites } from "@/components/db/sql/queries-family-invite";
import { insertFamily, insertMember, insertUser } from "@/components/db/sql/queries-family-user";
import { InsertInvitesReturn } from "@/components/db/types/family-member";
import type { InsertInvitesInput, InsertUserInput } from "@/components/db/types/family-member";
import { getMemberDetailsByEmail } from "@/components/db/sql/queries-family-member";

import { RegistrationMemberDetails } from "@/features/family/types/family-steps";
import { sendFamilyInviteEmails } from "@/components/emails/send-invites-emails";
import { FounderDetails } from "@/features/family/types/family-members";

export const createFamily = async (familyName: string) => {
  return insertFamily(familyName);
};

export const createFounderMember = async (registrationDetails: RegistrationMemberDetails) => {
  return insertMember(registrationDetails);
};

export const createFounderUser = async (userDetails: InsertUserInput) => {
  return insertUser(userDetails);
};

export const createFamilyInvites = async (invitesInput: InsertInvitesInput) => {
  return insertInvites(invitesInput);
};

export const createFounderInviteThread = async ({
  invitedEmails,
  familyName,
  familyId,
  founderMemberId,
}: {
  invitedEmails: string;
  familyName: string;
  familyId: number;
  founderMemberId: number;
}) => {
  const plainTextMessage = `Next Steps\n\nCopy the invited members list to your clipboard and paste into the To field of a new email.\n\nInvited Family Members: ${ invitedEmails }`;

  return createThreadConversationWithInitialPost({
    title: 'Invited Family Members',
    subject: 'Your Invited Family Members',
    visibility: 'private' as const,
    recipientMemberIds: [founderMemberId],
    content: plainTextMessage,
    contentJson: JSON.stringify({
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 3 },
          content: [{ type: 'text', text: 'Next Steps' }],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'The members you have invited to your new family will receive a separate email from ' },
            { type: 'text', text: 'my-family-social', marks: [{ type: 'bold' }] },
            { type: 'text', text: ' with invitation links and details about the platform. Many times this email however, ends up in their spam or junk mail folders and not in their inbox. ' },
          ],
        },
        {
          type: 'paragraph',
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'The steps below are optional, but by sending them a personal email from your email you may be able to alert them to the email in their spam or junk mail folders.' }],
        },
        {
          type: 'paragraph',
        },
        {
          type: 'orderedList',
          attrs: { start: 1, type: null },
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    { type: 'text', text: 'Copy', marks: [{ type: 'bold' }] },
                    { type: 'text', text: ' (Ctl-C) the ' },
                    { type: 'text', text: 'Invited Family Members', marks: [{ type: 'bold' }] },
                    { type: 'text', text: ' (the text between 👉 and 👈) to your clipboard.' },
                  ],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    { type: 'text', text: 'Open', marks: [{ type: 'bold' }] },
                    { type: 'text', text: ' a new email in your email client (e.g. Gmail or Outlook)' },
                  ],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    { type: 'text', text: 'Paste', marks: [{ type: 'bold' }] },
                    { type: 'text', text: ' (Ctl-V) the invited members list into the ' },
                    { type: 'text', text: 'To:', marks: [{ type: 'bold' }] },
                    { type: 'text', text: ' field of the new email.' },
                  ],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    { type: 'text', text: 'Copy', marks: [{ type: 'bold' }] },
                    { type: 'text', text: ' all the text between 👉 and 👈 in the ' },
                    { type: 'text', text: 'Text To Copy', marks: [{ type: 'bold' }] },
                    { type: 'text', text: ' below (and paste into the body of your email. (Feel free to revise the text.)' },
                  ],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    { type: 'text', text: 'Send', marks: [{ type: 'bold' }] },
                    { type: 'text', text: ' the email.' },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 3 },
          content: [{ type: 'text', text: 'Invited Family Members' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '👉' + invitedEmails + '👈' }],
        },
        {
          type: 'paragraph',
        },
        {
          type: 'heading',
          attrs: { level: 3 },
          content: [{ type: 'text', text: 'Text To Copy' }],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: '👉Hello to all! I have created a trial account of ' },
            { type: 'text', text: 'My Family Social', marks: [{ type: 'bold' }] },
            { type: 'text', text: ' and invited all of you to join my new Family. That email has information about what My Family Social is, the cool features and things we can share there, like TV, Movies, Music reviews, Book and Poetry clubs, recipe, photos sharing, discussion groups, and much more. ' },
          ],
        },
        {
          type: 'paragraph',
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'The problem though is that invitation email is likely in your ' },
            { type: 'text', text: 'spam', marks: [{ type: 'underline' }] },
            { type: 'text', text: ' or ' },
            { type: 'text', text: 'junk', marks: [{ type: 'underline' }] },
            { type: 'text', text: ' mail folder. If you don\'t see it in your Inbox, then look for an email from ' },
            { type: 'text', text: 'my-family-social', marks: [{ type: 'bold' }] },
            { type: 'text', text: ' as the sender in spam or junk mail. If you find it there, mark it as ' },
            { type: 'text', text: 'not spam', marks: [{ type: 'underline' }] },
            { type: 'text', text: ' or ' },
            { type: 'text', text: 'junk', marks: [{ type: 'underline' }] },
            { type: 'text', text: ' mail. ' },
          ],
        },
        {
          type: 'paragraph',
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'At the bottom of the invitation email is a link to register in the ' },
            { type: 'text', text: familyName, marks: [{ type: 'bold' }] },
            { type: 'text', text: ' family. The registration will create credentials for you to login. When you register, you\'ll get another email with useful information on how to sign in to the ' },
            { type: 'text', text: familyName, marks: [{ type: 'bold' }] },
            { type: 'text', text: ' and new member ' },
            { type: 'text', text: 'next steps', marks: [{ type: 'bold' }] },
            { type: 'text', text: ' 👈' },
          ],
        },
        {
          type: 'paragraph',
        },
      ],
    }),
  }, {
    familyId,
    senderMemberId: founderMemberId,
    isFounder: true,
  });
};

export const sendEmails = async (
    familyInvites: Extract<InsertInvitesReturn, { success: true }>['invites'], 
    familyName: string, 
    founderDetails: FounderDetails ) => {
 
  if (familyInvites) {
    const sendResult = await sendFamilyInviteEmails(familyInvites, familyName, founderDetails);
    return sendResult;
  }
  else {    
    console.warn("sendEmails called with no family invites to send.");
    return {
      error: false,
      message: "No family invites to send."
    }
  }
};

export const isMemberEmailInUse = async (email: string): Promise<{ exists: boolean }> => {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    return { exists: false };
  }

  const memberResult = await getMemberDetailsByEmail(normalizedEmail);
  return { exists: memberResult.success };
};
