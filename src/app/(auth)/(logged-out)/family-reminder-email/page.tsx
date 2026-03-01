import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import SendFamilyEmailForm from "./";

export default function ResetPassword() {
  return (
    <div className="flex justify-center">
      <main className="font-app h-[80vh]">
        <Card className="flex align-middle w-[300] md:w-[500]">
          <CardHeader className="text-base md:text-2xl bg-[#59cdf7] rounded-2xl text-center gap-y-0 p-2">
            <CardTitle className="text-center font-bold size-1.2 pt-0">Send Family Name Email</CardTitle>
          </CardHeader>
          <CardDescription className="text-xs text-center">
            When you submit this request, you will receive an email from Family Social containing a Family name-if you had previously joined a family in Family Social.
          </CardDescription>
          <CardContent>
            <SendFamilyEmailForm />
          </CardContent>
        </Card>
      </main>
    </div >
  )
}