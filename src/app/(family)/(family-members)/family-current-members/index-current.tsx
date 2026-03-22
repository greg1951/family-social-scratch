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
import { processInviteDeletes, processInviteUpdates, sendInviteEmails } from "./actions";
import { SubmissionStep } from "@/features/family/types/family-steps";
import { initialCurrentInviteSteps } from "@/features/family/constants/family-steps";
import { useRouter } from "next/navigation";
import { MemberKeyDetails } from "@/features/family/types/family-steps";
import { StatusUpdateCounts, StatusUpdateProcessing } from "@/components/db/types/family-member";
import { StatusUpdateDialog } from "@/features/family/components/dialogs/status-update-dialog";
import { initializeFormProcessingArray, initializeProcessUpdateCounts, initializeRecordCounts } from "@/features/family/services/client-side";
import { ArrowRight } from "lucide-react";

type FormValues = z.infer<typeof CurrentMembersFormSchema>;

export default function CurrentMembersAccountForm({ familyMembers, founderKeyDetails }: { familyMembers: CurrentFamilyMember[], founderKeyDetails: MemberKeyDetails }) {

  const router = useRouter();
  const [submissionSteps, setSubmissionSteps] =
    useState<SubmissionStep[]>(initialCurrentInviteSteps);
  const [showStatusDialog, setShowStatusDialog] = useState(false);


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

  const updateStepStatus = (stepId: number, status: SubmissionStep['status'], errorMessage?: string) => {
    setSubmissionSteps(prev =>
      prev.map(step =>
        step.id === stepId
          ? { ...step, status, errorMessage }
          : step
      )
    );
  };

  const processForm: SubmitHandler<FormValues> = async (values) => {
    // console.log('SubmitHandler->values:', values);
    // console.log('SubmitHandler->founderKeyDetails:', founderKeyDetails);
    setShowStatusDialog(true);

    const updatedInvites = initializeFormProcessingArray({
      formCurrentMembers: values.currentFamilyMembers,
      originalMembers: originalMembers,
      founderKeyDetails: founderKeyDetails
    });

    // Use these counts to track the processing and help in reconcilement of all changes
    let statusUpdateCounts: StatusUpdateCounts = initializeProcessUpdateCounts();
    statusUpdateCounts = initializeRecordCounts(updatedInvites, statusUpdateCounts);
    statusUpdateCounts.totalUpdateCount = updatedInvites.length;

    console.log('SubmitHandler->statusUpdateCounts: ', statusUpdateCounts);

    //--------- Step 1: Delete family invitations
    updateStepStatus(1, 'inProgress');
    if (updatedInvites.length > 0 && statusUpdateCounts.totalDeleteRecordsCount > 0) {
      const deletesResult = await processInviteDeletes({ updatedInvites, statusUpdateCounts, founderKeyDetails });
      if (deletesResult && !deletesResult.success) {
        updateStepStatus(1, 'error', deletesResult.message);
        throw new Error('Error processing invite deletes: ' + deletesResult.message);
      }
    }
    updateStepStatus(1, 'completed');


    //--------- Step 2: Update family invitation statuses
    updateStepStatus(2, 'inProgress');
    if (updatedInvites.length > 0 && statusUpdateCounts.totalResendRecordsCount > 0) {
      const updatesResult = await processInviteUpdates({ updatedInvites, statusUpdateCounts, founderKeyDetails });
      if (updatesResult && !updatesResult.success) {
        updateStepStatus(2, 'error', updatesResult.message);
        throw new Error('Error processing invite updates: ' + updatesResult.message);
      }
    }
    updateStepStatus(2, 'completed');

    //--------- Step 3: Send invite emails
    updateStepStatus(3, 'inProgress');
    if (updatedInvites.length > 0 && statusUpdateCounts.totalResendRecordsCount > 0) {
      const sendResult = await sendInviteEmails({ updatedInvites, statusUpdateCounts, founderKeyDetails });
      if (sendResult && !sendResult.success) {
        updateStepStatus(3, 'error', sendResult.message);
        throw new Error('Error sending invite emails: ' + sendResult.message);
      }
    }
    updateStepStatus(3, 'completed');

    form.reset(values);
    toast.success("Your family member invites have been updated", {
      position: "top-center",
      duration: 2000,
    });
    router.refresh();
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
                <Button
                  type="submit"
                  disabled={ !isDirty }
                  className="h-10 w-full rounded-xl bg-[linear-gradient(135deg,#005472_0%,#0a779f_52%,#59cdf7_100%)] text-xs font-bold text-white shadow-[0_18px_30px_-18px_rgba(0,84,114,0.8)] hover:brightness-110 md:w-auto md:text-sm"
                >
                  Update Marked Changes
                  <CircleCheckBig className="ml-1 h-4 w-4" />
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardFooter>
          </div>
        </form>
      </Form>
      {/* Status Dialog */ }
      <StatusUpdateDialog
        open={ showStatusDialog }
        onOpenChange={ setShowStatusDialog }
        redirectUrl="/family-founder-account?tab=current-family"
        submissionSteps={ submissionSteps }
      />
    </CardContent>
  )
}