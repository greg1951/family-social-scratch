import { auth } from "@/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import TwoFactorAuthForm from "./two-factor-auth-form";
import { getUser2fa } from "@/features/auth/components/db/queries-users";

export default async function MyAccount() {
  const session = await auth();

  const email = session?.user?.email as string;
  const result2fa = await getUser2fa(email);

  return (
    <Card className="w-[400] ">
      <CardHeader>
        <CardTitle className="text-center font-bold size-1.2">My Account</CardTitle>
      </CardHeader>
      <CardContent>
        <Label>
          Email Address
        </Label>
        <div className="text-muted-foreground">
          { session?.user?.email }
        </div>
        <TwoFactorAuthForm isActivated={ result2fa.isActivated ?? false } email={ email } />
      </CardContent>
    </Card>
  )
}