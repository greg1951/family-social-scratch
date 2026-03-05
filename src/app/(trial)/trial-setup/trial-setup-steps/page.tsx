'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';

// Validation Schema
const formSchema = z.object({
  firstName: z.string().min(1, 'First name is required').min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(1, 'Last name is required').min(2, 'Last name must be at least 2 characters'),
  nickname: z.string().optional(),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof formSchema>;

export default function Step1CreateAccount() {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      nickname: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    try {
      // TODO: Handle form submission
      console.log(values);
      // Redirect to next step
      // router.push('/trial-setup/step-2');
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="font-app min-h-screen bg-linear-to-b from-neutral-50 to-neutral-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Card className="flex align-top w-[350] md:w-[800]">
          <CardHeader className="text-base md:text-2xl bg-[#59cdf7] rounded-2xl text-center p-2">
            <div className="flex items-center justify-center gap-4">
              <div className="shrink-0 mr-6">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-[#005472] text-white font-bold text-sm">
                  Step 1
                </div>
              </div>
              <CardTitle className="text-2xl md:text-3xl inline">
                Register Family Founder
              </CardTitle>
            </div>
          </CardHeader>
          <CardDescription className="text-white/90 ">
            Register yourself as the family founder by providing your information and login credentials.
          </CardDescription>
          { step === 1 && (
            <CardContent className="pt-1 ">
              <Form { ...form }>
                <form onSubmit={ form.handleSubmit(onSubmit) } className="space-y-6">
                  <div className="grid sm:grid-cols-1 ">
                    <fieldset disabled={ form.formState.isSubmitting } className="grid sm:grid-cols-3 gap-x-1 gap-y-3 border-[1] rounded-2xl p-3">
                      <FormField
                        control={ form.control }
                        name="firstName"
                        render={ ({ field }) => (
                          <FormItem>
                            <FormLabel className="font-extrabold">First Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John" { ...field } className="text-xs font-extralight" />
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
                              <Input placeholder="Doe" { ...field } />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        ) }
                      />

                      <FormField
                        control={ form.control }
                        name="nickname"
                        render={ ({ field }) => (
                          <FormItem>
                            <FormLabel className="font-extrabold">Nickname (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Johnny" { ...field } className="text-xs font-extralight" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        ) }
                      />
                    </fieldset>
                  </div>

                  <div className="grid sm:grid-cols-1">
                    <fieldset disabled={ form.formState.isSubmitting } className="grid sm:grid-cols-3 gap-x-1 gap-y-3 border-[1] rounded-2xl p-3">
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

                      <FormField
                        control={ form.control }
                        name="password"
                        render={ ({ field }) => (
                          <FormItem>
                            <FormLabel className="font-extrabold">Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="5 or more letters" { ...field } className="text-xs font-extralight" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        ) }
                      />

                      <FormField
                        control={ form.control }
                        name="confirmPassword"
                        render={ ({ field }) => (
                          <FormItem>
                            <FormLabel className="font-extrabold">Confirm Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Must match password" { ...field } className="text-xs font-extralight" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        ) }
                      />
                    </fieldset>
                    <div className="flex justify-center p-2 gap-2 ">
                      <Link href="/trial-home">
                        <Button variant="outline" className="md:w-auto bg-[#59cdf7] hover:bg-[#9de4fe]">
                          Back
                        </Button>
                      </Link>

                      <Button
                        type="submit"
                        className="md:w-auto bg-[#59cdf7] hover:bg-[#9de4fe] text-black font-semibold"
                        disabled={ isLoading }
                      >
                        { isLoading ? 'Registering Founder...' : 'Next' }
                      </Button>
                    </div>
                  </div>

                </form>
              </Form>
            </CardContent>
          ) }
        </Card>
      </div>
    </div>
  );
}
