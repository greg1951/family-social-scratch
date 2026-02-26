'use server';

import { passwordMatchSchema } from "@/features/auth/components/validation/passwordMatchSchema";
import z from "zod";
import { updateUserPassword, getUserByEmail } from "@/components/db/sql/queries-user";
import { passwordSchema } from "@/features/auth/components/validation/passwordSchema";
import { hashPasswordWithSalt } from "@/features/auth/services/hash";

export const changeUserPassword = async({
  email,
  currentPassword,
  password, 
  passwordConfirm}: {
    email: string, 
    currentPassword: string,
    password: string, 
    passwordConfirm: string
    }
  ) => {  

    try {
      // console.info('changeUserPassword->starting->email: ', email, ' currentPassword: ', currentPassword, 'password: ', password, 'passwordConfirm: ', passwordConfirm);
      const formSchema = z.object({
        currentPassword: passwordSchema
      }).and(passwordMatchSchema);
      
      const passwordValidation = formSchema.safeParse({currentPassword, password, passwordConfirm});
      if (!passwordValidation.success) {
        return {
          error: true,
          message: passwordValidation.error.issues[0]?.message ?? "An error occurred",
        };
      };

      /* The returnType below will return the current password and salt*/
      // console.info('changeUserPassword->starting getUserByEmail...');
      const returnType = await getUserByEmail(email);
      // console.info('changeUserPassword->getUserByEmail->returnType.success?', returnType.success);
      if (!returnType.success) {
        return {
          error: true,
          message: 'Unable to find user account'
        }
      }

      // console.log('changeUserPassword->currentPassword: ', currentPassword);
      const hashedPassword = hashPasswordWithSalt(currentPassword, returnType.salt as string);
      // console.log('changeUserPassword->hashedPassword: ', hashedPassword, ' returnType.password: ', returnType.password);
      if (hashedPassword !== returnType.password) {
        return {
          error: true,
          message: 'Current password is incorrect, guess again!'
        }
      }
      
      /* The async function will take care of hashing the new password (and new salt) */
      const updatedUser = await updateUserPassword(email, password);
      return {
        error:false,
        message: 'Password changed'
      };
    
    } catch (e: unknown) {
      if (e instanceof Error) {
        return {
          error: true,
          message: "An account is already registered with that email"
        };
      }
      return {
        error: true,
        message: "An unknown error occured."
      }
    }    
  };