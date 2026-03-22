'use client';

import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { passwordMatchSchema } from "@/features/auth/components/validation/passwordMatchSchema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { updateResetPassword } from "./actions";
import { toast } from "sonner";
import { useRouter } from "next/router";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, ShieldCheck } from "lucide-react";

const formSchema = passwordMatchSchema;

type UserEmailProp = {
  userEmail: string;
}

export default function UpdateResetPasswordForm({ userEmail }: UserEmailProp) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      passwordConfirm: ""
    }
  });

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    setSubmitted(false);
    const response = await updateResetPassword({
      email: userEmail,
      password: data.password,
      passwordConfirm: data.passwordConfirm
    });


    if (response?.error) {
      form.setError("root", {
        message: response?.message,
      });
    }
    setSubmitted(true);
  };

  // console.log('UpdateResetPasswordForm->submitted?', submitted)
  if (submitted) {
    return (
      <div className="flex justify-center">
        <main className="font-app h-[80vh]">
          <CardContent className="flex-col gap-1">
            <p className="text-sm p-2">Password reset was successful.</p>
            <div className="text-muted-foreground text-sm text-center">
              Login to your account?{ " " }
              <Link href="/login" className="underline">
                Login
              </Link>
            </div>
          </CardContent>
        </main>
      </div>
    )
  };

  return (
    <Form { ...form }>
      <form onSubmit={ form.handleSubmit(handleSubmit) }>
        <fieldset disabled={ form.formState.isSubmitting } className="flex flex-col gap-2">
          <div className="relative">
            <FormField
              control={ form.control }
              name="password"
              render={ ({ field }) => (
                <FormItem>
                  <FormLabel className="font-extrabold text-sm md:text-base">New Password</FormLabel>
                  <FormControl>
                    <Input { ...field } placeholder={ showPassword ? "text" : "password" } type={ showPassword ? "text" : "password" } className="text-xs" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              ) }
            />
            <Button type="button" variant="ghost" size="sm"
              className="absolute right-0 top-3.5 h-full px-3 py-2 text-[#315363] hover:bg-transparent hover:text-[#10364a]"
              onClick={ () => setShowPassword((prev) => !prev) }
            >
              { showPassword ? (
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
                  <FormLabel className="font-extrabold text-sm md:text-base">Confirm New Password</FormLabel>
                  <FormControl>
                    <Input { ...field } placeholder="Confirm new password here..." type={ showConfirmPassword ? "text" : "password" } className="text-xs" />
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
            <FormMessage>
              { form.formState.errors.root.message }
            </FormMessage>
          }
          <Button
            type="submit"
            className="mt-2 h-11 rounded-2xl bg-[linear-gradient(135deg,#005472_0%,#0a779f_52%,#59cdf7_100%)] text-base font-bold text-white shadow-[0_18px_30px_-18px_rgba(0,84,114,0.8)] hover:brightness-110"
          >
            <ShieldCheck className="h-4 w-4" />
            Update Password
            <ArrowRight className="h-4 w-4" />
          </Button>
        </fieldset>
      </form>
    </Form>
  )
}