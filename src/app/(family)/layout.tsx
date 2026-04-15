import Image from "next/image";
import Link from "next/link";

import MainDropMenu from "@/components/common/main-dropmenu";
import BackButton from "@/components/common/back-button";
import { getMemberPageDetails } from "@/features/family/services/family-services";

export default async function TrialLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const memberKeyDetails = await getMemberPageDetails();

  return (
    <div className="font-app min-h-screen bg-[radial-gradient(circle_at_top,_#ffffff_0%,_#f5fbff_34%,_#dff6ff_100%)] text-[#10364a]">
      <div className="absolute inset-x-0 top-0 h-72 bg-[linear-gradient(180deg,rgba(89,205,247,0.28),rgba(255,255,255,0))]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-10 pt-4 sm:px-6 lg:px-8">
        <header className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/70 shadow-[0_20px_80px_-38px_rgba(16,54,74,0.45)] backdrop-blur">
          <div className="grid gap-3 px-4 py-3 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-start md:px-6 lg:px-8">

            <BackButton tw="border-[#d8eef7] bg-white/75 px-3 py-2 text-sm font-semibold text-[#10364a] transition hover:-translate-y-0.5 hover:bg-[#dff6ff]" />

            <div className="flex justify-center md:pt-1">
              <div className="w-full max-w-2xl rounded-[1.5rem] border border-white/65 bg-white/58 px-4 py-3 shadow-[0_18px_45px_-35px_rgba(16,54,74,0.65)] backdrop-blur">
                <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#2f7a95] md:text-xs">
                  Account Security Actions
                </p>
                <div className="mt-3 flex flex-col gap-2 md:flex-row">
                  {/* <BackButton /> */ }
                  <Link
                    href="/change-password"
                    prefetch={ false }
                    className="flex min-w-52 flex-1 items-center justify-between rounded-xl border border-[#d8eef7] bg-white/75 px-3 py-2 text-sm font-semibold text-[#10364a] transition hover:-translate-y-0.5 hover:bg-[#dff6ff]"
                  >
                    <span className="flex items-center gap-2">
                      <Image src="/icons/change-password.png" alt="Change password" width={ 16 } height={ 16 } className="h-4 w-4" />
                      Change Password
                    </span>
                    {/* <span className="text-[#2f7a95]">Go</span> */ }
                  </Link>
                  <Link
                    href="/two-factor-auth-form"
                    prefetch={ false }
                    className="flex min-w-52 flex-1 items-center justify-between rounded-xl border border-[#d8eef7] bg-white/75 px-3 py-2 text-sm font-semibold text-[#10364a] transition hover:-translate-y-0.5 hover:bg-[#dff6ff]"
                  >
                    <span className="flex items-center gap-2">
                      <Image src="/icons/mfa.png" alt="Update two-factor authentication" width={ 16 } height={ 16 } className="h-4 w-4" />
                      Update 2FA
                    </span>
                    {/* <span className="text-[#2f7a95]">Go</span> */ }
                  </Link>
                </div>
              </div>
            </div>

            {/* <div className="relative min-h-36 overflow-hidden rounded-[1.75rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(255,255,255,0.58))] px-3 py-3 shadow-inner md:min-h-40 md:px-4 lg:min-h-44">
              <div className="pointer-events-none absolute inset-x-8 top-4 h-20 rounded-full bg-[radial-gradient(circle,rgba(255,222,170,0.7)_0%,rgba(255,255,255,0)_72%)] blur-2xl" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-[linear-gradient(180deg,rgba(255,255,255,0),rgba(255,255,255,0.2))]" />
            </div> */}

            <div className="flex items-start justify-end md:pt-1 md:self-start">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/60 bg-white/75 text-[#005472] shadow-[0_10px_40px_-18px_rgba(0,84,114,0.65)] backdrop-blur">
                <MainDropMenu
                  firstName={ memberKeyDetails.firstName }
                  email={ memberKeyDetails.email }
                  sessionFound={ memberKeyDetails.isLoggedIn }
                  isFounder={ memberKeyDetails.isFounder }
                />
              </div>
            </div>
          </div>
        </header>

        <main className="flex flex-1 items-start justify-center px-1 py-6 md:px-0 md:py-8">
          { children }
        </main>
      </div>
    </div>
  )
}