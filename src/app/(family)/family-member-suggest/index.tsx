'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Input } from "@/components/ui/input";
import { CurrentFamilyMember, FounderDetails } from "@/features/family/types/family-members";
import { MemberKeyDetails } from "@/features/family/types/family-steps";
import { Info } from "lucide-react";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import z from "zod";
import { StatusUpdateDialog } from "@/features/family/components/dialogs/status-update-dialog";
import { SubmissionStep } from "@/features/family/types/family-steps";
import { initialSuggestedInviteSteps } from "@/features/family/constants/family-steps";
import { CircleCheck } from "lucide-react";
import { createSuggestedInvite } from "./actions";

const inviteMemberSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, "First name must be at least 2 characters.")
    .regex(/^[A-Za-z' -]+$/, "First name can only contain letters, spaces, apostrophes, or hyphens."),
  lastName: z
    .string()
    .trim()
    .min(2, "Last name must be at least 2 characters.")
    .regex(/^[A-Za-z' -]+$/, "Last name can only contain letters, spaces, apostrophes, or hyphens."),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address."),
});

type InviteMemberFormValues = z.infer<typeof inviteMemberSchema>;

export default function FamilyMemberSuggestForm({
  familyId,
  currentFamilyMembers,
  memberKeyDetails,
  founderDetails,
}: {
  familyId: number;
  currentFamilyMembers: CurrentFamilyMember[];
  memberKeyDetails: MemberKeyDetails;
  founderDetails: FounderDetails | null;
}) {
  const [members, setMembers] = useState<CurrentFamilyMember[]>(currentFamilyMembers);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [submissionSteps, setSubmissionSteps] = useState<SubmissionStep[]>(initialSuggestedInviteSteps);
  const form = useForm<InviteMemberFormValues>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
    },
  });
  const { isDirty } = form.formState;
  const founderFullName = `${ memberKeyDetails.firstName } ${ memberKeyDetails.lastName }`.trim();

  const getStatusClasses = (status: string) => {
    const normalized = status.toLowerCase();
    if (normalized === "active" || normalized === "joined") {
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    }
    if (normalized === "pending") {
      return "bg-amber-100 text-amber-700 border-amber-200";
    }
    if (normalized === "suggested") {
      return "bg-sky-100 text-sky-700 border-sky-200";
    }
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  const updateStepStatus = (stepId: number, status: SubmissionStep['status'], errorMessage?: string) => {
    setSubmissionSteps(prev =>
      prev.map(step =>
        step.id === stepId
          ? { ...step, status, errorMessage }
          : step
      )
    );
  };

  const processForm: SubmitHandler<InviteMemberFormValues> = async (values) => {
    // console.log('SubmitHandler->values:', values);
    const normalizedValues = {
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email.trim().toLowerCase(),
    };

    const duplicateEmailExists = members.some(
      (member) => member.email.trim().toLowerCase() === normalizedValues.email
    );

    if (duplicateEmailExists) {
      form.setError("email", {
        type: "manual",
        message: "That email is already in the member suggestion list.",
      });
      return;
    }

    form.clearErrors("email");

    setMembers((prevMembers) => [
      ...prevMembers,
      {
        id: Date.now(),
        firstName: normalizedValues.firstName,
        lastName: normalizedValues.lastName,
        email: normalizedValues.email,
        status: "suggested",
      },
    ]);

    console.log("FamilyMemberSuggestForm->SubmitHandler:", normalizedValues);
    setShowStatusDialog(true);

    // Step 1: Create suggested invite
    updateStepStatus(1, 'inProgress');
    // await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
    const suggestedInvite = {
      firstName: normalizedValues.firstName,
      lastName: normalizedValues.lastName,
      email: normalizedValues.email,
      status: "suggested",
      familyId: memberKeyDetails.familyId as number
    };
    console.log('FamilyMemberSuggestForm->SubmitHandler->before createSuggestedInvite->currentFamilyMembers: ', currentFamilyMembers);
    const createInviteResult = await createSuggestedInvite({ suggestedInvite });
    if (!createInviteResult || createInviteResult.error) {
      const error = `Failed to create suggested invite: ${ createInviteResult?.message }`;
      updateStepStatus(1, 'error', error);
      throw new Error(error);
    }
    updateStepStatus(1, 'completed');

    // Step 2: Notify founder (simulated with timeout here)
    updateStepStatus(2, 'inProgress');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
    updateStepStatus(2, 'completed');

    form.reset(values);
  };


  return (
    <div className="rounded-md border p-1">
      <div className="mb-3 rounded-lg border border-sky-200 bg-sky-50 p-3 shadow-sm">
        <p className="text-xs text-center font-semibold uppercase tracking-wide text-sky-800">Family Founder</p>
        { founderDetails ? (
          <div className="mt-1 grid gap-1 text-xs text-slate-700 md:grid-cols-2">
            <p>
              <span className="font-semibold text-slate-800">Name:</span>{ " " }
              { founderDetails.firstName } { founderDetails.lastName }
            </p>
            <p>
              <span className="font-semibold text-slate-800">Email:</span>{ " " }
              { founderDetails.email }
            </p>
            { founderDetails.nickName?.trim() && (
              <p>
                <span className="font-semibold text-slate-800">Nickname:</span>{ " " }
                { founderDetails.nickName }
              </p>
            ) }
            { founderDetails.cellPhone?.trim() && (
              <p>
                <span className="font-semibold text-slate-800">Cell Phone:</span>{ " " }
                { founderDetails.cellPhone }
              </p>
            ) }
          </div>
        ) : (
          <p className="mt-1 text-xs text-slate-600">Founder details are not available.</p>
        ) }
      </div>
      <p className="mb-3 text-sm font-semibold text-neutral-800">Current Members ({ members.length })</p>
      { members.length === 0 ? (
        <p className="text-sm text-neutral-500">No family members added yet.</p>
      ) : (
        <ul className="grid sm:grid-cols-1 gap-2 md:grid-cols-2">
          { members.map((member) => (
            <li key={ member.id } className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-tight text-slate-900">
                    { member.firstName } { member.lastName }
                  </p>
                  <p className="break-all text-xs text-slate-600">{ member.email }</p>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  <span className={ `rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${ getStatusClasses(member.status) }` }>
                    { member.status }
                  </span>
                </div>
              </div>
            </li>
          )) }
        </ul>
      ) }
      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 shadow-sm">
        <div className="mb-3 flex justify-center">
          <HoverCard>
            <HoverCardTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1 text-sm font-bold text-slate-900 underline decoration-dotted underline-offset-4"
                aria-label="Suggestion help"
              >
                <Info className="h-4 w-4 text-sky-700" />
                Suggest New Family Member
              </button>
            </HoverCardTrigger>
            <HoverCardContent side="top" className="font-app w-90 text-xs leading-tight">
              <div className="flex items-center gap-1" >
                <CircleCheck size={ 6 } className="md:h-15 md:w-15 text-green-500" />
                <p className='text-sm p-1'>
                  If there is another family member or friend you would like to invite to the family,
                  then add it below.
                </p>
              </div>
              <div className="flex items-center gap-1" >
                <CircleCheck size={ 6 } className="md:h-11 md:w-11 text-green-500" />
                <p className='text-sm p-1'>
                  The family founder will be notified of your suggestions and will review it.
                </p>
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>
        <Form { ...form }>
          <form onSubmit={ form.handleSubmit(processForm) } className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[0.85fr_0.85fr_1.3fr]">
              <FormField
                control={ form.control }
                name="firstName"
                render={ ({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-extrabold">First Name</FormLabel>
                    <FormControl>
                      <Input className="text-xs" placeholder="First..." { ...field } />
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
                    <FormLabel className="text-sm font-extrabold">Last Name</FormLabel>
                    <FormControl>
                      <Input className="text-xs" placeholder="Last..." { ...field } />
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
                    <FormLabel className="text-sm font-extrabold">Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" className="text-xs" placeholder="name@example.com" { ...field } />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                ) }
              />
            </div>

            <div className="flex justify-center gap-2 pt-1">
              <Button type="submit" disabled={ !isDirty } className="rounded-lg px-4 py-2">
                Submit Suggestion
              </Button>
            </div>
          </form>
        </Form>
        {/* Status Dialog */ }
        <StatusUpdateDialog
          open={ showStatusDialog }
          onOpenChange={ setShowStatusDialog }
          redirectUrl="/family-member-account?tab=current-family"
          submissionSteps={ submissionSteps }
        />

      </div>
    </div>
  );
} 