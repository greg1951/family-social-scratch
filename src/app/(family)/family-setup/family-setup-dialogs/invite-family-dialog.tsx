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

const inviteMemberSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
})

type InviteMemberValues = z.infer<typeof inviteMemberSchema>

export type FamilyMember = {
  id: string
  firstName: string
  lastName: string
  email: string
}

type InviteFamilyDialogProps = {
  members: FamilyMember[]
  onAddMember: (values: InviteMemberValues) => void
  onRemoveMember: (id: string) => void
}

export function InviteFamilyDialog({ members, onAddMember, onRemoveMember }: InviteFamilyDialogProps) {
  const form = useForm<InviteMemberValues>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
    },
  })

  const onSubmit = (values: InviteMemberValues) => {
    onAddMember(values)
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
          Invite Family Member
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Invite Family Members</DialogTitle>
          <DialogDescription>
            Add members by first name, last name, and email. You can also remove entries before moving to the next step.
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

            <DialogFooter>
              <Button type="submit" className="bg-[#59cdf7] hover:bg-[#9de4fe] text-black font-semibold">
                Add to List
              </Button>
            </DialogFooter>
          </form>
        </Form>

        <div className="rounded-md border p-4">
          <p className="mb-3 text-sm font-semibold text-neutral-800">
            Invited Members ({ members.length })
          </p>

          { members.length === 0 ? (
            <p className="text-sm text-neutral-500">No entries yet.</p>
          ) : (
            <ul className="space-y-2">
              { members.map((member) => (
                <li
                  key={ member.id }
                  className="flex items-center justify-between rounded-md border bg-neutral-50 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{ member.firstName } { member.lastName }</p>
                    <p className="text-xs text-neutral-600">{ member.email }</p>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={ () => onRemoveMember(member.id) }
                    aria-label={ `Remove ${ member.firstName } ${ member.lastName }` }
                    className="text-neutral-600 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              )) }
            </ul>
          ) }
        </div>
      </DialogContent>
    </Dialog>
  )
}
