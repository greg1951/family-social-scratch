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
import { ArrowRight, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { ChangePasswordFormSchema } from "@/features/family/components/validation/schema";

const formSchema = ChangePasswordFormSchema;

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
          <fieldset disabled={ form.formState.isSubmitting } className="grid gap-4 rounded-[1.6rem] border border-[#d7edf6] bg-[#f8fdff] p-4 shadow-inner sm:grid-cols-3">
            <div className="relative">
              <FormField
                control={ form.control }
                name="currentPassword"
                render={ ({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-extrabold text-[#10364a] md:text-base">Current Password</FormLabel>
                    <FormControl>
                      <Input { ...field } type={ showCurrentPassword ? "text" : "password" } className="border-[#c8e5f1] bg-white text-sm text-[#10364a]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                ) }
              />
              <Button type="button" variant="ghost" size="sm"
                className="absolute right-0 top-3.5 h-full px-3 py-2 text-[#315363] hover:bg-transparent hover:text-[#10364a]"
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
                    <FormLabel className="text-sm font-extrabold text-[#10364a] md:text-base">New Password</FormLabel>
                    <FormControl>
                      <Input { ...field } type={ showNewPassword ? "text" : "password" } className="border-[#c8e5f1] bg-white text-sm text-[#10364a]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                ) }
              />
              <Button type="button" variant="ghost" size="sm"
                className="absolute right-0 top-3.5 h-full px-3 py-2 text-[#315363] hover:bg-transparent hover:text-[#10364a]"
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
                    <FormLabel className="text-sm font-extrabold text-[#10364a] md:text-base">Confirm New Password</FormLabel>
                    <FormControl>
                      <Input { ...field } type={ showConfirmPassword ? "text" : "password" } className="border-[#c8e5f1] bg-white text-sm text-[#10364a]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                ) }
              />
              <Button type="button" variant="ghost" size="sm"
                className="absolute right-0 top-3.5 h-full px-3 py-2 text-[#315363] hover:bg-transparent hover:text-[#10364a]"
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
              <FormMessage className="sm:col-span-3 text-center">
                { form.formState.errors.root.message }
              </FormMessage>
            }
          </fieldset>
          <div className="flex justify-center px-2 pt-4">
            <Button
              type="submit"
              className="h-11 min-w-[15rem] rounded-2xl bg-[linear-gradient(135deg,#005472_0%,#0a779f_52%,#59cdf7_100%)] px-6 text-base font-bold text-white shadow-[0_18px_30px_-18px_rgba(0,84,114,0.8)] hover:brightness-110"
            >
              <ShieldCheck className="h-4 w-4" />
              Change Password
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </form>
    </Form>
  )
}