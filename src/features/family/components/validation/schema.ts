import { z } from 'zod';
import { passwordMatchSchema } from '@/features/auth/components/validation/passwordMatchSchema';
import { passwordSchema } from '@/features/auth/components/validation/passwordSchema';
import { FamilyMember } from '@/app/(family)/family-setup/family-setup-dialogs/invite-family-dialog';
import { family } from '@/components/db/schema/family-social-schema-tables';

const FamilyMemberSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.email(),
});

const FamilyMembersSchema = z.array(FamilyMemberSchema);

export const FamilyFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.email('Invalid email address'),
  nickName: z.string().optional(),
  password: passwordSchema,
  passwordConfirm: z.string(),
  familyName: z
    .string()
    .min(10, 'Must be at least 10 characters')
    .max(30, 'Must be less than 30 characters'),
  familyMembers: FamilyMembersSchema,
}).refine((data) => data.password === data.passwordConfirm, {
    message: "Passwords don't match",
    path: ["passwordConfirm"], 
  });

export const AddMembersFormSchema = z.object({
  familyMembers: FamilyMembersSchema,
});
