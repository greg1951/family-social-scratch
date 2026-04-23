'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { MessageCircleX, MailCheck, Undo2, CircleCheck, Users } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { CurrentFamilyMember } from '@/features/family/types/family-members'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import MemberListIdentity from '@/components/common/member-list-identity'

const currentMemberSchema = z.object({
  id: z.number(),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.email('Please enter a valid email address'),
  invitationStatus: z.enum(['pending', 'joined', 'revoked', 'resend', 'suggested']),
})

type UpdateMemberValues = z.infer<typeof currentMemberSchema>

type CurrentMembersDialogProps = {
  members: CurrentFamilyMember[]
  onResendMember: (id: number) => void
  onRemoveMember: (id: number) => void
  onResetMember: (id: number) => void
  onInviteMember: (id: number) => void
}

export function CurrentMembersDialog({ members, onResendMember, onRemoveMember, onResetMember, onInviteMember }: CurrentMembersDialogProps) {
  const [infoOpen, setInfoOpen] = useState(false)

  const form = useForm<UpdateMemberValues>({
    resolver: zodResolver(currentMemberSchema),
    defaultValues: {
      id: 0,
      firstName: '',
      lastName: '',
      email: '',
      invitationStatus: 'pending',
    },
  })

  const onSubmit = (values: UpdateMemberValues) => {
    // console.log('Form submitted with values:', values);
    form.reset(values)
  }

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.stopPropagation()
    form.handleSubmit(onSubmit)(e)
  }

  const getStatusClasses = (status: string) => {
    const normalized = status.toLowerCase()
    if (normalized === 'active' || normalized === 'joined') {
      return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    }
    if (normalized === 'pending') {
      return 'bg-amber-100 text-amber-700 border-amber-200'
    }
    if (normalized === 'suggested') {
      return 'bg-sky-100 text-sky-700 border-sky-200'
    }
    return 'bg-slate-100 text-slate-700 border-slate-200'
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="bg-[#59cdf7] hover:bg-[#9de4fe] text-black font-semibold">
          <Users className="mr-2 h-4 w-4 text-[#1bb6ef] text-center" />
          Open Members Dialog
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl font-app text-xs">
        <DialogHeader>
          <DialogTitle>Update Family Members</DialogTitle>
          <DialogDescription className="text-xs">
            Select an action on a member. When done, close the dialog and click the &quot;Update Marked Changes&quot;
            button to apply your changes.
          </DialogDescription>
        </DialogHeader>

        <div className="font-app rounded-md border p-4">
          <HoverCard open={ infoOpen } openDelay={ 300 } closeDelay={ 150 }>
            <HoverCardTrigger asChild>
              <Button
                className='w-auto text-xs md:text-sm'
                variant="link"
                onMouseEnter={ () => setInfoOpen(true) }
                onMouseLeave={ () => setInfoOpen(false) }
              >
                Current Members ({ members.length })
              </Button>
            </HoverCardTrigger>
            <HoverCardContent side='top' className="flex w-50 md:w-120 flex-col gap-0.5">
              <div className="flex items-center gap-1" >
                <MailCheck size={ 6 } className="h-10 w-10 text-green-500" />
                <p className='text-sm p-1'>Status set to RESEND that resends the invitation email to the member</p>
              </div>
              <div className="flex items-center gap-1" >
                <MessageCircleX className="h-10 w-10 text-red-500" />
                <p className='text-sm p-1'>Status set to REMOVE that revokes the invitation email to the member</p>
              </div>
              <div className="flex items-center gap-1" >
                <CircleCheck className="h-10 w-10 text-purple-500" />
                <p className='text-sm p-1'>Status set to INVITE that sends an invitation to a <i>suggested</i> member</p>
              </div>
              <div className="flex items-center gap-1" >
                <Undo2 className="h-10 w-10 text-yellow-500" />
                <p className='text-sm p-1'>Status set to RESET that reverts back to the original status</p>
              </div>
            </HoverCardContent>
          </HoverCard>

          { members.length === 0 ? (
            <p className="text-sm text-neutral-500">No family members? Get crackin&apos;</p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-1 md:grid-cols-2">
              { members.map((member) => (
                <li
                  key={ member.id }
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <MemberListIdentity
                      firstName={ member.firstName }
                      lastName={ member.lastName }
                      email={ member.email }
                      memberImageUrl={ member.memberImageUrl }
                    />

                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className={ `rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${ getStatusClasses(member.status) }` }>
                        { member.status }
                      </span>
                      <div className="flex justify-end gap-1">
                        { (member.status === 'pending'
                          || (member.status !== 'joined'
                            && member.status !== 'suggested'
                            && member.status !== 'resend')) && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={ () => onResendMember(member.id) }
                              aria-label={ `Resend invitation to ${ member.firstName } ${ member.lastName }` }
                              className="h-8 w-8 text-black hover:text-gray-600"
                            >
                              <MailCheck className="h-4 w-4 text-green-500" />
                            </Button>
                          ) }
                        { (member.status === 'suggested') && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={ () => onInviteMember(member.id) }
                            aria-label={ `Invite ${ member.firstName } ${ member.lastName }` }
                            className="h-8 w-8 text-black hover:text-gray-600"
                          >
                            <CircleCheck className="h-4 w-4 text-purple-500" />
                          </Button>
                        ) }
                        { (member.status === 'invited'
                          || member.status === 'joined'
                          || member.status === 'suggested'
                          || member.status === 'resend') && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={ () => onRemoveMember(member.id) }
                              aria-label={ `Remove ${ member.firstName } ${ member.lastName }` }
                              className="h-8 w-8 text-black hover:text-gray-600"
                            >
                              <MessageCircleX className="h-4 w-4 text-red-500" />
                            </Button>
                          ) }
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={ () => onResetMember(member.id) }
                          aria-label={ `Reset ${ member.firstName } ${ member.lastName }` }
                          className="h-8 w-8 text-black hover:text-gray-600"
                        >
                          <Undo2 className="h-4 w-4 text-yellow-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </li>
              )) }
            </ul>
          ) }
        </div>
      </DialogContent>
    </Dialog>
  )
}
