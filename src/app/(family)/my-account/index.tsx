'use client';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import z from "zod";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useState } from "react";
import { AccountDetails, UpdateAccountDetails } from "@/features/auth/types/auth-types";
import { updateMemberDetailsDml } from "@/components/db/sql/queries-family-member";
import { toast } from "sonner";
import { Router } from "next/router";
import { redirect, useRouter } from "next/navigation";

const formSchema = z
  .object({
    firstName: z.string().min(2, { message: "First name is required" }),
    lastName: z.string().min(2, { message: "Last name is required" }),
    nickName: z.string().optional(),
    birthday: z.string().min(10).max(10).or(z.string().max(0)),
    cellPhone: z.string().min(14).max(14).or(z.string().max(0)),
    mfaActive: z.boolean(),
  });


export default function AccountDetailsForm({ accountDetails }: { accountDetails: AccountDetails }) {

  const [open, setOpen] = useState(false);
  const [dateNotDirty, setDateNotDirty] = useState(true);
  const { userId, memberId, firstName, lastName, nickName, birthday, cellPhone, mfaActive } = accountDetails.accountDetails;
  const [date, setDate] = useState<Date>(new Date(birthday as string));
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: firstName,
      lastName: lastName,
      nickName: nickName,
      birthday: birthday,
      cellPhone: cellPhone,
      mfaActive: mfaActive,
    },
  });
  const { formState: { isDirty, dirtyFields } } = form;

  const handleFormSubmit = async (data: z.infer<typeof formSchema>) => {

    const calendarBirthday = date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
    const updateAccountDetails: UpdateAccountDetails = {
      userId: userId,
      memberId: memberId as number,
      firstName: data.firstName,
      lastName: data.lastName,
      nickName: data.nickName!,
      cellPhone: data.cellPhone!,
      birthday: calendarBirthday!,
    }
    const updateMemberResult = await updateMemberDetailsDml(updateAccountDetails);
    if (!updateMemberResult.success) {
      toast.error(updateMemberResult.message, {
        position: "top-center",
        duration: 500,
      });

      return;
    }
    // router.push('/');
    form.reset(data);
    toast.success("Your account details have been updated", {
      position: "top-center",
      duration: 3000,
    });
  };

  function resetForm() {
    form.reset()
    setDateNotDirty(true);
  }

  function formatPhoneNumber(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    if (digits.length <= 3)
      return digits;
    if (digits.length <= 6)
      return `(${ digits.slice(0, 3) }) ${ digits.slice(3) }`;
    return `(${ digits.slice(0, 3) }) ${ digits.slice(3, 6) }-${ digits.slice(6) }`;
  }

  return (
    <Form { ...form }>
      <form onSubmit={ form.handleSubmit(handleFormSubmit) }>
        <div className="grid sm:grid-cols-1">
          <fieldset disabled={ form.formState.isSubmitting } className="grid sm:grid-cols-3 gap-x-1 gap-y-3 border-[1] rounded-2xl p-[15]">
            <div className='pb-5 '>
              <FormField
                control={ form.control }
                name="firstName"
                render={ ({ field }) => (
                  <FormItem>
                    <FormLabel className="font-extrabold">First Name</FormLabel>
                    <FormControl>
                      <Input { ...field } value={ field.value } type="text" className="text-xs font-extralight" />
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
            <div className="pb-5 ">
              <FormField
                control={ form.control }
                name="lastName"
                render={ ({ field }) => (
                  <FormItem>
                    <FormLabel className="font-extrabold">Last Name</FormLabel>
                    <FormControl>
                      <Input { ...field } type="text" value={ field.value ?? '' } className="text-xs font-extralight" />
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

            <div className="pb-5 ">
              <FormField
                control={ form.control }
                name="nickName"
                render={ ({ field }) => (
                  <FormItem>
                    <FormLabel className="font-extrabold">Nick Name</FormLabel>
                    <FormControl>
                      <Input { ...field } type="text" value={ field.value ?? '' } className="text-xs font-extralight" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                ) }
              />
              <div className="absolute bottom">
                { form.formState.errors.nickName?.message && (
                  <p className='mt-2 text-xs text-center text-red-400'>
                    { form.formState.errors.nickName.message }
                  </p>
                ) }
              </div>
            </div>
          </fieldset>
          <div className="p-2"></div>
          <fieldset disabled={ form.formState.isSubmitting } className="grid sm:grid-cols-3 gap-x-1 gap-y-3 border-[1] rounded-2xl p-3">
            <div className="pb-5">
              <FormField
                control={ form.control }
                name="cellPhone"
                render={ ({ field }) => (
                  <FormItem>
                    <FormLabel className="font-extrabold">Cell Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="(000) 000-0000"
                        { ...field }
                        type="text"
                        value={ field.value ?? '' }
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
                { form.formState.errors.cellPhone?.message && (
                  <p className='mt-2 text-xs text-center text-red-400'>
                    { form.formState.errors.cellPhone.message }
                  </p>
                ) }
              </div>
            </div>
            <div className="pb-5">

              <FormField
                control={ form.control }
                name="birthday"
                render={ ({ field }) => (

                  <FormItem>
                    <FormLabel className="font-extrabold text-center">Birthday</FormLabel>
                    <Popover open={ open } onOpenChange={ setOpen }>
                      <PopoverTrigger className="flex justify-start">
                        <Button type="button" variant="outline" id="date" className="justify-start font-normal">
                          { date ? date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }) : "Select date" }
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={ date }
                          defaultMonth={ date }
                          captionLayout="dropdown"
                          onSelect={ (date) => {
                            setDate(date as Date)
                            setDateNotDirty(false)
                            setOpen(false)
                          } }
                        />
                      </PopoverContent>
                    </Popover>
                  </FormItem>
                ) }
              />
              <div className="absolute bottom">
                { form.formState.errors.birthday?.message && (
                  <p className='mt-2 text-xs text-center text-red-400'>
                    { form.formState.errors.birthday.message }
                  </p>
                ) }
              </div>
            </div>
            <div className="pb-5">
              <FormField
                control={ form.control }
                name="mfaActive"
                render={ ({ field }) => (
                  <FormItem>
                    <FormLabel className="font-extrabold">2FA</FormLabel>
                    <FormControl>
                      <Input disabled value={ mfaActive ? "Activated" : "Not Activated" } className="text-xs" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                ) }
              />
              <div className="absolute bottom">
                { form.formState.errors.birthday?.message && (
                  <p className='mt-2 text-xs text-center text-red-400'>
                    { form.formState.errors.birthday.message }
                  </p>
                ) }
              </div>
            </div>

          </fieldset>
          <div className="flex justify-center p-2 gap-2 ">
            <Button disabled={ (!isDirty && dateNotDirty) ? true : false } className=" text-xs" type="reset" onClick={ resetForm }>Reset</Button>
            <Button disabled={ (!isDirty && dateNotDirty) ? true : false } className=" text-xs" type="submit">Update Your Details</Button>
          </div>

        </div>
      </form>
    </Form >
  )
}