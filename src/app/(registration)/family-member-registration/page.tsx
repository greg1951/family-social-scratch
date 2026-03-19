import { getInviteToken } from "@/components/db/sql/queries-family-invite";
import { GetInviteTokenReturn } from "@/components/db/types/family-member";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

import Link from "next/link";
import FamilyMemberRegistrationForm from ".";
import { CircleX, CircleCheck } from "lucide-react";

export default async function FamilyMemberRegistration({ searchParams }
  : {
    searchParams: Promise<{
      token?: string;
    }>
  }) {
  // Let the logic begin...
  const { token } = await searchParams;
  if (!token) {
    console.warn('FamilyMemberRegistration->No token provided in search params');
    return (
      <div className="flex justify-center">
        <main className="font-app">
          <Card className="flex align-middle w-[400] md:w-[900] pt-0 h-[85vh]">
            <CardHeader className="text-base md:text-2xl bg-[#59cdf7] rounded-2xl text-center gap-y-0 p-2">
              <CardTitle className="text-center font-bold size-1.2 pt-0">Family Member Registration</CardTitle>
              <div className="text-center text-xs font-light text-slate-800 pt-2">
                No token provided in search params.
              </div>
            </CardHeader>
          </Card>
        </main>
      </div>
    );
  }

  let inviteRelated: Extract<GetInviteTokenReturn, { error: false }>['inviteRelated'];
  const getTokenResult = await getInviteToken(token);
  if (getTokenResult.error) {
    console.error('Error occurred retrieving the invitation token');
    return (
      <div className="flex justify-center">
        <main className="font-app">
          <Card className="flex align-middle w-[400] md:w-[900] pt-0 h-[85vh]">
            <CardHeader className="text-base md:text-2xl bg-[#59cdf7] rounded-2xl text-center gap-y-0 p-2">
              <CardTitle className="text-center font-bold size-1.2 pt-0">Family Member Registration</CardTitle>
              <div className="text-center text-xs font-light text-slate-800 pt-2">
                Error occurred retrieving the invitation token.
              </div>
            </CardHeader>
          </Card>
        </main>
      </div>
    );
  }
  else {
    inviteRelated = getTokenResult.inviteRelated;
  }
  // console.log('FamilyMemberRegistration->getInviteToken->inviteRelated.isValidExpiry: ', inviteRelated?.isValidExpiry);
  return (
    <div className="flex justify-center">
      <main className="font-app">
        <Card className="flex align-middle w-[400] md:w-[900] pt-0 h-[85vh]">
          <CardHeader className="text-base md:text-2xl bg-[#59cdf7] rounded-2xl text-center gap-y-0 p-2">
            <CardTitle className="text-center font-bold size-1.2 pt-0">Family Member Registration</CardTitle>
            { inviteRelated?.isValidExpiry && (
              <div className="text-center text-xs font-light text-slate-800 pt-2">
                Registering <b>{ inviteRelated.email }</b> in the <b>{ inviteRelated.familyName }</b> family
              </div>
            ) }
          </CardHeader>
          { !inviteRelated?.isValidExpiry && (
            <CardDescription className="text-left text-xs text-bold p-2">
              <p className="text-red-700">
                Something went wrong. There are a number of possibilities. <br></br><br></br>
                <CircleX className="inline mr-2 text-red-900" size={ 20 } />
                Your invitation token may simply have expired, which means you should ask your family founder to send you another invitation.<br></br><br></br>
                <CircleX className="inline mr-2 text-red-900" size={ 20 } />
                Or, you may already have registered, which invalidates the token. If you bookmarked the page with the token in the URL then it brought you back here.<br></br><br></br>
              </p>
              <div className="text-muted-foreground text-xs">
                <p className="text-green-900 pb-2">
                  <CircleCheck className="inline mr-2 text-green-900" size={ 20 } />
                  Select the link below to navigate to the Family Social home and then bookmark that page.
                </p>
                {/* Take Me Home!{ "   " } */ }
                <Link className="underline"
                  href="/" >
                  Family Social Home Page
                </Link>
              </div>

            </CardDescription>
          ) }
          { !inviteRelated?.isValidExpiry && (
            <CardFooter className="flex-col gap-2">
            </CardFooter>
          ) }
          { inviteRelated?.isValidExpiry && (
            <CardDescription className="text-center text-xs text-bold text-slate-800 p-4">
              When you submit your registration you'll be forwarded to resources to help you get started with your family.
            </CardDescription>
          ) }
          <CardContent>
            { inviteRelated?.isValidExpiry && (
              <FamilyMemberRegistrationForm inviteRelatedInput={ inviteRelated } />
            ) }

          </CardContent>
        </Card>
      </main>
    </div>
  );
}