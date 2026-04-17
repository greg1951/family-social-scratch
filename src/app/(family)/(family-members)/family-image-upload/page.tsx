import { redirect } from "next/navigation";
import { Camera, Sparkles } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import S3Manager from "@/components/s3/S3Manager";
import { getMemberPageDetails } from "@/features/family/services/family-services";
import { getMemberImageUploadDetails } from "./actions";

export default async function FamilyImageUploadPage() {
  const memberKeyDetails = await getMemberPageDetails();
  if (!memberKeyDetails.isLoggedIn) {
    redirect("/");
  }

  const uploadDetails = await getMemberImageUploadDetails();
  if (!uploadDetails.success) {
    return (
      <main className="font-app min-h-[80vh] w-full px-4 py-4 sm:px-6">
        <Card className="mx-auto max-w-3xl border-red-100 bg-white/90">
          <CardHeader>
            <CardTitle className="text-red-700">Member image upload is unavailable</CardTitle>
            <CardDescription>Your Mugshot has been uploaded 😁</CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  return (
    <main className="font-app min-h-[80vh] w-full px-4 py-2 sm:px-6 md:px-8">
      <Card className="mx-auto w-full max-w-3xl overflow-hidden border-white/70 bg-white/82 pt-0 shadow-[0_28px_90px_-50px_rgba(16,54,74,0.75)] backdrop-blur">
        <CardHeader className="rounded-[1.35rem] bg-[linear-gradient(135deg,#59cdf7_0%,#9de4fe_45%,#fff2d8_100%)] px-6 pb-5 pt-5 text-center shadow-[inset_0_-1px_0_rgba(255,255,255,0.45)]">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/65 bg-white/55 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-[#005472] shadow-sm backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            Member Profile
          </div>
          <CardTitle className="mt-3 text-center text-2xl font-extrabold tracking-[0.02em] text-[#10364a] md:text-[2rem]">
            Upload Profile Image
          </CardTitle>
          <CardDescription className="mx-auto mt-2 max-w-2xl text-center text-sm leading-6 text-[#315363]">
            Upload a PNG or JPEG up to 50 KB. File name format is generated as <b>memberId-{ uploadDetails.memberId }</b> with extension.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          <div className="mb-5 flex items-center justify-center gap-2 text-sm text-[#315363]">
            <Camera className="h-4 w-4 text-[#005472]" />
            <span>
              Member: <b>{ uploadDetails.firstName } { uploadDetails.lastName }</b>
            </span>
          </div>

          <S3Manager
            memberId={ uploadDetails.memberId as number }
            initialMemberImageUrl={ uploadDetails.memberImageUrl ?? null }
          />
        </CardContent>
      </Card>
    </main>
  );
}
