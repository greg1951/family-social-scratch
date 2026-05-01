'use client';

import z from "zod";
import { SubmitHandler, useForm } from "react-hook-form";

import { CardContent, CardFooter } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { NewInvitesDialog } from "../../../features/family/components/dialogs/new-members-dialog";
import { useState } from "react";
import { NewMembersFormSchema } from "@/features/family/components/validation/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { CircleCheckBig } from "lucide-react";
import { NewFamilyMember } from "@/features/family/types/family-members";

type FormValues = z.infer<typeof NewMembersFormSchema>;

export default function MyFamilyAccountForm({ familyMembers }: { familyMembers: NewFamilyMember[] }) {

  type FieldName = keyof FormValues

  const form = useForm<FormValues>({
    resolver: zodResolver(NewMembersFormSchema),
    defaultValues: {
      newfamilyMembers: familyMembers,
    }
  });

  const { handleSubmit, reset, trigger, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(NewMembersFormSchema)
  });

  const [members, setMembers] = useState<NewFamilyMember[]>(familyMembers)
  const handleAddMember = (values: Pick<NewFamilyMember, 'firstName' | 'lastName' | 'email'>) => {
    setMembers((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
      },
    ])
  }
  const handleRemoveMember = (id: string) => {
    setMembers((prev) => prev.filter((member) => member.id !== id))
  }
  const processForm: SubmitHandler<FormValues> = async (values) => {
    // console.log('Form submitted with values:', values);
    console.warn("MyFamilyAccountForm->There are NO actions defined for this form submission yet. ");
  }

  return (
    <CardContent className="space-y-2 pt-5">
      <Form { ...form }>
        <form onSubmit={ handleSubmit(processForm) } className="space-y-4">
          <div className="gap-y-2 ">
            <NewInvitesDialog
              newInvites={ members }
              onAddInvite={ handleAddMember }
              onRemoveInvite={ handleRemoveMember }
            />

            <div className="rounded-md border p-1">
              <p className="mb-3 text-sm font-semibold text-neutral-800">Invited Members ({ members.length })</p>
              { members.length === 0 ? (
                <p className="text-sm text-neutral-500">No family members added yet.</p>
              ) : (
                <ul className="space-y-2">
                  { members.map((member) => (
                    <li key={ member.id } className="rounded-md border bg-neutral-100 px-2 py-1">
                      <p className="text-sm font-medium text-neutral-900">{ member.firstName } { member.lastName }</p>
                      <p className="text-xs text-neutral-600">{ member.email }</p>
                    </li>
                  )) }
                </ul>
              ) }
            </div>
            <div className="flex items-center py-2"></div>
            <CardFooter className="flex justify-center gap-y-2">
              <div className="flex justify-center">
                <Button type="submit" className="w-full bg-[#59cdf7] hover:bg-[#9de4fe] text-black font-semibold md:w-auto text-xs md:text-sm">
                  Update Family
                  <CircleCheckBig className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardFooter>
          </div>
        </form>
      </Form>
    </CardContent>
  )
}