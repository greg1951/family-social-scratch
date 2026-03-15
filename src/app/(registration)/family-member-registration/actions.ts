'use server';

import { insertMember, insertUser } from "@/components/db/sql/queries-family-user";
import { InsertMemberInput, InsertMemberReturn, RegisterMemberInput } from "@/components/db/types/family-member";

export const addRegisteredMember = async(memberDetails:RegisterMemberInput) => {

  memberDetails.isFounder = false;
  const insertMemberResult = await insertMember(memberDetails);
  console.log("actions->addRegisteredMember->insertResult: ", insertMemberResult);
  if (!insertMemberResult.success) {
    console.log('Error occurred inserting the new family member');
    return insertMemberResult;
  }

  return insertMemberResult;
}

export const addMemberCreds = async(memberDetails:RegisterMemberInput, newMemberId: number) => {

  const insertUserResult = await insertUser({
    email: memberDetails.email,
    familyId: memberDetails.familyId,
    password: memberDetails.password,
    memberId: newMemberId,
  });
  if (!insertUserResult) {
    console.log('Error occurred inserting the new user');
    return insertUserResult;
  }

  return {
    success: true,
  }
}
