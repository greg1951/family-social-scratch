'use client';

import z from "zod";
import { SubmitHandler, useForm } from "react-hook-form";

import { CardContent, CardFooter } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { useEffect, useState } from "react";
import { CurrentMembersFormSchema } from "@/features/family/components/validation/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { CircleCheckBig, Group } from "lucide-react";
import { CurrentFamilyMember, CurrentMembersValues } from "@/features/family/types/family-members";
import { CurrentMembersDialog } from "./current-members-dialog";
import { toast } from "sonner";
import { updateFamilyInviteStatuses } from "@/components/db/sql/queries-family-invite";
import { updateCurrentMembers } from "./actions";

type FormValues = z.infer<typeof CurrentMembersFormSchema>;

export default function CurrentMembersAccountForm({ familyMembers }: { familyMembers: CurrentFamilyMember[] }) {
  const form = useForm<FormValues>({
    resolver: zodResolver(CurrentMembersFormSchema),
    defaultValues: {
      currentFamilyMembers: familyMembers,
    }
  });
  const { isDirty } = form.formState;

  const [members, setMembers] = useState<CurrentFamilyMember[]>(familyMembers);
  const [originalMembers] = useState<CurrentFamilyMember[]>(familyMembers);

  useEffect(() => {
    form.setValue("currentFamilyMembers", members, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }, [form, members]);

  function setStateStatus(newStatus: string, id: number) {
    const mbr = members.find((mbr) => mbr.id === id);
    if (mbr) {
      // console.log(`Updating member with id: ${ id } to status: ${ newStatus }`);
      setMembers((prev) => prev.map((member) => (
        member.id === id
          ? {
            ...member,
            status: newStatus,
          }
          : member
      )));
    } else {
      console.warn(`Member with id: ${ id } not found. Cannot set status ${ newStatus }.`);
    }
  }


  const handleResendMember = (id: number) => {
    setStateStatus('resend', id);
  }
  const handleRemoveMember = (id: number) => {
    setStateStatus('remove', id);
  }
  const handleResetMember = (id: number) => {
    const originalMember = originalMembers.find((mbr) => mbr.id === id);
    if (originalMember) {
      setMembers((prev) => prev.map((member) => (member.id === id ? originalMember : member)));
    }
  }
  const processForm: SubmitHandler<FormValues> = async (values) => {
    console.log('SubmitHandler->values:', values);
    console.log('SubmitHandler->Dirty fields:', form.formState.dirtyFields);

    const currentMemberValues: CurrentMembersValues = {
      currentMembers: values.currentFamilyMembers.map((member) => ({
        id: member.id,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        status: member.status,
      })),
    };

    const originalMemberValues: CurrentMembersValues = {
      currentMembers: originalMembers.map((member) => ({
        id: member.id,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        status: member.status,
      })),
    };

    const result = await updateCurrentMembers({ currentMembers: currentMemberValues, originalMembers: originalMemberValues });
    if (!result.success) {
      toast.error("There was an error updating your family members. Please try again.", { position: "top-center", duration: 3000 });
      return;
    }

    form.reset(values);
    toast.success("Your family members have been updated", {
      position: "top-center",
      duration: 2000,
    });

  }

  return (
    <CardContent className="space-y-2 pt-5">
      <Form { ...form }>
        <form onSubmit={ form.handleSubmit(processForm) } className="space-y-4">
          <div className="gap-y-2 ">
            <CurrentMembersDialog
              members={ members }
              onResendMember={ handleResendMember }
              onRemoveMember={ handleRemoveMember }
              onResetMember={ handleResetMember }
            />

            <div className="rounded-md border p-1">
              <p className="mb-3 text-sm font-semibold text-neutral-800">Current Members ({ members.length })</p>
              { members.length === 0 ? (
                <p className="text-sm text-neutral-500">No family members added yet.</p>
              ) : (
                <ul className="space-y-2">
                  { members.map((member) => (
                    <li key={ member.id } className="rounded-md border bg-neutral-100 px-2 py-1">
                      <p className="text-sm font-medium text-neutral-900">
                        { member.firstName } { member.lastName }
                      </p>
                      <p className="text-xs text-neutral-600">{ member.email }</p>
                      <p className="text-xs text-neutral-600">{ `status: ${ member.status.toUpperCase() }` }</p>
                      <p className="text-xs text-neutral-600">{ `(id: ${ member.id })` }</p>
                    </li>
                  )) }
                </ul>
              ) }
            </div>
            <div className="flex items-center py-2"></div>
            <CardFooter className="flex justify-center gap-y-2">
              <div className="flex justify-center">
                <Button type="submit" disabled={ !isDirty } className="w-full bg-[#59cdf7] hover:bg-[#9de4fe] text-black font-semibold md:w-auto text-xs md:text-sm">
                  Update Marked Changes
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