  export const trialSteps = [
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
