'use server';

import { passwordMatchSchema } from "@/features/auth/components/validation/passwordMatchSchema";
import z from "zod";
import { updateUserPassword, getUserByEmail } from "@/components/db/sql/queries-user";
import { passwordSchema } from "@/features/auth/components/validation/passwordSchema";
import { auth } from "@/auth";
import { removePasswordToken } from "@/components/db/sql/queries-passwordReset";

/* Also include the token in the arguments below as it will be used to remove the token after password change */
export const updateResetPassword = async({
  email,
  password, 
  passwordConfirm}: {
    email: string, 
    password: string, 
    passwordConfirm: string
    }
  ) => { 
    
    const session = await auth();
    if (session?.user?.id) {
      return {
        error: true,
        message: "Already logged in. Please logout to reset your password."        
      }
    }

    try {
      console.info('updateResetPassword->starting->email: ', 
        email, 'password: ', 
        password, 'passwordConfirm: ', 
        passwordConfirm);

      const formSchema = z.object({
        password: passwordSchema
      }).and(passwordMatchSchema);
      
      const passwordValidation = formSchema.safeParse({password, passwordConfirm});
      if (!passwordValidation.success) {
        return {
          error: true,
          message: passwordValidation.error.issues[0]?.message ?? "An error occurred",
        };
      };

      /* The returnType below will return the current password and salt*/
      const getReturn = await getUserByEmail(email);
      // console.info('updateResetPassword->getUserByEmail->returnType.success?', getReturn.success);
      if (!getReturn.success) {
        return {
          error: true,
          message: 'Issue finding account'
        }
      }
      
      /* The async function will take care of hashing the new password (and new salt) */
      const updateReturn = await updateUserPassword(email, password);
      if (updateReturn.error) {
        return updateReturn;
      }

      /* Remove the user's password reset token  so they can repeat this update */
      const removeReturn = await removePasswordToken(getReturn.id as number)
      if (removeReturn.error) {
        return removeReturn;
      }

      return {
        error:false,
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