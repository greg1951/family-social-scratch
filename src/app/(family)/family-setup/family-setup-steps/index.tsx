'use client';

import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FamilyFormSchema } from '@/features/family/components/validation/schema';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { CheckCircle2, CircleSlash2, CircleArrowLeft, CircleArrowRight, CircleCheckBig, Eye, EyeOff, BadgeCheck, CircleSlash, CircleCheck } from "lucide-react";
import { useRouter } from 'next/navigation';
import { familySteps, noSpacesOrSpecialCharsRegex, STEP_1_FOUNDER, STEP_2_FAMILY_NAME, STEP_3_INVITE_MEMBERS, STEP_4_CREATE_FAMILY_SITE } from '@/features/family/constants/family-steps';
import { FamilyMember, InviteFamilyDialog } from '../family-setup-dialogs/invite-family-dialog';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'; import { StatusUpdateDialog } from '../family-setup-dialogs/status-update-dialog';
import { insertFamily, insertInvites, insertMember, insertUser } from '@/components/db/sql/queries-family-user';
import { initialSubmissionSteps } from '@/features/family/constants/family-steps';
import { SubmissionStep } from '@/features/family/types/family-steps';

type FormValues = z.infer<typeof FamilyFormSchema>;
const steps = familySteps;

export default function CreateFamilyAccountSteps({ familyNames }: { familyNames: string[] }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [previousStep, setPreviousStep] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [familyNameGood, setFamilyNameGood] = useState(false);

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status dialog state
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [submissionSteps, setSubmissionSteps] =
    useState<SubmissionStep[]>(initialSubmissionSteps);

  const { handleSubmit, reset, trigger, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(FamilyFormSchema)
  });

  type FieldName = keyof FormValues

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
      const insertFamilyResult = await insertFamily(values.familyName);
      if (!insertFamilyResult.success) {
        updateStepStatus(1, 'error', insertFamilyResult.message);
        throw new Error(insertFamilyResult.message);
      }
      // await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      updateStepStatus(1, 'completed');

      // Step 2: Create new Member entry
      updateStepStatus(2, 'inProgress');
      const insertMemberResult = await insertMember({
        email: values.email as string,
        firstName: values.firstName as string,
        lastName: values.lastName as string,
        nickName: values.nickName as string | undefined,
        familyId: insertFamilyResult.id as number,
        isFounder: true,
      });

      if (!insertMemberResult.success) {
        updateStepStatus(2, 'error', insertMemberResult.message);
        throw new Error(insertMemberResult.message);
      }
      updateStepStatus(2, 'completed');

      // Step 3: Add Founder credentials
      updateStepStatus(3, 'inProgress');
      const insertUserResult = await insertUser({
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

      // Step 4: Add invited family members
      const invitesInput = members.map((member) => (
        {
          firstName: member.firstName,
          lastName: member.lastName,
          email: member.email,
          familyId: insertFamilyResult.id as number
        }));

      updateStepStatus(4, 'inProgress');
      const insertInvitesResult = await insertInvites(invitesInput);
      if (!insertInvitesResult.success) {
        updateStepStatus(4, 'error', insertInvitesResult.message);
        throw new Error(insertInvitesResult.message);
      }
      updateStepStatus(4, 'completed');

      // Step 5: Send emails to join new Family Social family
      updateStepStatus(5, 'inProgress');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      // TODO: Implement actual email sending logic
      updateStepStatus(5, 'completed');

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
    reset(form.getValues());
    const fields = steps[currentStep].fields;
    const output = await trigger(fields as FieldName[], { shouldFocus: true })

    if (!output) return

    if (currentStep < steps.length - 1) {
      setPreviousStep(currentStep)
      setCurrentStep(step => step + 1)
    }
  }

  const prev = () => {
    if (currentStep > 0) {
      setPreviousStep(currentStep)
      setCurrentStep(step => step - 1)
    }
  }

  /* Handlers to add/remove members to the invited members list. */
  const [members, setMembers] = useState<FamilyMember[]>([])
  const handleAddMember = (values: Pick<FamilyMember, 'firstName' | 'lastName' | 'email'>) => {
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
                    Trial Account Setup
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
              <form onSubmit={ handleSubmit(processForm) } className="space-y-4">
                <div className="px-4 pt-4 md:px-6">
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                    { steps.map((step, index) => (
                      <div
                        key={ step.number }
                        className={ `rounded-md border px-2 py-2 text-center text-xs font-semibold md:text-sm ${ index === currentStep
                          ? 'border-[#59cdf7] bg-[#e6f8ff] text-[#005472]'
                          : index < currentStep
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-slate-200 bg-white text-slate-500'
                          }` }
                      >
                        <span className="inline-flex items-center gap-1">
                          { index < currentStep && <CheckCircle2 className="h-3.5 w-3.5" /> }
                          Step { step.number }
                        </span>
                      </div>
                    )) }
                  </div>
                </div>
                { currentStep === STEP_1_FOUNDER && (
                  <>
                    <div className="flex items-center justify-center gap-4">
                      <CardDescription>
                        <div className="flex items-center justify-center gap-2 pl-5 p-2">
                          <img src="/icons/bluering1.png" alt="step 1" className="aspect-auto object-cover h-10 w-10 md:h-15 md:w-15 " />
                          <h3 className="font-extrabold inline p-0 ">
                            Define Family Founder
                          </h3>
                          <p className='text-sm'>Register yourself as the family founder by providing your information and login credentials.</p>
                        </div>
                      </CardDescription>
                    </div>
                    <CardContent className="pt-1 ">
                      <div className="grid sm:grid-cols-1 ">
                        <fieldset disabled={ form.formState.isSubmitting } className="grid sm:grid-cols-3 gap-x-1 gap-y-3 border-[1] rounded-2xl  p-[35]">
                          <div className='pb-5'>
                            <FormField
                              control={ form.control }
                              name="firstName"
                              render={ ({ field }) => (
                                <FormItem>
                                  <FormLabel className="font-extrabold">First Name</FormLabel>
                                  <FormControl>
                                    <Input { ...field } placeholder="John" className="text-xs font-extralight" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              ) }
                            />
                            <div className="absolute bottom">
                              { errors.firstName?.message && (
                                <p className='mt-2 text-xs text-center text-red-400'>
                                  { errors.firstName.message }
                                </p>
                              ) }
                            </div>
                          </div>
                          <div className='pb-5'>
                            <FormField
                              control={ form.control }
                              name="lastName"
                              render={ ({ field }) => (
                                <FormItem>
                                  <FormLabel className="font-extrabold">Last Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Doe" { ...field } className="text-xs font-extralight" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              ) }
                            />
                            <div className="absolute bottom">
                              { errors.lastName?.message && (
                                <p className='mt-2 text-xs text-center text-red-400'>
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
                                  <FormLabel className="font-extrabold italic">Nickname</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Optional" { ...field } className="text-xs font-extralight" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              ) }
                            />
                            { errors.nickName?.message && (
                              <p className='mt-2 text-sm text-red-400'>
                                { errors.nickName.message }
                              </p>
                            ) }
                          </div>
                        </fieldset>
                      </div>

                      <div className="grid sm:grid-cols-1">
                        <fieldset disabled={ form.formState.isSubmitting } className="grid sm:grid-cols-3 gap-x-1 border-[1] rounded-2xl p-[35]">
                          <div className='pb-7'>
                            <FormField
                              control={ form.control }
                              name="email"
                              render={ ({ field }) => (
                                <FormItem>
                                  <FormLabel className="font-extrabold">Founder's Email</FormLabel>
                                  <FormControl>
                                    <Input type="email" placeholder="john@example.com" { ...field } className="text-xs font-extralight" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              ) }
                            />
                            <div className="absolute bottom">
                              { errors.email?.message && (
                                <p className='mt-1 text-xs text-center text-red-400'>
                                  { errors.email.message }
                                </p>
                              ) }
                            </div>
                          </div>
                          <div className="relative pb-7">
                            <FormField
                              control={ form.control }
                              name="password"
                              render={ ({ field }) => (
                                <FormItem>
                                  <FormLabel className="font-extrabold">Password</FormLabel>
                                  <FormControl>
                                    <Input type={ showNewPassword ? "text" : "password" } placeholder="5 or more letters" { ...field } className="text-xs font-extralight" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              ) }
                            />
                            <div className="absolute bottom">
                              { errors.password?.message && (
                                <p className='mt-1 text-xs text-center text-red-400'>
                                  { errors.password.message }
                                </p>
                              ) }
                            </div>

                            <Button type="button" variant="ghost" size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={ () => setShowNewPassword((prev) => !prev) }
                            >
                              { showNewPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              ) }
                            </Button>
                          </div>

                          <div className="relative pb-7">
                            <FormField
                              control={ form.control }
                              name="passwordConfirm"
                              render={ ({ field }) => (
                                <FormItem>
                                  <FormLabel className="font-extrabold">Confirm Password</FormLabel>
                                  <FormControl>
                                    <Input type={ showConfirmPassword ? "text" : "password" } placeholder="Must match password" { ...field } className="text-xs font-extralight" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              ) }
                            />
                            <Button type="button" variant="ghost" size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={ () => setShowConfirmPassword((prev) => !prev) }
                            >
                              { showConfirmPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              ) }
                            </Button>
                            <div className="absolute bottom">
                              { errors.passwordConfirm?.message && (
                                <p className='mt-1 text-xs text-center text-red-400'>
                                  { errors.passwordConfirm.message }
                                </p>
                              ) }
                            </div>
                          </div>
                        </fieldset>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-center">
                      <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end p-2">
                        <Link href="/trial-home">
                          <Button variant="outline" className="w-full border-[#59cdf7] text-[#005472] hover:bg-[#dff6ff] md:w-auto text-xs md:text-sm">
                            <CircleArrowLeft className="mr-1 h-4 w-4" />
                            Back
                          </Button>
                        </Link>
                        <Button
                          onClick={ next }
                          className="w-full bg-[#59cdf7] hover:bg-[#9de4fe] text-black font-semibold md:w-auto text-xs md:text-sm"
                          disabled={ currentStep === steps.length - 1 || isLoading }
                        >
                          { isLoading ? 'Saving Founder info...' : 'Next' }
                          <CircleArrowRight className="ml-1 h-4 w-4" />
                        </Button>

                      </div>
                    </CardFooter>

                  </>) }
                { currentStep === STEP_2_FAMILY_NAME && (
                  <>
                    <div className="grid grid-cols-1 gap-4">
                      <CardDescription>
                        <div className="flex items-center justify-center gap-2 pl-5 p-2">
                          <img src="/icons/bluering2.png" alt="step 2" className="aspect-auto object-cover h-10 w-10 md:h-15 md:w-15 " />
                          <h3 className="font-extrabold inline p-0">
                            Assign Family Name
                          </h3>
                          <HoverCard openDelay={ 10 } closeDelay={ 100 }>
                            <HoverCardTrigger asChild>
                              <Button className='w-auto text-xs md:text-sm' variant="link">Assign a unique Family Name. </Button>
                            </HoverCardTrigger>
                            <HoverCardContent side='top' className="flex w-50 md:w-120 flex-col gap-0.5">
                              <div className="flex items-center gap-1" >
                                <CircleCheck size={ 6 } className="md:h-10 md:w-10 text-green-500" />
                                <p className='text-sm p-1'>It is case sensitive; used when you login.</p>
                              </div>
                              <div className="flex items-center gap-1" >
                                <CircleSlash size={ 6 } className="md:h-10 md:w-10 text-red-500" />
                                <p className='text-sm p-1'>"TexasJonesFamily" is not the same as "texasjonesfamily"</p>
                              </div>
                              <div className="flex items-center gap-1" >
                                <CircleCheck size={ 6 } className="md:h-10 md:w-10 text-green-500" />
                                <p className='text-sm p-1'>It must be 10-30 letters long.</p>
                              </div>
                              <div className="flex items-center gap-1" >
                                <CircleSlash size={ 6 } className="md:h-10 md:w-10 text-red-500" />
                                <p className='text-sm p-1'>Numbers, special characters, and spaces are <u>not</u> allowed.</p>
                              </div>
                            </HoverCardContent>
                          </HoverCard>
                        </div>
                      </CardDescription>
                      <CardContent className="flex items-center justify-center gap-4">
                        <div>
                          <fieldset className="grid sm:grid-cols-3 gap-x-1 gap-y-3 border-[1] rounded-2xl  p-[35]">
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
                                          console.log("onChange->search: ", search);
                                          const [filteredName] = familyNames?.filter((name) => name.toLowerCase().includes(search));
                                          let lowerFilteredName: string = "";
                                          if (filteredName) {
                                            lowerFilteredName = filteredName.toLowerCase();
                                          }
                                          console.log("onChange->lowerFilteredName: ", lowerFilteredName);
                                          if (lowerFilteredName === search) {
                                            console.log("onChange->not unique! ");
                                            setFamilyNameGood(false);
                                          } else {
                                            console.log("onChange->it is unique! ");
                                            setFamilyNameGood(true);
                                          }

                                        } }
                                        placeholder="Will be checked for uniqueness"
                                        className="text-xs text-center font-extralight w-[340]" />
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
                      <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end p-2">
                        <Button onClick={ prev } variant="outline" className="w-full border-[#59cdf7] text-[#005472] hover:bg-[#dff6ff] md:w-auto text-xs md:text-sm">
                          <CircleArrowLeft className="mr-1 h-4 w-4" />
                          Back
                        </Button>
                        <Button
                          onClick={ next }
                          className="w-full bg-[#59cdf7] hover:bg-[#9de4fe] text-black font-semibold md:w-auto text-xs md:text-sm"
                          disabled={ currentStep === steps.length - 1 || isLoading || !familyNameGood }
                        >
                          { isLoading ? 'Saving Founder info...' : 'Next' }
                          <CircleArrowRight className="ml-1 h-4 w-4" />
                        </Button>
                      </div>
                    </CardFooter>

                  </>) }
                { currentStep === STEP_3_INVITE_MEMBERS && (
                  <>
                    <div className="grid grid-cols-1 gap-4">
                      <CardDescription>
                        <div className="flex items-center justify-center gap-2 pl-5 p-2">
                          <img src="/icons/bluering3.png" alt="step 3" className="aspect-auto object-cover h-10 w-10 md:h-15 md:w-15 " />
                          <h3 className="font-extrabold inline p-0">
                            Invite Family
                          </h3>
                          <p className='text-sm'>Emails will be used to send invitations to family and friends. You will add them to the list below and when done, proceed to the confirmation step.</p>
                        </div>
                      </CardDescription>
                      <CardContent className="space-y-4 pt-5">

                        <InviteFamilyDialog
                          members={ members }
                          onAddMember={ handleAddMember }
                          onRemoveMember={ handleRemoveMember }
                        />

                        <div className="rounded-md border p-4">
                          <p className="mb-3 text-sm font-semibold text-neutral-800">Invited Members ({ members.length })</p>
                          { members.length === 0 ? (
                            <p className="text-sm text-neutral-500">No family members added yet.</p>
                          ) : (
                            <ul className="space-y-2">
                              { members.map((member) => (
                                <li key={ member.id } className="rounded-md border bg-neutral-50 px-3 py-2">
                                  <p className="text-sm font-medium text-neutral-900">{ member.firstName } { member.lastName }</p>
                                  <p className="text-xs text-neutral-600">{ member.email }</p>
                                </li>
                              )) }
                            </ul>
                          ) }
                        </div>

                      </CardContent>
                      <CardFooter className="flex justify-center">
                        <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end p-2">
                          <Button onClick={ prev } variant="outline" className="w-full border-[#59cdf7] text-[#005472] hover:bg-[#dff6ff] md:w-auto text-xs md:text-sm">
                            <CircleArrowLeft className="mr-1 h-4 w-4" />
                            Back
                          </Button>
                          <Button
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
                  <div className="font-app py-2 px-4 sm:px-6 md:px-8 font-sm">
                    <div className="max-w-2xl mx-auto">
                      <CardDescription className="text-neutral-800 text-xs px-4">
                        The information you provided is summarized below. Please review for accuracy before confirming to create your family site and send invitations.
                      </CardDescription>

                      <CardContent className="space-y-4 pt-5">
                        <div className="rounded-md border p-4">
                          <div className="mb-3 flex items-center gap-2">
                            <img src="/icons/bluering1.png" alt="step 1" className="aspect-auto object-cover h-10 w-10 md:h-15 md:w-15 opacity-60 " />
                            <div>
                              <span className="text-sm font-semibold text-neutral-800" >Family Founder Info: <br></br></span>
                              <span className="text-xs font-light text-neutral-800">
                                { form.getValues('email') }, { " " }
                                { form.getValues('firstName') } { " " } { form.getValues('lastName') }, { " " }
                                { form.getValues('nickName') ? `(${ form.getValues('nickName') })` : '(no nickname)' }
                              </span>
                              <div>
                                <span className="text-sm font-semibold text-neutral-800" >Family Founder Password: <br></br></span>
                                <div className='relative'>
                                  <input className='text-xs font-light text-neutral-800 ' type={ showNewPassword ? "text" : "password" } id="password" name="password" value={ form.getValues('password') } disabled></input>
                                  <Button type="button" variant="ghost" size="sm"
                                    className="absolute left-[-45] top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={ () => setShowNewPassword((prev) => !prev) }
                                  >
                                    { showNewPassword ? (
                                      <EyeOff className="h-4 w-4" />
                                    ) : (
                                      <Eye className="h-4 w-4" />
                                    ) }
                                  </Button>

                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-md border p-4">
                          <div className="mb-3 flex items-center gap-2">
                            <img src="/icons/bluering2.png" alt="step 2" className="aspect-auto object-cover h-10 w-10 md:h-15 md:w-15 opacity-60 " />
                            <p>
                              <span className="text-sm font-semibold text-neutral-800" >Selected Family Name: <br></br></span>
                              <span className="text-xs font-light text-neutral-800">{ form.getValues('familyName') }</span>
                            </p>
                          </div>
                        </div>

                        <div className="rounded-md border p-4">
                          <div className="mb-3 flex items-center gap-2">
                            <img src="/icons/bluering3.png" alt="step 3" className="aspect-auto object-cover h-10 w-10 md:h-15 md:w-15 opacity-60 " />
                            <p className="text-sm font-semibold text-neutral-800">Invited Family Members ({ members.length })</p>
                          </div>

                          { members.length === 0 ? (
                            <p className="text-sm text-neutral-500">No members invited yet.</p>
                          ) : (
                            <ul className="space-y-2">
                              { members.map((member) => (
                                <li key={ member.id } className="rounded-md border bg-neutral-50 px-3 py-2">
                                  <p className="text-sm font-medium text-neutral-900">{ member.firstName } { member.lastName }</p>
                                  <p className="text-xs text-neutral-600">{ member.email }</p>
                                </li>
                              )) }
                            </ul>
                          ) }
                        </div>

                        <div className="rounded-md border border-[#59cdf7] bg-[#e8f8ff] p-4">
                          <div className="mb-2 flex items-center gap-2">
                            <img src="/icons/bluering4.png" alt="step 4" className="aspect-auto object-cover h-10 w-10 md:h-15 md:w-15 opacity-100 " />
                            <p className="text-sm font-semibold text-neutral-900">Final Confirmation</p>
                          </div>

                          <p className="text-xs text-neutral-800">
                            If corrections need to be made, use the <b>Back</b> button to return to the step and update the information.<br></br><br></br>
                            Otherwise, <b>Confirm</b> these setup that will create your new Family Social site and send invitations to invited members.
                          </p>
                        </div>

                      </CardContent>
                      <CardFooter className="flex justify-center">
                        <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end p-2">
                          <Button onClick={ prev } variant="outline" className="w-full border-[#59cdf7] text-[#005472] hover:bg-[#dff6ff] md:w-auto text-xs md:text-sm">
                            <CircleArrowLeft className="mr-1 h-4 w-4" />
                            Back
                          </Button>

                          {/* <Button onClick={ submitForm } className="w-full bg-[#59cdf7] hover:bg-[#9de4fe] text-black font-semibold md:w-auto text-xs md:text-sm">
                            Create Family
                            <CircleCheckBig className="ml-1 h-4 w-4" />
                          </Button> */}
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
        submissionSteps={ submissionSteps }
      />
    </>
  );
}
