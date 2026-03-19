import { z } from 'zod';
import { passwordSchema } from '@/features/auth/components/validation/passwordSchema';
import { id } from 'date-fns/locale';

/*------------ CurrentMemberSchema definitions below -------------- */

const CurrentMemberSchema = z.object({
  id: z.number(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.email(),
  status: z.string(),
});

const CurrentMembersSchema = z.array(CurrentMemberSchema);

export const CurrentMembersFormSchema = z.object({
  currentFamilyMembers: CurrentMembersSchema,
});

/*------------ NewMemberSchema definitions below -------------- */

const NewMemberSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.email(),
});

const NewMembersSchema = z.array(NewMemberSchema);

export const NewMembersFormSchema = z.object({
  newfamilyMembers: NewMembersSchema,
});

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
  familyMembers: NewMembersSchema,
}).refine((data) => data.password === data.passwordConfirm, {
    message: "Passwords don't match",
    path: ["passwordConfirm"], 
  });

/*------------ MemberNotificationSchema definitions below -------------- */

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

/*------------ MemberRegistrationSchema definitions below -------------- */

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
