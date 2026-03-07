'use client';

import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { CircleArrowLeft, CircleArrowRight, CircleCheckBig, Eye, EyeOff } from "lucide-react";
import { TrialFormSchema } from '@/features/trial/components/validation/schema';
import { trialSteps } from '@/features/trial/components/trial-steps';
import { FamilyMember, InviteFamilyDialog } from '../trial-invite-family/invite-family-dialog';

type FormValues = z.infer<typeof TrialFormSchema>;
const steps = trialSteps;

// Define constants for step indices for better readability
const STEP_1_FOUNDER: number = 0; // Founder info
const STEP_2_FAMILY_NAME: number = 1; // Family Name
const STEP_3_INVITE_MEMBERS: number = 2; // Invite family members
const STEP_4_CREATE_FAMILY_SITE: number = 3; // Create family site

export default function Step1CreateAccount() {
  const [isLoading, setIsLoading] = useState(false);
  const [previousStep, setPreviousStep] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const delta = currentStep - previousStep;

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register, handleSubmit, watch, reset, trigger, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(TrialFormSchema)
  });

  type FieldName = keyof FormValues

  const form = useForm<FormValues>({
    resolver: zodResolver(TrialFormSchema),
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

  const processForm: SubmitHandler<FormValues> = async (values) => {
    console.log("processForm->values: ", values);
    reset();
  }

  const next = async () => {
    reset(form.getValues());
    console.log("next->currentStep: ", currentStep);
    const fields = steps[currentStep].fields;
    console.log("next->fields: ", fields);
    const output = await trigger(fields as FieldName[], { shouldFocus: true })
    console.log("next->output: ", output);

    if (!output) return

    if (currentStep < steps.length - 1) {
      if (currentStep === steps.length - 2) {
        await handleSubmit(processForm)()
      }
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


  return (
    <>
      <div className="font-app py-2 px-4 sm:px-6 md:px-8 h-[90vh]">
        <div className="max-w-2xl mx-auto">
          <Card className="flex align-top w-[400] md:w-[800]">
            <CardHeader className="text-base md:text-2xl bg-[#59cdf7] rounded-2xl text-center p-2">
              <div className="flex items-center justify-center gap-4">
                <CardTitle className="text-2xl md:text-3xl inline">
                  Trial Account Setup
                </CardTitle>
              </div>
            </CardHeader>
            <Form { ...form }>
              <form onSubmit={ handleSubmit(processForm) } className="space-y-6">
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
                        <div className="flex justify-center p-2 gap-2 ">
                          <Link href="/trial-home">
                            <Button variant="outline" className="md:w-auto bg-[#59cdf7] hover:bg-[#9de4fe]">
                              <CircleArrowLeft className="mr-1 h-4 w-4" />
                              Back
                            </Button>
                          </Link>

                          <Button
                            onClick={ next }
                            className="md:w-auto bg-[#59cdf7] hover:bg-[#9de4fe] text-black font-semibold"
                            disabled={ currentStep === steps.length - 1 || isLoading }
                          >
                            { isLoading ? 'Saving Founder info...' : 'Next' }
                            <CircleArrowRight className="ml-1 h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                    </CardContent>
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
                          <p className='text-sm'>Here find a unique family name. It must be 10-30 letters long, <u>no number, special characters or spaces</u></p>
                        </div>
                      </CardDescription>
                      <CardContent className="flex items-center justify-center gap-4">
                        <div>
                          <fieldset disabled={ form.formState.isSubmitting } className="grid sm:grid-cols-3 gap-x-1 gap-y-3 border-[1] rounded-2xl  p-[35]">
                            <div className='relative pb-3'>
                              <FormField
                                control={ form.control }
                                name="familyName"
                                render={ ({ field }) => (
                                  <FormItem>
                                    <FormLabel className="font-extrabold">Family Name</FormLabel>
                                    <FormControl>
                                      <Input { ...field } placeholder="Will be checked for uniqueness" className="text-xs text-center font-extralight w-[340]" />
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
                            </div>
                          </fieldset>
                        </div>

                      </CardContent>
                    </div>
                    <div className="flex justify-center p-2 gap-2 ">
                      {/* <Link href="/trial-home"> */ }
                      <Button onClick={ prev } variant="outline" className="md:w-auto bg-[#59cdf7] hover:bg-[#9de4fe]">
                        <CircleArrowLeft className="mr-1 h-4 w-4" />
                        Back
                      </Button>
                      {/* </Link> */ }
                      <Button
                        onClick={ next }
                        className="md:w-auto bg-[#59cdf7] hover:bg-[#9de4fe] text-black font-semibold"
                        disabled={ currentStep === steps.length - 1 || isLoading }
                      >
                        { isLoading ? 'Saving Founder info...' : 'Next' }
                        <CircleArrowRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
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

                        <div className="flex justify-center p-2 gap-2">
                          <Button onClick={ prev } variant="outline" className="md:w-auto bg-[#59cdf7] hover:bg-[#9de4fe]">
                            <CircleArrowLeft className="mr-1 h-4 w-4" />
                            Back
                          </Button>
                          <Button
                            onClick={ next }
                            className="md:w-auto bg-[#59cdf7] hover:bg-[#9de4fe] text-black font-semibold"
                            disabled={ members.length === 0 }
                          >
                            Next
                            <CircleArrowRight className="ml-1 h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
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
                            <img src="/icons/bluering1.png" alt="step 1" className="aspect-auto object-cover h-10 w-10 md:h-15 md:w-15 opacity-70 " />
                            <p>
                              <span className="text-sm font-semibold text-neutral-800" >Family Founder Info: <br></br></span>
                              <span className="text-xs font-light text-neutral-800">
                                { form.getValues('email') }, { " " }
                                { form.getValues('firstName') } { " " } { form.getValues('lastName') }, { " " }
                                { form.getValues('nickName') ? `(${ form.getValues('nickName') })` : '' }
                              </span>
                            </p>
                          </div>
                        </div>

                        <div className="rounded-md border p-4">
                          <div className="mb-3 flex items-center gap-2">
                            <img src="/icons/bluering2.png" alt="step 2" className="aspect-auto object-cover h-10 w-10 md:h-15 md:w-15 opacity-70 " />
                            <p>
                              <span className="text-sm font-semibold text-neutral-800" >Selected Family Name: <br></br></span>
                              <span className="text-xs font-light text-neutral-800">{ form.getValues('familyName') }</span>
                            </p>
                          </div>
                        </div>

                        <div className="rounded-md border p-4">
                          <div className="mb-3 flex items-center gap-2">
                            <img src="/icons/bluering3.png" alt="step 3" className="aspect-auto object-cover h-10 w-10 md:h-15 md:w-15 opacity-70 " />
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
                            <img src="/icons/bluering4.png" alt="step 4" className="aspect-auto object-cover h-10 w-10 md:h-15 md:w-15 " />
                            <p className="text-sm font-semibold text-neutral-900">Final Confirmation</p>
                          </div>

                          <p className="text-xs text-neutral-800">
                            If corrections need to be made use the <b>Back</b> button to return to the appropriate step and update the information.<br></br><br></br>
                            Otherwise, <b>Confirm</b> these details to create your new Family Social site and send family invitations.
                          </p>
                        </div>

                        <div className="flex justify-center p-2 gap-2">
                          <Button onClick={ prev } variant="outline" className="md:w-auto bg-[#59cdf7] hover:bg-[#9de4fe]">
                            <CircleArrowLeft className="mr-1 h-4 w-4" />
                            Back
                          </Button>

                          <Button onClick={ next } className="md:w-auto bg-[#59cdf7] hover:bg-[#9de4fe] text-black font-semibold">
                            Confirm and Create Family Site
                            <CircleCheckBig className="ml-1 h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </div>
                  </div>
                ) }
              </form>
            </Form>
          </Card>

        </div >
      </div ></>
  );
}
