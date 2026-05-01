'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Trash2, UserPlus } from 'lucide-react'

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
import { Textarea } from '@/components/ui/textarea'
import { NewFamilyInvite } from '@/features/family/types/family-members'

const inviteMemberSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.email('Please enter a valid email address'),
  inviteFounderMessage: z.string().max(500, 'Message must be 500 characters or less').optional(),
})

type InviteMemberValues = z.infer<typeof inviteMemberSchema>

type InviteFamilyDialogProps = {
  newInvites: NewFamilyInvite[]
  onAddInvite: (values: InviteMemberValues) => void
  onRemoveInvite: (id: string) => void
}

export function NewInvitesDialog({ newInvites, onAddInvite, onRemoveInvite }: InviteFamilyDialogProps) {
  const form = useForm<InviteMemberValues>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      inviteFounderMessage: '',
    },
  })

  const onSubmit = (values: InviteMemberValues) => {
    onAddInvite(values)
    form.reset()
  }

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.stopPropagation()
    form.handleSubmit(onSubmit)(e)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="bg-[#59cdf7] hover:bg-[#9de4fe] text-black font-semibold">
          <UserPlus className="mr-2 h-4 w-4" />
          Open Invitation Dialog
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Invite New Family Members</DialogTitle>
          <DialogDescription>
            Add members by first name, last name, and email. You can also remove entries before submitting the invitations.
            When done, close this dialog and select the <b>Send Invitations</b> button.
          </DialogDescription>
        </DialogHeader>

        <Form { ...form }>
          <form onSubmit={ handleFormSubmit } className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <FormField
                control={ form.control }
                name="firstName"
                render={ ({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Jane" { ...field } />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                ) }
              />

              <FormField
                control={ form.control }
                name="lastName"
                render={ ({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Smith" { ...field } />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                ) }
              />

              <FormField
                control={ form.control }
                name="email"
                render={ ({ field }) => (
                  <FormItem>
                    <FormLabel>Family Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="jane@example.com" { ...field } />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                ) }
              />
            </div>

            <FormField
              control={ form.control }
              name="inviteFounderMessage"
              render={ ({ field }) => (
                <FormItem>
                  <FormLabel>Personalized Invite Note <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add a personal note to this invitation..."
                      rows={ 3 }
                      { ...field }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              ) }
            />

            <DialogFooter>
              <Button type="submit" className="bg-[#59cdf7] hover:bg-[#9de4fe] text-black font-semibold">
                Add to List
              </Button>
            </DialogFooter>
          </form>
        </Form>

        <div className="rounded-md border p-4">
          <p className="mb-3 text-sm font-semibold text-neutral-800">
            Invited Members ({ newInvites.length })
          </p>

          { newInvites.length === 0 ? (
            <p className="text-sm text-neutral-500">No entries yet.</p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-1 md:grid-cols-2">
              { newInvites.map((invite) => (
                <li
                  key={ invite.id }
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-tight text-slate-900">
                        { invite.firstName } { invite.lastName }
                      </p>
                      <p className="break-all text-xs text-slate-600">{ invite.email }</p>
                      { invite.inviteFounderMessage && (
                        <p className="mt-1 text-xs text-slate-500 italic">{ invite.inviteFounderMessage }</p>
                      ) }
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={ () => onRemoveInvite(invite.id) }
                      aria-label={ `Remove ${ invite.firstName } ${ invite.lastName }` }
                      className="h-8 w-8 shrink-0 text-neutral-600 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
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
