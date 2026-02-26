'use server';

import { passwordMatchSchema } from "@/features/auth/components/validation/passwordMatchSchema";
import { familySchema } from "@/features/auth/components/validation/familySchema";
import z from "zod";
import { insertRegisteredUser, isUserRegistered } from "@/components/db/sql/queries-user";
import { findRegisteredFamily, findFamilyMember } from "@/components/db/sql/queries-family-member";

export const registerUser = async({
  email, 
  family,
  password, 
  passwordConfirm}: {
    email: string,
    family: string,
    password: string, 
    passwordConfirm: string
    }
  ) => {
    try {
    const newUserSchema = z.object({
      email: z.email(),
      family: familySchema,
    }).and(passwordMatchSchema);
    
    const newUserValidation = newUserSchema.safeParse({email, password, passwordConfirm, family});
    if (!newUserValidation.success) {
      return {
        error: true,
        message: newUserValidation.error.issues[0]?.message ?? "An error occurred",
      };
    };

    const findFamilyResult = await findRegisteredFamily(family);
    if (!findFamilyResult.success) {
      return {
        error: true,
        message: 'Family name is not registered in Family Social'
      }
    }

    const findMemberResult = await findFamilyMember(findFamilyResult.familyId as number, email);

    if (findMemberResult.error) {
      return {
        error: true,
        message: 'Family member email not found'
      }
    }

    const insertResult = await insertRegisteredUser(email, password, findFamilyResult.familyId as number);
    if (!insertResult) {
      return {
        error: true,
        message: "Registered user insert failed"
      }
    }
    
    } catch (e: unknown) {
      if (e instanceof Error) {
        return {
          error: true,
          message: "An accound is already registered with that email"
        };
      }
      return {
        error: true,
        message: "An unknown error occured."
      }
    }    
  };