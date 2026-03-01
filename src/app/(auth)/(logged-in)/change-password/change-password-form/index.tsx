'use client';

import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { passwordSchema } from "@/features/auth/components/validation/passwordSchema";
import { passwordMatchSchema } from "@/features/auth/components/validation/passwordMatchSchema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { changeUserPassword } from "./actions";
import { toast } from "sonner";

const formSchema = z.object({
  currentPassword: passwordSchema,
}).and(passwordMatchSchema);

type UserEmailProp = {
  userEmail: string;
}

export default function ChangePasswordForm({ userEmail }: UserEmailProp) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currentPassword: "",
      password: "",
      passwordConfirm: ""
    }
  });

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    console.info('Starting changeUserPassword for: ', userEmail);
    const response = await changeUserPassword({
      email: userEmail,
      currentPassword: data.currentPassword,
      password: data.password,
      passwordConfirm: data.passwordConfirm
    });

    if (response?.error) {
      form.setError("root", {
        message: response?.message,
      });
    }
    else {
      toast.success("Your password has been updated.", {
        position: "bottom-center",
        duration: 2000,
        className: "bg-green-500 text-white",
      });
      form.reset();
    }
  };

  return (
    <Form { ...form }>
      <form onSubmit={ form.handleSubmit(handleSubmit) }>
        <div className="grid sm:grid-cols-1">
          <fieldset disabled={ form.formState.isSubmitting } className="grid sm:grid-cols-3 gap-x-1 gap-y-3 border-[1] rounded-2xl p-3">
            <FormField
              control={ form.control }
              name="currentPassword"
              render={ ({ field }) => (
                <FormItem>
                  <FormLabel className="font-extrabold">Current Password</FormLabel>
                  <FormControl>
                    <Input { ...field } type="password" className="text-xs font-extralight" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              ) }
            />
            <FormField
              control={ form.control }
              name="password"
              render={ ({ field }) => (
                <FormItem>
                  <FormLabel className="font-extrabold">New Password</FormLabel>
                  <FormControl>
                    <Input { ...field } type="password" className="text-xs font-extralight" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              ) }
            />
            <FormField
              control={ form.control }
              name="passwordConfirm"
              render={ ({ field }) => (
                <FormItem>
                  <FormLabel className="font-extrabold">Confirm New Password</FormLabel>
                  <FormControl>
                    <Input { ...field } type="password" className="text-xs font-extralight" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              ) }
            />
            { !!form.formState.errors.root?.message &&
              <FormMessage>
                { form.formState.errors.root.message }
              </FormMessage>
            }
          </fieldset>
          <div className="flex justify-center p-2 gap-2 ">
            <Button type="submit">Change Password</Button>
          </div>
        </div>
      </form>
    </Form>
  )
}