'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Trash2, UserPlus, MessageCircleReply, MessageCircleX, MailCheck, Undo2, CircleCheck, CircleSlash, Users } from 'lucide-react'

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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { CurrentFamilyMember } from '@/features/family/types/family-members'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'

const currentMemberSchema = z.object({
  id: z.number(),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.email('Please enter a valid email address'),
  invitationStatus: z.enum(['pending', 'joined', 'revoked']),
})

type UpdateMemberValues = z.infer<typeof currentMemberSchema>

type CurrentMembersDialogProps = {
  members: CurrentFamilyMember[]
  onResendMember: (id: number) => void
  onRemoveMember: (id: number) => void
  onResetMember: (id: number) => void
}

export function CurrentMembersDialog({ members, onResendMember, onRemoveMember, onResetMember }: CurrentMembersDialogProps) {
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
            Change a family member status to REMOVE from the family or to RESEND an email invitation.
            When done, close the dialog and click the "Update Marked Changes" button to apply your changes.
          </DialogDescription>
        </DialogHeader>

        <div className="font-app rounded-md border p-4">
          <HoverCard openDelay={ 10 } closeDelay={ 100 }>
            <HoverCardTrigger asChild>
              <Button className='w-auto text-xs md:text-sm' variant="link">Current Members ({ members.length })</Button>
            </HoverCardTrigger>
            <HoverCardContent side='top' className="flex w-50 md:w-120 flex-col gap-0.5">
              <div className="flex items-center gap-1" >
                <MailCheck size={ 6 } className="h-10 w-10 text-green-500" />
                <p className='text-sm p-1'>Set status to RESEND that will resend the invitation email to the member</p>
              </div>
              <div className="flex items-center gap-1" >
                <MessageCircleX className="h-10 w-10 text-red-500" />
                <p className='text-sm p-1'>Set status to REMOVE that will revoke the invitation email to the member</p>
              </div>
              <div className="flex items-center gap-1" >
                <Undo2 className="h-7 w-7 text-yellow-500" />
                <p className='text-sm p-1'>Reset the member to the original status</p>
              </div>
            </HoverCardContent>
          </HoverCard>

          { members.length === 0 ? (
            <p className="text-sm text-neutral-500">No family members? Get crackin'</p>
          ) : (
            <ul className="space-y-2">
              { members.map((member) => (
                <li
                  key={ member.id }
                  className="flex items-center justify-between rounded-md border bg-neutral-50 px-3 py-2 relative"
                >
                  <div>
                    <p className="text-sm font-medium text-neutral-900">
                      { member.firstName } { member.lastName }
                    </p>
                    <p className="text-xs text-neutral-600">{ member.email }</p>
                    <p className="text-xs text-neutral-600">{ `status: ${ member.status.toUpperCase() }` }</p>
                    <p className="text-xs text-neutral-600">{ `(id: ${ member.id })` }</p>
                  </div>
                  <div className='absolute right-1'>
                    { (member.status === 'pending' || member.status !== 'joined') && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={ () => onResendMember(member.id) }
                        aria-label={ `Resend invitation to ${ member.firstName } ${ member.lastName }` }
                        className="text-black hover:text-gray-600"
                      >
                        <MailCheck className="h-4 w-4 text-green-500" />
                      </Button>
                    ) }
                    { (member.status === 'invited' || member.status === 'joined') && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={ () => onRemoveMember(member.id) }
                        aria-label={ `Remove ${ member.firstName } ${ member.lastName }` }
                        className="text-black hover:text-gray-600"
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
                      className="text-black hover:text-gray-600"
                    >
                      <Undo2 className="h-4 w-4 text-yellow-500" />
                    </Button>
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
