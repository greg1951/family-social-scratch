'use client';

import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useRouter } from 'next/navigation';

import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { CircleCheck, CircleArrowRight, Eye, EyeOff, CircleX } from "lucide-react";
import { MemberRegistrationSchema } from '@/features/family/components/validation/schema';
import { passwordSchema } from '@/features/auth/components/validation/passwordSchema';
import { addMemberCreds, addRegisteredMember } from './actions';
import { SubmissionStep } from '@/features/family/types/family-steps';
import { initialRegistrationSteps } from '@/features/family/constants/family-steps';
import { StatusUpdateDialog } from '@/app/(family)/family-setup/family-setup-dialogs/status-update-dialog';

const formSchema = z.object({
  firstName: z.string().min(2, { message: "First name is required" }),
  lastName: z.string().min(2, { message: "Last name is required" }),
  nickName: z.string().optional(),
  phone: z.string().min(14).max(14).or(z.string().max(0)),
  password: passwordSchema,
  passwordConfirm: z.string(),
}).refine((data) => data.password === data.passwordConfirm, {
  message: "Passwords don't match",
  path: ["passwordConfirm"],
});

function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 3)
    return digits;
  if (digits.length <= 6)
    return `(${ digits.slice(0, 3) }) ${ digits.slice(3) }`;
  return `(${ digits.slice(0, 3) }) ${ digits.slice(3, 6) }-${ digits.slice(6) }`;
}

export default function FamilyMemberRegistrationForm({ email, firstName, lastName, familyName, familyId }
  : { email: string; firstName: string; lastName: string; familyName: string; familyId: number; }) {

  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submissionSteps, setSubmissionSteps] =
    useState<SubmissionStep[]>(initialRegistrationSteps);
  const [showStatusDialog, setShowStatusDialog] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: firstName,
      lastName: lastName,
      nickName: "",
      phone: "",
      password: "",
      passwordConfirm: "",
    }
  });

  const { formState: { isDirty, dirtyFields } } = form;

  const updateStepStatus = (stepId: number, status: SubmissionStep['status'], errorMessage?: string) => {
    setSubmissionSteps(prev =>
      prev.map(step =>
        step.id === stepId
          ? { ...step, status, errorMessage }
          : step
      )
    );
  };

  const handleFormSubmit = async (data: z.infer<typeof formSchema>) => {
    console.log("MemberRegistration->SubmitHandler->Form data: ", data);
    console.log("MemberRegistration->SubmitHandler->Dirty: ", dirtyFields);
    // Show status dialog
    setShowStatusDialog(true);
    try {

      // Step 1: Create Member
      updateStepStatus(1, 'inProgress');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      // const registeredMember = {
      //   ...data, email, familyId: familyId, isFounder: false
      // };

      // const addMemberResult = await addRegisteredMember(registeredMember);
      // if (!addMemberResult.success) {
      //   const message = "Error occurred registering the new family member"
      //   updateStepStatus(1, 'error', message);
      //   throw new Error(message);
      // }
      updateStepStatus(1, 'completed');

      // Step 2: Create Member Credentials
      updateStepStatus(2, 'inProgress');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      // const addMemberCredsResult = await addMemberCreds(registeredMember, addMemberResult.id);
      // if (!addMemberCredsResult.success) {
      //   const message = "Error occurred creating member credentials";
      //   updateStepStatus(2, 'error', message);
      //   throw new Error(message);
      // }
      updateStepStatus(2, 'completed');

      updateStepStatus(3, 'inProgress');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      updateStepStatus(3, 'completed');


      form.reset(data);

    } catch (error) {
      console.error('Error registering family member:', error);
      const currentStepInProgress = submissionSteps.find(s => s.status === 'inProgress');
      if (currentStepInProgress) {
        updateStepStatus(currentStepInProgress.id, 'error', 'An error occurred during this step');
      }
    }
  }

  const handleReset = () => {
    form.reset();
  }


  return (
    <>
      <Form { ...form }>
        <form onSubmit={ form.handleSubmit(handleFormSubmit) } className="space-y-4">

          <>
            <CardContent className="pt-1 ">
              <div className="grid sm:grid-cols-1 pb-3">
                <fieldset disabled={ form.formState.isSubmitting } className="grid sm:grid-cols-3 gap-x-1 gap-y-3 border-[1] rounded-2xl p-[15]">
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
                        </FormItem>
                      ) }
                    />
                    <div className="absolute bottom">
                      { form.formState.errors.firstName?.message && (
                        <p className='mt-2 text-xs text-center text-red-400'>
                          { form.formState.errors.firstName.message }
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
                        </FormItem>
                      ) }
                    />
                    <div className="absolute bottom">
                      { form.formState.errors.lastName?.message && (
                        <p className='mt-2 text-xs text-center text-red-400'>
                          { form.formState.errors.lastName.message }
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
                        </FormItem>
                      ) }
                    />
                    { form.formState.errors.nickName?.message && (
                      <p className='mt-2 text-sm text-red-400'>
                        { form.formState.errors.nickName.message }
                      </p>
                    ) }
                  </div>
                </fieldset>
              </div>

              <div className="grid sm:grid-cols-1 pb-3">
                <fieldset disabled={ form.formState.isSubmitting } className="grid sm:grid-cols-3 gap-x-1 gap-y-3 border-[1] rounded-2xl p-[15]">
                  <div className='w-auto'>
                    <FormField
                      control={ form.control }
                      name="phone"
                      render={ ({ field }) => (
                        <FormItem>
                          <FormLabel className="font-extrabold">Cell Phone</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="(000) 000-0000"
                              { ...field }
                              onChange={ (event) => field.onChange(formatPhoneNumber(event.target.value)) }
                              inputMode="numeric"
                              maxLength={ 14 }
                              className="text-xs font-extralight"
                            />
                          </FormControl>
                        </FormItem>
                      ) }
                    />
                    <div className="absolute bottom">
                      { form.formState.errors.phone?.message && (
                        <p className='mt-2 text-xs text-center text-red-400'>
                          { form.formState.errors.phone.message }
                        </p>
                      ) }
                    </div>
                  </div>
                  <div className="relative pb-3">
                    <FormField
                      control={ form.control }
                      name="password"
                      render={ ({ field }) => (
                        <FormItem>
                          <FormLabel className="font-extrabold">Password</FormLabel>
                          <FormControl>
                            <Input type={ showNewPassword ? "text" : "password" } placeholder="5 or more letters" { ...field } className="text-xs font-extralight" />
                          </FormControl>
                        </FormItem>
                      ) }
                    />
                    <div className="absolute bottom">
                      <p className='mt-2 text-xs text-center text-red-400'>
                        { form.formState.errors?.password?.message }
                      </p>

                    </div>

                    <Button type="button" variant="ghost" size="sm"
                      className="absolute right-0 top-1 h-full px-3 py-2 hover:bg-transparent"
                      onClick={ () => setShowNewPassword((prev) => !prev) }
                    >
                      { showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      ) }
                    </Button>
                  </div>

                  <div className="relative pb-3">
                    <FormField
                      control={ form.control }
                      name="passwordConfirm"
                      render={ ({ field }) => (
                        <FormItem>
                          <FormLabel className="font-extrabold">Confirm Password</FormLabel>
                          <FormControl>
                            <Input type={ showConfirmPassword ? "text" : "password" } placeholder="Match password" { ...field } className="text-xs font-extralight" />
                          </FormControl>
                        </FormItem>
                      ) }
                    />
                    <Button type="button" variant="ghost" size="sm"
                      className="absolute right-0 top-1 h-full px-3 py-2 hover:bg-transparent"
                      onClick={ () => setShowConfirmPassword((prev) => !prev) }
                    >
                      { showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      ) }
                    </Button>
                    <div className="absolute bottom">
                      { form.formState.errors.passwordConfirm?.message && (
                        <p className='mt-2 text-xs text-center text-red-400'>
                          { form.formState.errors.passwordConfirm.message }
                        </p>
                      ) }
                    </div>
                  </div>
                </fieldset>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center">
              <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end p-2">
                <Button
                  type="reset" className="w-full border-[#59cdf7] text-black hover:bg-[#9de4fe] font-semibold md:w-auto text-xs md:text-sm"
                  disabled={ !isDirty || isLoading ? true : false } onClick={ handleReset }>
                  <CircleX className="mr-1 h-4 w-4 text-red-400" />
                  { isLoading ? 'Saving Member info...' : 'Reset' }
                </Button>
                <Button
                  type="submit"
                  className="w-full bg-[#59cdf7] hover:bg-[#9de4fe] text-black font-semibold md:w-auto text-xs md:text-sm"
                  disabled={ !isDirty || isLoading ? true : false }>
                  { isLoading ? 'Saving Member info...' : 'Submit' }
                  <CircleCheck className="ml-1 h-4 w-4 text-blue-700" />
                </Button>

              </div>
            </CardFooter>
          </>
        </form>
      </Form>
      {/* Status Dialog */ }
      <StatusUpdateDialog
        open={ showStatusDialog }
        onOpenChange={ setShowStatusDialog }
        submissionSteps={ submissionSteps }
      />
    </>

  )

}