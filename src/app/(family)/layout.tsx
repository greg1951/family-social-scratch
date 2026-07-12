import Link from "next/link";
import { ImagePlus, KeyRound, ShieldCheck } from "lucide-react";

import BackButton from "@/components/common/back-button";
import MemberAvatar from "@/components/common/member-avatar";
import SyncStatusConsole from "@/components/pwa/sync-status-console";
import { getCurrentMemberAvatarDetails } from "@/features/family/services/member-avatar-details";

export default async function TrialLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const memberAvatarDetails = await getCurrentMemberAvatarDetails();
  const accountHeading = !memberAvatarDetails.isLoggedIn
    ? "Account Settings"
    : memberAvatarDetails.isFounder
      ? "Family Account Settings"
      : "Member Settings";

  return (
    <div className="font-app min-h-screen bg-[radial-gradient(circle_at_top,#ffffff_0%,#f5fbff_34%,#dff6ff_100%)] text-[#10364a]">
      <div className="absolute inset-x-0 top-0 h-72 bg-[linear-gradient(180deg,rgba(89,205,247,0.28),rgba(255,255,255,0))]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-10 pt-4 sm:px-6 lg:px-8">
        <header className="rounded-[1.35rem] border border-white/70 bg-white/82 p-4 shadow-[0_28px_90px_-50px_rgba(16,54,74,0.75)] backdrop-blur md:p-6">
          <div className="mt-4 rounded-[1.35rem] bg-[linear-gradient(135deg,#59cdf7_0%,#9de4fe_45%,#fff2d8_100%)] px-4 py-4 shadow-[inset_0_-1px_0_rgba(255,255,255,0.45)] md:px-6 md:py-5">
            {/* <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#2f7a95] md:text-xs">
              Account Settings
            </p> */}
            <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
              <h3 className="mt-2 text-1xl font-extrabold tracking-[0.02em] text-[#10364a] md:text-[2rem]">
                { accountHeading }
              </h3>
              { memberAvatarDetails.isLoggedIn ? (
                <div className="flex justify-end" >
                  <MemberAvatar
                    imageUrl={ memberAvatarDetails.memberImageUrl }
                    firstName={ memberAvatarDetails.firstName }
                    lastName={ memberAvatarDetails.lastName }
                    sizeClassName="h-16 w-16 sm:h-20 sm:w-20"
                  />
                </div>
              ) : null}
            </div>            
            {/* <p className="mt-1 text-sm leading-6 text-[#315363]">
              Manage profile security and account settings.
            </p> */}

            <div className="flex flex-wrap items-start justify-between gap-3">
            </div>
            <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-5">
              <BackButton tw="border-[#d8eef7] bg-white/75 px-3 py-2 text-sm font-semibold text-[#10364a] transition hover:-translate-y-0.5 hover:bg-[#dff6ff]" />
              <Link
                href="/change-password"
                prefetch={ false }
                className="flex items-center gap-2 rounded-xl border border-[#d8eef7] bg-white/75 px-3 py-2 text-sm font-semibold text-[#10364a] transition hover:-translate-y-0.5 hover:bg-[#dff6ff]"
              >
                <KeyRound className="h-4 w-4 text-[#005472]" />
                Change Password
              </Link>
              <Link
                href="/two-factor-auth-form"
                prefetch={ false }
                className="flex items-center gap-2 rounded-xl border border-[#d8eef7] bg-white/75 px-3 py-2 text-sm font-semibold text-[#10364a] transition hover:-translate-y-0.5 hover:bg-[#dff6ff]"
              >
                <ShieldCheck className="h-4 w-4 text-[#005472]" />
                Update 2FA
              </Link>
              <Link
                href="/family-image-upload"
                prefetch={ false }
                className="flex items-center gap-2 rounded-xl border border-[#d8eef7] bg-white/75 px-3 py-2 text-sm font-semibold text-[#10364a] transition hover:-translate-y-0.5 hover:bg-[#dff6ff]"
              >
                <ImagePlus className="h-4 w-4 text-[#005472]" />
                Upload Avatar
              </Link>
            </div>
          </div>
        </header>

        <div className="px-1 pt-4">
          <SyncStatusConsole />
        </div>

        <main className="flex flex-1 items-start justify-center px-1 py-6 md:px-0 md:py-8">
          { children }
        </main>
      </div>
    </div>
  )
}