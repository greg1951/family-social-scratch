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
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const formSchema = z.object({
  currentPassword: passwordSchema,
}).and(passwordMatchSchema);

type UserEmailProp = {
  userEmail: string;
}

export default function ChangePasswordForm({ userEmail }: UserEmailProp) {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
            <div className="relative">
              <FormField
                control={ form.control }
                name="currentPassword"
                render={ ({ field }) => (
                  <FormItem>
                    <FormLabel className="font-extrabold">Current Password</FormLabel>
                    <FormControl>
                      <Input { ...field } type={ showCurrentPassword ? "text" : "password" } className="text-xs font-extralight" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                ) }
              />
              <Button type="button" variant="ghost" size="sm"
                className="absolute right-0 top-2.5 h-full px-3 py-2 hover:bg-transparent"
                onClick={ () => setShowCurrentPassword((prev) => !prev) }
              >
                { showCurrentPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                ) }
              </Button>
            </div>
            <div className="relative">
              <FormField
                control={ form.control }
                name="password"
                render={ ({ field }) => (
                  <FormItem>
                    <FormLabel className="font-extrabold">New Password</FormLabel>
                    <FormControl>
                      <Input { ...field } type={ showNewPassword ? "text" : "password" } className="text-xs font-extralight" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                ) }
              />
              <Button type="button" variant="ghost" size="sm"
                className="absolute right-0 top-2.5 h-full px-3 py-2 hover:bg-transparent"
                onClick={ () => setShowNewPassword((prev) => !prev) }
              >
                { showNewPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                ) }
              </Button>
            </div>
            <div className="relative">
              <FormField
                control={ form.control }
                name="passwordConfirm"
                render={ ({ field }) => (
                  <FormItem>
                    <FormLabel className="font-extrabold">Confirm New Password</FormLabel>
                    <FormControl>
                      <Input { ...field } type={ showConfirmPassword ? "text" : "password" } className="text-xs font-extralight" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                ) }
              />
              <Button type="button" variant="ghost" size="sm"
                className="absolute right-0 top-2.5 h-full px-3 py-2 hover:bg-transparent"
                onClick={ () => setShowConfirmPassword((prev) => !prev) }
              >
                { showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                ) }
              </Button>
            </div>
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