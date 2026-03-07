'use client'

import Link from 'next/link'
import { CircleArrowLeft, CircleCheckBig } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const founderSummary = {
  firstName: 'Family',
  lastName: 'Founder',
  nickName: 'Optional',
  email: 'founder@example.com',
}

const familyName = 'MyFamilyName'

const invitedMembers = [
  { id: '1', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' },
  { id: '2', firstName: 'Robert', lastName: 'Smith', email: 'robert@example.com' },
]

export default function TrialInviteFamilyConfirmationPage() {
  return (
    <div className="font-app py-2 px-4 sm:px-6 md:px-8">
      <div className="max-w-2xl mx-auto">
        <Card className="flex align-top w-[400] md:w-[800]">
          <CardHeader className="text-base md:text-2xl bg-[#59cdf7] rounded-2xl text-center p-2">
            <CardTitle className="text-2xl md:text-3xl inline">Step 4: Confirm Family Setup</CardTitle>
            <CardDescription className="text-neutral-800 text-sm px-4">
              Review the first three setup steps before creating your new Family Social site.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-5">
            <div className="rounded-md border p-4">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-[#005472] text-white text-xs font-bold">1</div>
                <p className="text-sm font-semibold text-neutral-800">Step 1: Family Founder</p>
              </div>

              <div className="grid grid-cols-1 gap-2 md:grid-cols-2 text-sm">
                <p><span className="font-semibold">First Name:</span> { founderSummary.firstName }</p>
                <p><span className="font-semibold">Last Name:</span> { founderSummary.lastName }</p>
                <p><span className="font-semibold">Nickname:</span> { founderSummary.nickName }</p>
                <p><span className="font-semibold">Email:</span> { founderSummary.email }</p>
              </div>
            </div>

            <div className="rounded-md border p-4">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-[#005472] text-white text-xs font-bold">2</div>
                <p className="text-sm font-semibold text-neutral-800">Step 2: Family Name</p>
              </div>

              <p className="text-sm"><span className="font-semibold">Selected Family Name:</span> { familyName }</p>
            </div>

            <div className="rounded-md border p-4">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-[#005472] text-white text-xs font-bold">3</div>
                <p className="text-sm font-semibold text-neutral-800">Step 3: Invited Family Members ({ invitedMembers.length })</p>
              </div>

              { invitedMembers.length === 0 ? (
                <p className="text-sm text-neutral-500">No members invited yet.</p>
              ) : (
                <ul className="space-y-2">
                  { invitedMembers.map((member) => (
                    <li key={ member.id } className="rounded-md border bg-neutral-50 px-3 py-2">
                      <p className="text-sm font-medium text-neutral-900">{ member.firstName } { member.lastName }</p>
                      <p className="text-xs text-neutral-600">{ member.email }</p>
                    </li>
                  )) }
                </ul>
              ) }
            </div>

            <div className="rounded-md border border-[#59cdf7] bg-[#e8f8ff] p-4">
              <div className="mb-2 flex items-center gap-2">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-[#59cdf7] text-black text-xs font-bold">4</div>
                <p className="text-sm font-semibold text-neutral-900">Step 4: Final Confirmation</p>
              </div>

              <p className="text-sm text-neutral-800">
                Confirm these details to create your new Family Social site and send family invitations.
              </p>
            </div>

            <div className="flex justify-center p-2 gap-2">
              <Link href="/trial-setup/trial-setup-steps">
                <Button variant="outline" className="md:w-auto bg-[#59cdf7] hover:bg-[#9de4fe]">
                  <CircleArrowLeft className="mr-1 h-4 w-4" />
                  Back
                </Button>
              </Link>

              <Button className="md:w-auto bg-[#59cdf7] hover:bg-[#9de4fe] text-black font-semibold">
                Confirm and Create Family Site
                <CircleCheckBig className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
