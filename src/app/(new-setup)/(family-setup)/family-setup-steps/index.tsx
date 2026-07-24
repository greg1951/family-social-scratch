'use client';

import { FamilyFormSchema } from '@/features/family/components/validation/schema';
import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { CircleSlash2, CircleArrowLeft, CircleArrowRight, CircleCheckBig, Eye, EyeOff, CircleSlash, CircleCheck } from "lucide-react";
import { useRouter } from 'next/navigation';
import { familySteps, noSpacesOrSpecialCharsRegex, STEP_1_FOUNDER, STEP_2_FAMILY_NAME, STEP_3_INVITE_MEMBERS, STEP_4_CREATE_FAMILY_SITE } from '@/features/family/constants/family-steps';
import { NewInvitesDialog } from '@/features/family/components/dialogs/new-members-dialog';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'; import { StatusUpdateDialog } from '../../../../features/family/components/dialogs/status-update-dialog';
import { initialSubmissionSteps } from '@/features/family/constants/family-steps';
import { RegistrationMemberDetails, SubmissionStep } from '@/features/family/types/family-steps';
import { createFamily, createFamilyInvites, createFounderInviteThread, createFounderMember, createFounderUser, isMemberEmailInUse, sendEmails } from './actions';
import { addMemberNotifications } from '@/app/(new-setup)/(member-setup)/family-member-registration/actions';
import { FounderDetails, NewFamilyMember } from '@/features/family/types/family-members';

type FormValues = z.infer<typeof FamilyFormSchema>;
const steps = familySteps;

export default function CreateFamilyAccountSteps({ familyNames }: { familyNames: string[] }) {

  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [familyNameGood, setFamilyNameGood] = useState(false);

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [memberEmailValidationError, setMemberEmailValidationError] = useState('');

  // Status dialog state
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [submissionSteps, setSubmissionSteps] =
    useState<SubmissionStep[]>(initialSubmissionSteps);

  const form = useForm<FormValues>({
    resolver: zodResolver(FamilyFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      passwordConfirm: "",
      familyName: "",
      familyMembers: [],
    }
  });

  const { handleSubmit, reset, trigger, formState: { errors } } = form;

  type FieldName = keyof FormValues

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
    // Show status dialog
    setShowStatusDialog(true);

    try {
      // Step 1: Add new family name
      updateStepStatus(1, 'inProgress');
      const insertFamilyResult = await createFamily(values.familyName);
      if (!insertFamilyResult.success) {
        updateStepStatus(1, 'error', insertFamilyResult.message);
        throw new Error(insertFamilyResult.message);
      }
      // await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      updateStepStatus(1, 'completed');

      // Step 2: Create Member entry for the Founder
      updateStepStatus(2, 'inProgress');
      const registrationDetails: RegistrationMemberDetails = {
        email: values.email as string,
        firstName: values.firstName as string,
        lastName: values.lastName as string,
        nickName: values.nickName as string | undefined,
        familyId: insertFamilyResult.id as number,
        isFounder: true,
      }
      const insertMemberResult = await createFounderMember(registrationDetails);
      if (!insertMemberResult.success) {
        updateStepStatus(2, 'error', insertMemberResult.message);
        throw new Error(insertMemberResult.message);
      }
      updateStepStatus(2, 'completed');

      // Step 3: Add Founder credentials
      updateStepStatus(3, 'inProgress');
      const insertUserResult = await createFounderUser({
        email: values.email as string,
        password: values.password as string,
        memberId: insertMemberResult.id as number,
        familyId: insertFamilyResult.id as number,
      });

      if (!insertUserResult.success) {
        updateStepStatus(3, 'error', insertUserResult.message);
        throw new Error(insertUserResult.message);
      }
      updateStepStatus(3, 'completed');

      // Step 4: Add founder notifications
      updateStepStatus(4, 'inProgress');
      const addMemberNotificationsResult = await addMemberNotifications(insertMemberResult.id);
      if (!addMemberNotificationsResult.success) {
        const message = "Error occurred inserting founder notifications";
        updateStepStatus(4, 'error', message);
        throw new Error(message);
      }
      updateStepStatus(4, 'completed');

      // Step 5: Add invited family members
      updateStepStatus(5, 'inProgress');
      const invitesInput = members.map((member) => (
        {
          firstName: member.firstName,
          lastName: member.lastName,
          email: member.email,
          inviteFounderMessage: member.inviteFounderMessage,
          familyId: insertFamilyResult.id as number
        }));

      const insertInvitesResult = await createFamilyInvites(invitesInput);
      if (!insertInvitesResult.success) {
        updateStepStatus(5, 'error', insertInvitesResult.message);
        throw new Error(insertInvitesResult.message);
      }
      updateStepStatus(5, 'completed');

      // Step 6: Send emails to join new My Family Social family
      updateStepStatus(6, 'inProgress');
      const founderDetails: FounderDetails = {
        email: registrationDetails.email,
        firstName: registrationDetails.firstName,
        lastName: registrationDetails.lastName,
        nickName: registrationDetails.nickName,
        status: 'invited',
        memberId: 0, // Do not have this and don't need it for sending the email, so setting to 0 to satisfy type requirement.
        familyName: values.familyName,
        familyId: insertFamilyResult.id as number,
        isFounder: true,
      };

      const sendMemberEmailResult =
        await sendEmails(insertInvitesResult.invites, values.familyName, founderDetails);
      // console.log("processForm->sendMemberEmailResult: ", sendMemberEmailResult);
      if (sendMemberEmailResult.error) {
        updateStepStatus(6, 'error', sendMemberEmailResult.message);
        throw new Error(sendMemberEmailResult.message);
      };
      updateStepStatus(6, 'completed');

      // Step 3: Collect invited member emails into a comma-delimited string
      const invitedEmails = members.map(member => member.email).join(', ');
      const threadResult = await createFounderInviteThread({
        invitedEmails,
        familyName: values.familyName,
        familyId: insertFamilyResult.id,
        founderMemberId: insertMemberResult.id,
      });

      if (!threadResult.success) {
        updateStepStatus(6, 'error', threadResult.message);
        throw new Error(threadResult.message);
      }

      setShowStatusDialog(false);
      router.push('/login');
      return;

    } catch (error) {
      console.error('Error during form submission:', error);
      // Mark current step as error
      const currentStepInProgress = submissionSteps.find(s => s.status === 'inProgress');
      if (currentStepInProgress) {
        updateStepStatus(currentStepInProgress.id, 'error', 'An error occurred during this step');
      }
    }
  }

  const next = async () => {
    setMemberEmailValidationError('');
    reset(form.getValues());
    const fields = steps[currentStep].fields;
    const output = await trigger(fields as FieldName[], { shouldFocus: true })

    if (!output) return

    if (currentStep === STEP_1_FOUNDER) {
      const founderEmail = form.getValues('email');
      const founderEmailCheck = await isMemberEmailInUse(founderEmail);

      if (founderEmailCheck.exists) {
        form.setError('email', {
          type: 'manual',
          message: 'This email address is already in use in My Family Social.',
        });
        return;
      }

      form.clearErrors('email');
    }

    if (currentStep === STEP_3_INVITE_MEMBERS) {
      const normalizedFounderEmail = form.getValues('email').trim().toLowerCase();
      const inviteEmailCounts = members.reduce<Record<string, number>>((acc, member) => {
        const normalizedEmail = member.email.trim().toLowerCase();
        acc[normalizedEmail] = (acc[normalizedEmail] ?? 0) + 1;
        return acc;
      }, {});

      const containsFounderEmail = members.some((member) => member.email.trim().toLowerCase() === normalizedFounderEmail);

      const duplicateInviteEmails = Object.entries(inviteEmailCounts)
        .filter(([, count]) => count > 1)
        .map(([email]) => email);

      if (duplicateInviteEmails.length > 0 || containsFounderEmail) {
        setMemberEmailValidationError('One or more invited email addresses are not allowed.');
        return;
      }

      const duplicateEmailMembers = await Promise.all(
        members.map(async (member) => {
          const result = await isMemberEmailInUse(member.email);
          return result.exists ? member.email : null;
        })
      );

      const hasInUseEmail = duplicateEmailMembers.some((email) => Boolean(email));

      if (hasInUseEmail) {
        setMemberEmailValidationError('One or more invited email addresses are not allowed.');
        return;
      }
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(step => step + 1)
    }
  }

  const prev = () => {
    if (currentStep > 0) {
      setCurrentStep(step => step - 1)
    }
  }

  // Handlers to add/remove members to the invited members list. 
  const [members, setMembers] = useState<NewFamilyMember[]>([])
  const handleAddMember = async (values: Pick<NewFamilyMember, 'firstName' | 'lastName' | 'email' | 'inviteFounderMessage'>) => {
    const normalizedInviteEmail = values.email.trim().toLowerCase();
    const normalizedFounderEmail = form.getValues('email').trim().toLowerCase();

    if (normalizedInviteEmail === normalizedFounderEmail) {
      return {
        success: false,
        message: 'One or more invited email addresses are not allowed.',
      };
    }

    const alreadyAdded = members.some((member) => member.email.trim().toLowerCase() === normalizedInviteEmail);
    if (alreadyAdded) {
      return {
        success: false,
        message: 'One or more invited email addresses are not allowed.',
      };
    }

    const existingMemberResult = await isMemberEmailInUse(normalizedInviteEmail);
    if (existingMemberResult.exists) {
      return {
        success: false,
        message: 'One or more invited email addresses are not allowed.',
      };
    }

    setMembers((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        firstName: values.firstName,
        lastName: values.lastName,
        email: normalizedInviteEmail,
        inviteFounderMessage: values.inviteFounderMessage,
      },
    ]);

    return { success: true };
  }
  const handleRemoveMember = (id: string) => {
    setMembers((prev) => prev.filter((member) => member.id !== id))
  }

  const stepProgress = Math.round(((currentStep + 1) / steps.length) * 100)

  return (
    <>
      <div className="font-app min-h-[90vh] bg-linear-to-b from-white to-slate-50 px-4 py-2 sm:px-6 md:px-8">
        <div className="mx-auto w-full max-w-4xl">
          <Card className="w-full border-slate-200 shadow-lg">
            <CardHeader className="rounded-t-xl bg-linear-to-r from-[#59cdf7] to-[#9de4fe] px-4 py-4 md:px-6 md:py-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="text-2xl font-extrabold text-slate-900 md:text-3xl">
                    Family Account Setup
                  </CardTitle>
                  <CardDescription className="mt-1 text-sm text-slate-800">
                    Step { currentStep + 1 } of { steps.length } • { steps[currentStep]?.title }
                  </CardDescription>
                </div>

                <div className="min-w-44 rounded-lg border border-white/70 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-700 md:text-sm">
                  Progress: { stepProgress }%
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/80">
                    <div
                      className="h-full rounded-full bg-[#005472] transition-all"
                      style={ { width: `${ stepProgress }%` } }
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <Form { ...form }>
              <form onSubmit={ handleSubmit(processForm) } className="space-y-3 md:space-y-4">
                { currentStep === STEP_1_FOUNDER && (
                  <>
                    <div className="px-4 pt-2 md:px-6">
                      <CardDescription>
                        <div className="flex flex-col items-start gap-2 rounded-lg border border-slate-200 bg-white px-3 py-3 sm:flex-row sm:items-center sm:gap-3 sm:px-4">
                          <img src="/icons/bluering1.png" alt="step 1" className="aspect-auto object-cover h-9 w-9 sm:h-10 sm:w-10" />
                          <h3 className="font-extrabold text-sm sm:text-base">
                            Define Family Founder
                          </h3>
                          <p className='text-xs leading-5 text-slate-700 sm:text-sm'>Register yourself as the family founder by providing your information and login credentials.</p>
                        </div>
                      </CardDescription>
                    </div>
                    <CardContent className="space-y-3 px-4 pt-2 md:px-6">
                      <div className="grid grid-cols-1">
                        <fieldset disabled={ form.formState.isSubmitting } className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3">
                          <div className='pb-1'>
                            <FormField
                              control={ form.control }
                              name="firstName"
                              render={ ({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs font-bold uppercase tracking-wide text-slate-700">First Name</FormLabel>
                                  <FormControl>
                                    <Input { ...field } placeholder="Your first name" className="h-9 text-sm" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              ) }
                            />
                            <div>
                              { errors.firstName?.message && (
                                <p className='mt-1 text-xs text-red-500'>
                                  { errors.firstName.message }
                                </p>
                              ) }
                            </div>
                          </div>
                          <div className='pb-1'>
                            <FormField
                              control={ form.control }
                              name="lastName"
                              render={ ({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs font-bold uppercase tracking-wide text-slate-700">Last Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Your last name" { ...field } className="h-9 text-sm" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              ) }
                            />
                            <div>
                              { errors.lastName?.message && (
                                <p className='mt-1 text-xs text-red-500'>
                                  { errors.lastName.message }
                                </p>
                              ) }
                            </div>
                          </div>

                          <div>
                            <FormField
                              control={ form.control }
                              name="nickName"
                              render={ ({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs font-bold uppercase tracking-wide text-slate-700">Nickname</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Optional nickname" { ...field } className="h-9 text-sm" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              ) }
                            />
                            { errors.nickName?.message && (
                              <p className='mt-1 text-xs text-red-500'>
                                { errors.nickName.message }
                              </p>
                            ) }
                          </div>
                        </fieldset>
                      </div>

                      <div className="grid grid-cols-1">
                        <fieldset disabled={ form.formState.isSubmitting } className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3">
                          <div className='pb-1'>
                            <FormField
                              control={ form.control }
                              name="email"
                              render={ ({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs font-bold uppercase tracking-wide text-slate-700">Founder&apos;s Email</FormLabel>
                                  <FormControl>
                                    <Input type="email" placeholder="your email address" { ...field } className="h-9 text-sm" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              ) }
                            />
                            <div>
                              { errors.email?.message && (
                                <p className='mt-1 text-xs text-red-500'>
                                  { errors.email.message }
                                </p>
                              ) }
                            </div>
                          </div>
                          <div className="relative pb-1">
                            <FormField
                              control={ form.control }
                              name="password"
                              render={ ({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs font-bold uppercase tracking-wide text-slate-700">Password</FormLabel>
                                  <FormControl>
                                    <Input type={ showNewPassword ? "text" : "password" } placeholder="8+ chars, upper/lower, number, symbol, no spaces" { ...field } className="h-9 pr-10 text-sm" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              ) }
                            />
                            <div>
                              { errors.password?.message && (
                                <p className='mt-1 text-xs text-red-500'>
                                  { errors.password.message }
                                </p>
                              ) }
                            </div>

                            <Button type="button" variant="ghost" size="sm"
                              className="absolute right-1 top-6 h-8 px-2 hover:bg-transparent"
                              onClick={ () => setShowNewPassword((prev) => !prev) }
                            >
                              { showNewPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              ) }
                            </Button>
                          </div>

                          <div className="relative pb-1">
                            <FormField
                              control={ form.control }
                              name="passwordConfirm"
                              render={ ({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs font-bold uppercase tracking-wide text-slate-700">Confirm Password</FormLabel>
                                  <FormControl>
                                    <Input type={ showConfirmPassword ? "text" : "password" } placeholder="Must match password" { ...field } className="h-9 pr-10 text-sm" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              ) }
                            />
                            <Button type="button" variant="ghost" size="sm"
                              className="absolute right-1 top-6 h-8 px-2 hover:bg-transparent"
                              onClick={ () => setShowConfirmPassword((prev) => !prev) }
                            >
                              { showConfirmPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              ) }
                            </Button>
                            <div>
                              { errors.passwordConfirm?.message && (
                                <p className='mt-1 text-xs text-red-500'>
                                  { errors.passwordConfirm.message }
                                </p>
                              ) }
                            </div>
                          </div>
                        </fieldset>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-center">
                      <div className="grid grid-cols-2 gap-2 p-1 sm:flex sm:justify-end sm:p-2">
                        <Link href="/family-setup-home">
                          <Button type="button" variant="outline" className="w-full border-[#59cdf7] text-[#005472] hover:bg-[#dff6ff] md:w-auto text-xs md:text-sm">
                            <CircleArrowLeft className="mr-1 h-4 w-4" />
                            Back
                          </Button>
                        </Link>
                        <Button
                          type="button"
                          onClick={ next }
                          className="w-full bg-[#59cdf7] hover:bg-[#9de4fe] text-black font-semibold md:w-auto text-xs md:text-sm"
                          disabled={ currentStep === steps.length - 1 }
                        >
                          Next
                          <CircleArrowRight className="ml-1 h-4 w-4" />
                        </Button>

                      </div>
                    </CardFooter>

                  </>) }
                { currentStep === STEP_2_FAMILY_NAME && (
                  <>
                    <div className="grid grid-cols-1 gap-3">
                      <CardDescription>
                        <div className="flex flex-col items-start gap-2 rounded-lg border border-slate-200 bg-white px-3 py-3 sm:flex-row sm:items-center sm:gap-3 sm:px-4">
                          <img src="/icons/bluering2.png" alt="step 2" className="aspect-auto object-cover h-9 w-9 sm:h-10 sm:w-10" />
                          <h3 className="font-extrabold text-sm sm:text-base">
                            Assign Family Name
                          </h3>
                          <HoverCard openDelay={ 10 } closeDelay={ 100 }>
                            <HoverCardTrigger asChild>
                              <Button type="button" className='w-auto text-xs md:text-sm' variant="link">Assign a unique Family Name. </Button>
                            </HoverCardTrigger>
                            <HoverCardContent side='top' className="flex w-50 md:w-120 flex-col gap-0.5">
                              <div className="flex items-center gap-1" >
                                <CircleCheck size={ 6 } className="md:h-10 md:w-10 text-green-500" />
                                <p className='text-xs p-1 sm:text-sm'>It is case sensitive; used when you login.</p>
                              </div>
                              <div className="flex items-center gap-1" >
                                <CircleSlash size={ 6 } className="md:h-10 md:w-10 text-red-500" />
                                <p className='text-xs p-1 sm:text-sm'>&quot;TexasJonesFamily&quot; is not the same as &quot;texasjonesfamily&quot;</p>
                              </div>
                              <div className="flex items-center gap-1" >
                                <CircleCheck size={ 6 } className="md:h-10 md:w-10 text-green-500" />
                                <p className='text-xs p-1 sm:text-sm'>It must be 10-30 letters long.</p>
                              </div>
                              <div className="flex items-center gap-1" >
                                <CircleSlash size={ 6 } className="md:h-10 md:w-10 text-red-500" />
                                <p className='text-xs p-1 sm:text-sm'>Numbers, special characters, and spaces are <u>not</u> allowed.</p>
                              </div>
                            </HoverCardContent>
                          </HoverCard>
                        </div>
                      </CardDescription>
                      <CardContent className="flex items-center justify-center gap-4 px-4 md:px-6">
                        <div className="w-full max-w-xl">
                          <fieldset className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                            <div className='relative pb-3'>
                              <FormField
                                control={ form.control }
                                name="familyName"
                                render={ ({ field }) => (
                                  <FormItem>
                                    <FormLabel className="font-extrabold">Family Name</FormLabel>
                                    <FormControl>
                                      <Input { ...field }
                                        onChange={ (event) => {
                                          // The Field onChange must run first!
                                          field.onChange(event);

                                          // Custom onChange logic to check for uniqueness and update familyNameGood state
                                          setFamilyNameGood(false);
                                          const search = event.target.value.toLowerCase();

                                          // We don't care until at least the minimum length is reached, but if it is, we can check for uniqueness and provide feedback to the user in real time as they type.
                                          if (search.length < 10) {
                                            return;
                                          };

                                          const schema = z.string().regex(
                                            noSpacesOrSpecialCharsRegex,
                                            "Family Name must not contain any spaces or special characters."
                                          );
                                          try {
                                            schema.parse(search);
                                          } catch (error) {
                                            return error;
                                          }
                                          // console.log("onChange->search: ", search);
                                          const [filteredName] = familyNames?.filter((name) => name.toLowerCase().includes(search));
                                          let lowerFilteredName: string = "";
                                          if (filteredName) {
                                            lowerFilteredName = filteredName.toLowerCase();
                                          }
                                          // console.log("onChange->lowerFilteredName: ", lowerFilteredName);
                                          if (lowerFilteredName === search) {
                                            // console.log("onChange->not unique! ");
                                            setFamilyNameGood(false);
                                          } else {
                                            // console.log("onChange->it is unique! ");
                                            setFamilyNameGood(true);
                                          }

                                        } }
                                        placeholder="Will be checked for uniqueness"
                                        className="h-9 w-full text-center text-sm" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                ) }
                              />
                              <div className="absolute bottom">
                                { errors.familyName?.message && (
                                  <p className='mt-2 text-xs text-center text-red-400'>
                                    { errors.familyName.message }
                                  </p>
                                ) }
                              </div>
                              <div>
                                { familyNameGood ? (<CircleCheckBig className="absolute left-[20] top-8 h-5 w-5 text-green-500" />)
                                  : (<CircleSlash2 className="absolute left-[20] top-8 h-5 w-5 text-red-500" />) }
                              </div>
                            </div>
                          </fieldset>
                        </div>

                      </CardContent>
                    </div>
                    <CardFooter className="flex justify-center">
                      <div className="grid grid-cols-2 gap-2 p-1 sm:flex sm:justify-end sm:p-2">
                        <Button type="button" onClick={ prev } variant="outline" className="w-full border-[#59cdf7] text-[#005472] hover:bg-[#dff6ff] md:w-auto text-xs md:text-sm">
                          <CircleArrowLeft className="mr-1 h-4 w-4" />
                          Back
                        </Button>
                        <Button
                          type="button"
                          onClick={ next }
                          className="w-full bg-[#59cdf7] hover:bg-[#9de4fe] text-black font-semibold md:w-auto text-xs md:text-sm"
                          disabled={ currentStep === steps.length - 1 || !familyNameGood }
                        >
                          Next
                          <CircleArrowRight className="ml-1 h-4 w-4" />
                        </Button>
                      </div>
                    </CardFooter>

                  </>) }
                { currentStep === STEP_3_INVITE_MEMBERS && (
                  <>
                    <div className="grid grid-cols-1 gap-3">
                      <CardDescription>
                        <div className="flex flex-col items-start gap-2 rounded-lg border border-slate-200 bg-white px-3 py-3 sm:flex-row sm:items-center sm:gap-3 sm:px-4">
                          <img src="/icons/bluering3.png" alt="step 3" className="aspect-auto object-cover h-9 w-9 sm:h-10 sm:w-10" />
                          <h3 className="font-extrabold text-sm sm:text-base">
                            Invite Family
                          </h3>
                          <p className='text-xs leading-5 text-slate-700 sm:text-sm'>Emails will be used to send invitations to family and friends. Add people to the list below, then continue to confirmation.</p>
                        </div>
                      </CardDescription>
                      <CardContent className="space-y-3 px-4 pt-3 md:px-6">

                        <NewInvitesDialog
                          newInvites={ members }
                          onAddInvite={ handleAddMember }
                          onRemoveInvite={ handleRemoveMember }
                        />

                        <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
                          <p className="mb-3 text-sm font-semibold text-neutral-800">Invited Members ({ members.length })</p>
                          { members.length === 0 ? (
                            <p className="text-sm text-neutral-500">No family members added yet.</p>
                          ) : (
                            <ul className="grid grid-cols-2 gap-2 md:grid-cols-3">
                              { members.map((member) => (
                                <li key={ member.id } className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                  <p className="text-sm font-medium text-neutral-900">{ member.firstName } { member.lastName }</p>
                                  <p className="text-xs text-neutral-600">{ member.email }</p>
                                  { member.inviteFounderMessage && (
                                    <p className="mt-1 text-xs italic text-neutral-500">{ member.inviteFounderMessage }</p>
                                  ) }
                                </li>
                              )) }
                            </ul>
                          ) }
                        </div>

                        { memberEmailValidationError && (
                          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600">{ memberEmailValidationError }</p>
                        ) }

                      </CardContent>
                      <CardFooter className="flex justify-center">
                        <div className="grid grid-cols-2 gap-2 p-1 sm:flex sm:justify-end sm:p-2">
                          <Button type="button" onClick={ prev } variant="outline" className="w-full border-[#59cdf7] text-[#005472] hover:bg-[#dff6ff] md:w-auto text-xs md:text-sm">
                            <CircleArrowLeft className="mr-1 h-4 w-4" />
                            Back
                          </Button>
                          <Button
                            type="button"
                            onClick={ next }
                            className="w-full bg-[#59cdf7] hover:bg-[#9de4fe] text-black font-semibold md:w-auto text-xs md:text-sm"
                            disabled={ members.length === 0 }
                          >
                            Next
                            <CircleArrowRight className="ml-1 h-4 w-4" />
                          </Button>
                        </div>
                      </CardFooter>
                    </div>

                  </>) }
                { currentStep === STEP_4_CREATE_FAMILY_SITE && (
                  <div className="font-app px-4 py-2 sm:px-6 md:px-8">
                    <div className="mx-auto max-w-5xl">
                      <CardDescription className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-xs leading-5 text-neutral-700 sm:px-4 sm:text-sm">
                        Review each section before you create your family and send invitations.
                      </CardDescription>

                      <CardContent className="space-y-4 pt-3">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
                            <div className="mb-3 flex items-center gap-2">
                              <img src="/icons/bluering1.png" alt="step 1" className="h-10 w-10 object-cover opacity-70 md:h-12 md:w-12" />
                              <div>
                                <p className="text-[11px] font-bold uppercase tracking-wide text-[#0f6080]">Step 1</p>
                                <p className="text-sm font-bold text-neutral-900">Founder Details</p>
                                <p className="text-xs text-neutral-600">Account owner information and credentials</p>
                              </div>
                            </div>

                            <div className="space-y-2 text-xs text-neutral-800 sm:text-sm">
                              <p><span className="font-semibold">Name:</span> { form.getValues('firstName') } { form.getValues('lastName') }</p>
                              <p><span className="font-semibold">Nickname:</span> { form.getValues('nickName') || 'None provided' }</p>
                              <p className="break-all"><span className="font-semibold">Email:</span> { form.getValues('email') }</p>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">Password:</span>
                                <input
                                  className="w-full max-w-56 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs"
                                  type={ showNewPassword ? "text" : "password" }
                                  value={ form.getValues('password') }
                                  disabled
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 px-0"
                                  onClick={ () => setShowNewPassword((prev) => !prev) }
                                >
                                  { showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" /> }
                                </Button>
                              </div>
                            </div>
                          </section>

                          <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
                            <div className="mb-3 flex items-center gap-2">
                              <img src="/icons/bluering2.png" alt="step 2" className="h-10 w-10 object-cover opacity-70 md:h-12 md:w-12" />
                              <div>
                                <p className="text-[11px] font-bold uppercase tracking-wide text-[#0f6080]">Step 2</p>
                                <p className="text-sm font-bold text-neutral-900">Family Name</p>
                                <p className="text-xs text-neutral-600">Unique family identity for sign in</p>
                              </div>
                            </div>

                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Selected Name</p>
                              <p className="mt-1 break-all text-sm font-bold text-neutral-900">{ form.getValues('familyName') }</p>
                            </div>
                          </section>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-[2fr_1fr]">
                          <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
                            <div className="mb-3 flex items-center gap-2">
                              <img src="/icons/bluering3.png" alt="step 3" className="h-10 w-10 object-cover opacity-70 md:h-12 md:w-12" />
                              <div>
                                <p className="text-[11px] font-bold uppercase tracking-wide text-[#0f6080]">Step 3</p>
                                <p className="text-sm font-bold text-neutral-900">Invitations</p>
                                <p className="text-xs text-neutral-600">Invited family and friends ({ members.length })</p>
                              </div>
                            </div>

                            { members.length === 0 ? (
                              <p className="text-sm text-neutral-500">No members invited yet.</p>
                            ) : (
                              <ul className="grid grid-cols-2 gap-2">
                                { members.map((member) => (
                                  <li key={ member.id } className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                    <p className="text-sm font-medium text-neutral-900">{ member.firstName } { member.lastName }</p>
                                    <p className="break-all text-xs text-neutral-600">{ member.email }</p>
                                    { member.inviteFounderMessage && (
                                      <p className="mt-1 text-xs italic text-neutral-500">{ member.inviteFounderMessage }</p>
                                    ) }
                                  </li>
                                )) }
                              </ul>
                            ) }
                          </section>

                          <section className="rounded-xl border-2 border-[#59cdf7] bg-[#e8f8ff] p-3 shadow-sm sm:p-4">
                            <div className="mb-2 flex items-center gap-2">
                              <img src="/icons/bluering4.png" alt="step 4" className="h-10 w-10 object-cover md:h-12 md:w-12" />
                              <div>
                                <p className="text-[11px] font-bold uppercase tracking-wide text-[#0f6080]">Step 4</p>
                                <p className="text-sm font-bold text-neutral-900">Final Confirmation</p>
                                <p className="text-xs text-neutral-700">Create family and send invites</p>
                              </div>
                            </div>

                            <p className="text-xs leading-5 text-neutral-800">
                              Use the <b>Back</b> below to edit any previous step before confirming.
                            </p>
                            <p className="mt-2 text-xs leading-5 text-neutral-800">
                              When you select <b>Create Family</b> below, the family is created and then invitation emails are sent from <b>My Family Social</b>.
                            </p>
                            {/* <p className="mt-2 text-xs leading-5 text-neutral-800">
                              After sign-in, check <b>Mail Box</b> for a founder-only next-steps message.
                            </p> */}
                          </section>
                        </div>
                      </CardContent>

                      <CardFooter className="flex justify-center">
                        <div className="grid grid-cols-2 gap-2 p-2 sm:flex sm:justify-end">
                          <Button type="button" onClick={ prev } variant="outline" className="w-full border-[#59cdf7] text-[#005472] hover:bg-[#dff6ff] md:w-auto text-xs md:text-sm">
                            <CircleArrowLeft className="mr-1 h-4 w-4" />
                            Back
                          </Button>
                          <Button type="submit" className="w-full bg-[#59cdf7] hover:bg-[#9de4fe] text-black font-semibold md:w-auto text-xs md:text-sm">
                            Create Family
                            <CircleCheckBig className="ml-1 h-4 w-4" />
                          </Button>
                        </div>
                      </CardFooter>
                    </div>
                  </div>
                ) }
              </form>
            </Form>
          </Card>

        </div >
      </div >

      {/* Status Dialog */ }
      <StatusUpdateDialog
        open={ showStatusDialog }
        onOpenChange={ setShowStatusDialog }
        redirectUrl={ "/login" }
        submissionSteps={ submissionSteps }
      />
    </>
  );
}
