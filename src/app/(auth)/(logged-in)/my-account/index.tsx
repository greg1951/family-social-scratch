'use client';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import z from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { getMemberDetails } from "./actions";


const formSchema = z
  .object({
    email: z.email(),
    family: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    nickName: z.string(),
    birthday: z.string(),
    cellPhone: z.string(),
    mfaActive: z.boolean(),
  });

interface AccountDetails {
  accountDetails: {
    email: string;
    familyName: string;
    userId: number;
    firstName: string;
    lastName: string;
    nickName: string;
    birthday: string;
    cellPhone: string;
    mfaActive: boolean;
  }
}


export default function AccountDetailsForm(props: AccountDetails) {
  const [open, setOpen] = useState(false);
  const { userId, firstName, lastName, nickName, birthday, cellPhone, mfaActive } = props.accountDetails;

  const [date, setDate] = useState<Date>(new Date(birthday));
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
  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    // console.log("submitted->data: ", data);
  }


  return (
    <Form { ...form }>
      <form onSubmit={ form.handleSubmit(handleSubmit) }>
        <div className="grid sm:grid-cols-1">
          <fieldset disabled={ form.formState.isSubmitting } className="grid sm:grid-cols-3 gap-x-1 gap-y-3 border-[1] rounded-2xl p-3">
            <FormField
              control={ form.control }
              name="firstName"
              render={ ({ field }) => (
                <FormItem>
                  <FormLabel className="font-extrabold">First Name</FormLabel>
                  <FormControl>
                    <Input { ...field } type="text" className="text-xs font-extralight" />
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
                      <Button variant="outline" id="date" className="justify-start font-normal">{ date ? date.toLocaleDateString('en-US', {
                        year: 'numeric', month: '2-digit', day: '2-digit'
                      }) : "Select date" }
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
                          setOpen(true)
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

        </div>
        <div className="flex justify-center p-2 gap-2 ">
          <Button className=" text-xs" type="reset">Cancel</Button>
          <Button className=" text-xs" type="submit">Update</Button>
        </div>
      </form>
    </Form >
  )
}