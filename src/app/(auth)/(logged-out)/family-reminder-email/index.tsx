'use client';

import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { CardFooter } from "@/components/ui/card";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { sendFamilyNameEmail } from "./actions";


const formSchema = z.object({
  email: z.email()
});

/* 
  This function will receive a request parameter containing an email address + token string
*/
export default function SendFamilyEmailForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  /* If the user had an email address on the login screen then the link here would pass it in the quest*/
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: decodeURIComponent(searchParams.get("email") ?? "") as string,
    }
  });

  /* Form submission handles will check user email against invited family members and send the email  */
  const handleSubmit = async (data: z.infer<typeof formSchema>) => {

    const response = await sendFamilyNameEmail(data.email);

    if (response?.error) {
      form.setError("email", {
        message: response?.message,
      });
    }
    else {
      toast.success("Email has been sent! We look forward to your joining us.", {
        position: "top-center",
        duration: 3000,
        className: "bg-green-500 text-white",
      });
      router.push(`/login?email=${ encodeURIComponent(form.getValues("email")) }`);
    }
  };

  return (
    <Form { ...form }>
      <form onSubmit={ form.handleSubmit(handleSubmit) }>
        <fieldset disabled={ form.formState.isSubmitting } className="flex flex-col gap-2">
          <FormField
            control={ form.control }
            name="email"
            render={ ({ field }) => (
              <FormItem>
                <FormLabel className="font-extrabold text-sm md:text-base">Email Address</FormLabel>
                <FormControl>
                  <Input { ...field } placeholder="Enter your email address" type="email" className="text-xs" />
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
          <div className="py-2"></div>
          <Button className="text-base" type="submit">Send Email</Button>
        </fieldset>
        <CardFooter className="flex flex-col gap-2 py-2 ">
          <div className=" text-sm text-muted-foreground">
            Did you remember your Family Name? { " " }
            <Link href="/login" className="underline ">Login</Link>
          </div>
          <div className="text-muted-foreground text-sm">
            Visit the Family Social Home { " " }
            <Link href="/" className="underline">Go Home</Link>
          </div>
        </CardFooter>
      </form>
    </Form>
  )
}
