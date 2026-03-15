  export const familySteps = [
    {
      number: 1,
      title: 'Register the Family Founder',
      description: 'Register yourself as the family founder by providing your information and login credentials.',
      fields: ['firstName', 'lastName', 'email', 'nickName', 'password', 'passwordConfirm'],
    },
    {
      number: 2,
      title: 'Assign a Family Name',
      description: 'Family information is kept secure and is identified by a unique family name of your choosing.',
      fields: ['familyName'],
    },
    {
      number: 3,
      title: 'Invite Family Members',
      description: 'Share your family social site with family and friends by adding them to your family network.',
      fields: ['familyEmails[]'],
    },
    {
      number: 4,
      title: 'Create Your Family Site',
      description: 'Begin sharing updates, photos, and memories with your family members securely.',
    },
  ];

  import { SubmissionStep } from "../types/family-steps";
  
  export const initialSubmissionSteps: SubmissionStep[] = [
      { id: 1, label: 'Add new family name', status: 'pending' },
      { id: 2, label: 'Create Founder entry', status: 'pending' },
      { id: 3, label: 'Add Founder credentials', status: 'pending' },
      { id: 4, label: 'Add invited family members', status: 'pending' },
      { id: 5, label: 'Send emails to the new Family Social family', status: 'pending' },
  ];
  export const initialRegistrationSteps: SubmissionStep[] = [
        { id: 1, label: 'Register member details', status: 'pending' },
        { id: 2, label: 'Create member login credentials', status: 'pending' },
        { id: 3, label: 'Adding member notifications', status: 'pending' },
        { id: 4, label: 'Update member invitation status', status: 'pending' },
  ];
  
  // Define constants for step indices for better readability
  export const STEP_1_FOUNDER: number = 0; // Founder info
  export const STEP_2_FAMILY_NAME: number = 1; // Family Name
  export const STEP_3_INVITE_MEMBERS: number = 2; // Invite family members
  export const STEP_4_CREATE_FAMILY_SITE: number = 3; // Create family site
  
  // Family name RegEx: only letters, no spaces, numbers, or special characters allowed.
  export const noSpacesOrSpecialCharsRegex = /^[a-zA-Z]+$/;

  export const familySocialEmail="family.social@updates.knotboardgames.com";

  export const familySocialHostReference = "https://kbgfamilysocial.com";
  
