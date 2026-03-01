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

const formSchema = passwordMatchSchema;

type UserEmailProp = {
  userEmail: string;
}

export default function UpdateResetPasswordForm({ userEmail }: UserEmailProp) {
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
          <FormField
            control={ form.control }
            name="password"
            render={ ({ field }) => (
              <FormItem>
                <FormLabel className="font-extrabold text-sm md:text-base">New Password</FormLabel>
                <FormControl>
                  <Input { ...field } placeholder="Enter new password here..." type="password" className="text-xs" />
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
                <FormLabel className="font-extrabold text-sm md:text-base">Confirm New Password</FormLabel>
                <FormControl>
                  <Input { ...field } placeholder="Confirm new password here..." type="password" className="text-xs" />
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
          <Button type="submit">Update Password</Button>
        </fieldset>
      </form>
    </Form>
  )
}