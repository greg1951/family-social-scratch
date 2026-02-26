'use server';

import { auth } from "@/auth";
import { getFullUserCredsByEmail } from "@/components/db/sql/queries-user";
import { hashPasswordWithSalt } from "./hash";
import { generate } from "otplib";


export async function getSessionEmail() {
  const session = await auth();
  console.log("auth-utils->getSessionEmail->session: ", session);
  if (!session) {
    return {
      found: false,
      userEmail: ''
    } 
  }
  const userEmail = session.user?.email;
  return {
    found: true,
    userEmail: userEmail
  }
}

/* Common function below is used in auth.ts as well as the login  */
export const authValidation = async ({email, password, family, token}
  :{email: string; password: string; family:string; token?: string})
  :Promise<{
    id?: string;
    email?: string;
    family?: string;
    error?: boolean;
    message?: string;
    }> => {

    const selectedUser = await getFullUserCredsByEmail(email as string, family as string);

    if (!selectedUser) {
      throw new Error("Incorrect credentials");
    }
    else {
      const hashedInputPassword = hashPasswordWithSalt(password as string, selectedUser.salt as string);
      // console.log("auth-utils->authValidation->db password: ",selectedUser.password, ", hashed input: ",hashedInputPassword);
      const passwordCorrect = selectedUser.password === hashedInputPassword? true : false;
      if (!passwordCorrect) {
        // throw new Error("Invalid credentials");
        return {
          error: true,
          message: "Invalid credentials"
        }
      };
    
      if (selectedUser.isActivated && token) {
        const secret = selectedUser.secret ?? "";
        const generatedToken = await generate({secret});
      
        // console.log('authValidation->token: ', token, ' generatedToken:', generatedToken);
        if (token !== generatedToken && token) {
          return {
            error: true,
            message: "Invalid one-time passcode"
          }
        }
      };  
      /* returning "id" of type string is expected to get a JWT token */
      const validatedUser = {
        id: selectedUser.id?.toString(),
        email: selectedUser.email,
        family: family,
        // isActive: selectedUser.isActivated,
        // secret: selectedUser.secret 
      };
      // console.log("auth-utils->authValidation->validatedUser: ", validatedUser);
      return validatedUser;
    };
};

type PreLoginReturnType = {
  error: boolean;
  message?: string;
  isActive?: boolean;
};

export const preLoginAuthValidation = async ({
  email, 
  password,
  family
}:{
    email: string; 
    password: string;
    family: string;
  })
  :(Promise<PreLoginReturnType>) => {

    const user = await getFullUserCredsByEmail(email as string, family);
    // console.log("auth-utils->getFullUserCredsByEmail->user: ",user);
    if (!user.success) {
      // throw new Error("Incorrect credentials");
       return {
          error: true,
          message: user.message
        }
    }
    else {
      const hashedInputPassword = hashPasswordWithSalt(password as string, user.salt as string);
      // console.log("auth-utils->getFullUserCredsByEmail->hashedInputPassword: ",hashedInputPassword, ", user.password: ", user.password);
      const passwordCorrect = user.password === hashedInputPassword? true : false;
      if (!passwordCorrect) {
        // throw new Error("Invalid credentials");
        return {
          error: true,
          message: "Invalid credentials"
        }
      };
    
    };
    /* returning "id" of type string is expected to get a JWT token */
    return {
      error: false,
      isActive: user.isActivated
    };
};

