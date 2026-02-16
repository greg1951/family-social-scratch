'use server';

import { auth } from "@/auth";
import { getFullUserCredsByEmail } from "../components/db/queries-users";
import { hashPasswordWithSalt } from "./hash";
import { generate } from "otplib";


export async function getSessionEmail() {
  const session = await auth();
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
export const authValidation = async ({email, password, token}:{email: string; password: string; token?: string}) => {
  const user = await getFullUserCredsByEmail(email as string);

  if (!user) {
    throw new Error("Incorrect credentials");
  }
  else {
    const hashedInputPassword = hashPasswordWithSalt(password as string, user.salt);
    const passwordCorrect = user.password === hashedInputPassword? true : false;
    if (!passwordCorrect) {
      // throw new Error("Invalid credentials");
      return {
        error: true,
        message: "Invalid credentials"
      }
    };
  
    if (user.isActivated && token) {
      const secret = user.secret ?? "";
      const generatedToken = await generate({secret});
    
      // console.log('authValidation->token: ', token, ' generatedToken:', generatedToken);
      if (token !== generatedToken && token) {
        return {
          error: true,
          message: "Invalid one-time passcode"
        }
      }
    };  
  };
  /* returning "id" of type string is expected to get a JWT token */
  return {
    id: user.id.toString(),
    email: user.email,
    isActive: user.isActivated,
    secret: user.secret 
  };
};

type PreLoginReturnType = {
  error: boolean;
  message?: string;
  isActive?: boolean;
};

export const preLoginAuthValidation = async ({
  email, 
  password}
  :{
    email: string; 
    password: string;}
  )
  :(Promise<PreLoginReturnType>) => {

    const user = await getFullUserCredsByEmail(email as string);

    if (!user) {
      throw new Error("Incorrect credentials");
    }
    else {
      const hashedInputPassword = hashPasswordWithSalt(password as string, user.salt);
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

