'use client';

import z from "zod";
import { SubmitHandler, useForm } from "react-hook-form";

import { CardContent, CardFooter } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { NewInvitesDialog } from "./new-members-dialog";
import { useEffect, useState } from "react";
import { NewMembersFormSchema } from "@/features/family/components/validation/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { ArrowRight, Mail } from "lucide-react";
import { CurrentFamilyMember, FounderDetails, NewFamilyInvite } from "@/features/family/types/family-members";
import { addNewAccountInvites, sendEmails } from "./actions";
import { SubmissionStep } from "@/features/family/types/family-steps";
import { initialNewInviteSteps } from "@/features/family/constants/family-steps";
import { StatusUpdateDialog } from '@/features/family/components/dialogs/status-update-dialog';
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type FormValues = z.infer<typeof NewMembersFormSchema>;

//--------------- NewMembersAccountForm Component ---------------
export default function NewMembersAccountForm({ founderDetails, currentFamilyMembers }
  : { founderDetails: FounderDetails, currentFamilyMembers: CurrentFamilyMember[] }) {
  const router = useRouter();
  const [invites, setInvites] = useState<NewFamilyInvite[]>([]);
  const [submissionSteps, setSubmissionSteps] =
    useState<SubmissionStep[]>(initialNewInviteSteps);
  const [showStatusDialog, setShowStatusDialog] = useState(false);


  const form = useForm<FormValues>({
    resolver: zodResolver(NewMembersFormSchema),
    defaultValues: {
      newfamilyMembers: [],
    }
  });
  const { isDirty } = form.formState;

  useEffect(() => {
    form.setValue("newfamilyMembers", invites, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }, [form, invites]);


  const handleAddInvite = (values: Pick<NewFamilyInvite, 'firstName' | 'lastName' | 'email'>) => {
    const normalizedEmail = values.email.trim().toLowerCase();
    const emailExists = currentFamilyMembers.some(
      (member) => member.email.trim().toLowerCase() === normalizedEmail,
    );
    const inviteAlreadyAdded = invites.some(
      (invite) => invite.email.trim().toLowerCase() === normalizedEmail,
    );

    if (emailExists) {
      toast.error("That email already exists in the current family invite list.", {
        position: "top-center",
        duration: 3000,
      });
      return;
    }

    if (inviteAlreadyAdded) {
      toast.error("That email is already in the new invite list.", {
        position: "top-center",
        duration: 3000,
      });
      return;
    }

    // console.log('NewMembersAccountForm->handleAddInvite->Adding invite with values:', values);
    setInvites((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        firstName: values.firstName,
        lastName: values.lastName,
        email: normalizedEmail,
      },
    ])
  }
  const handleRemoveInvite = (id: string) => {
    setInvites((prev) => prev.filter((invite) => invite.id !== id));
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

  /*-------------------- Form Submission ------------------------ */
  const processForm: SubmitHandler<FormValues> = async (values) => {
    // console.log('Form submitted with values:', values);

    setShowStatusDialog(true);

    //--------- Step 1: Create family invitations in PENDING status
    updateStepStatus(1, 'inProgress');
    // await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
    const addInvitesResult = await addNewAccountInvites({
      newInvites: { newInvites: values.newfamilyMembers },
      familyId: founderDetails.familyId as number,
    });
    if (!addInvitesResult.success) {
      updateStepStatus(1, 'error', 'Error occurred adding new invites');
      throw new Error('Error occurred adding new invites');
    }
    updateStepStatus(1, 'completed');

    //--------- Step 2: Send email invitations to register in family
    if (!founderDetails) {
      updateStepStatus(2, 'error', 'Missing founder details for email context');
      throw new Error('Missing founder details for email context');
    }

    updateStepStatus(2, 'inProgress');
    const { familyName, familyId } = founderDetails;
    const sendMemberEmailResult = await sendEmails(
      addInvitesResult.invites,
      familyName,
      familyId,
      founderDetails,
    );
    // console.log("processForm->sendMemberEmailResult: ", sendMemberEmailResult);
    if (sendMemberEmailResult.error) {
      updateStepStatus(2, 'error', sendMemberEmailResult.message);
      throw new Error(sendMemberEmailResult.message);
    };
    updateStepStatus(2, 'completed');

    form.reset(values);
    setInvites([]);
    router.refresh();
  }

  return (
    <>
      <CardContent className="space-y-2 pt-5">
        <Form { ...form }>
          <form onSubmit={ form.handleSubmit(processForm) } className="space-y-4">
            <div className="gap-y-2 ">
              <NewInvitesDialog
                newInvites={ invites }
                onAddInvite={ handleAddInvite }
                onRemoveInvite={ handleRemoveInvite }
              />

              <div className="rounded-md border p-1">
                <p className="mb-3 text-sm font-semibold text-neutral-800">Invited Members ({ invites.length })</p>
                { invites.length === 0 ? (
                  <p className="text-sm text-neutral-500">No family members added yet.</p>
                ) : (
                  <ul className="grid gap-2 sm:grid-cols-1 md:grid-cols-2">
                    { invites.map((invite) => (
                      <li key={ invite.id } className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold leading-tight text-slate-900">
                            { invite.firstName } { invite.lastName }
                          </p>
                          <p className="break-all text-xs text-slate-600">{ invite.email }</p>
                        </div>
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
                    disabled={ !isDirty || invites.length === 0 }
                    className="h-10 w-full rounded-xl bg-[linear-gradient(135deg,#005472_0%,#0a779f_52%,#59cdf7_100%)] text-sm font-bold text-white shadow-[0_18px_30px_-18px_rgba(0,84,114,0.8)] hover:brightness-110 md:w-auto"
                  >
                    Send Invitations
                    <Mail className="ml-1 h-4 w-4" />
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
          redirectUrl="/family-founder-account?tab=new-family"
          submissionSteps={ submissionSteps }
        />
      </CardContent>
    </>
  )
}