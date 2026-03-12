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
import { AccountDetails, UpdateAccountDetails } from "@/features/auth/auth-types";
import { updateMemberDetailsDml } from "@/components/db/sql/queries-family-member";
import { toast } from "sonner";
import { Router } from "next/router";
import { redirect, useRouter } from "next/navigation";

const formSchema = z
  .object({
    firstName: z.string(),
    lastName: z.string(),
    nickName: z.string(),
    birthday: z.string(),
    cellPhone: z.string(),
    mfaActive: z.boolean(),
  });

export default function AccountDetailsForm({ accountDetails }: AccountDetails) {

  const [open, setOpen] = useState(false);
  const [dateNotDirty, setDateNotDirty] = useState(true);
  const { userId, memberId, firstName, lastName, nickName, birthday, cellPhone, mfaActive } = accountDetails;
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
        position: "bottom-center",
        duration: 3000,
      });
      return;
    }
    // router.push('/');
    toast.success("Your account details have been updated", {
      position: "bottom-center",
      duration: 3000,
    });
  };

  function resetForm() {
    form.reset()
    setDateNotDirty(true);
  }

  return (
    <Form { ...form }>
      <form onSubmit={ form.handleSubmit(handleFormSubmit) }>
        <div className="grid sm:grid-cols-1">
          <fieldset disabled={ form.formState.isSubmitting } className="grid sm:grid-cols-3 gap-x-1 gap-y-3 border-[1] rounded-2xl p-3">
            <FormField
              control={ form.control }
              name="firstName"
              render={ ({ field }) => (
                <FormItem>
                  <FormLabel className="font-extrabold">First Name</FormLabel>
                  <FormControl>
                    <Input { ...field } value={ field.value } type="text" className="text-xs font-extralight" />
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
                  <FormLabel className="font-extrabold">Last Name</FormLabel>
                  <FormControl>
                    <Input { ...field } type="text" value={ field.value ?? '' } className="text-xs font-extralight" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              ) }
            />
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
          </fieldset>
          <div className="p-2"></div>
          <fieldset disabled={ form.formState.isSubmitting } className="grid sm:grid-cols-3 gap-x-1 gap-y-3 border-[1] rounded-2xl p-3">
            <FormField
              control={ form.control }
              name="cellPhone"
              render={ ({ field }) => (
                <FormItem>
                  <FormLabel className="font-extrabold">Cell Phone</FormLabel>
                  <FormControl>
                    <Input { ...field } type="text" value={ field.value ?? '' } className="text-xs font-extralight" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              ) }
            />
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
                  <FormMessage />
                </FormItem>
              ) }
            />
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