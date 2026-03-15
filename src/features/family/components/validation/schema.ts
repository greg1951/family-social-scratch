import { z } from 'zod';
import { passwordSchema } from '@/features/auth/components/validation/passwordSchema';

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

const MemberNotificationSchema = z.object({
  memberOptionId: z.number(),
  optionId: z.number(),
  optionName: z.string(),
  isSelected: z.boolean(),
});
const MemberNotificationsSchema = z.array(MemberNotificationSchema);

export const NotificationsFormSchema = z.object({
  notifications: MemberNotificationsSchema,
});

export const MemberRegistrationSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.email(),
  nickName: z.string().optional(),
  password: passwordSchema,
  passwordConfirm: z.string(),
}).refine((data) => data.password === data.passwordConfirm, {
    message: "Passwords don't match",
    path: ["passwordConfirm"],
  });
