'use client';

import { updateMemberNotifications } from "@/components/db/sql/queries-family-notifications";
import { GetMemberNotificationsReturn } from "@/components/db/types/family-member";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { NotificationsFormSchema } from "@/features/family/components/validation/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import z from "zod";
import { useRouter } from "next/navigation";
import { ArrowRight, BellRing, RotateCcw } from "lucide-react";

const formSchema = NotificationsFormSchema;

type FormValues = z.infer<typeof formSchema>;

export default function FamilyNotificationsForm({ notifications }: { notifications: Extract<GetMemberNotificationsReturn, { success: true }>["notifications"] }) {
  const router = useRouter();

  const notificationOptions = (notifications ?? []).map((notification) => ({
    memberOptionId: notification.memberOptionId,
    optionId: notification.optionId,
    optionName: notification.optionName,
    isSelected: notification.isSelected,
  }));

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      notifications: notificationOptions,
    },
  });

  const { formState: { isDirty, dirtyFields } } = form;

  const handleFormSubmit = async (data: z.infer<typeof formSchema>) => {
    const notificationUpdateResult = await updateMemberNotifications({
      notificationFormValues: data,
      notificationDirtyFields: dirtyFields,
    });

    if (notificationUpdateResult.success) {
      // Reset defaults to submitted values so isDirty returns to false.
      form.reset(data);
      router.refresh();
    }
  }

  function resetForm() {
    form.reset()
  }


  return (
    <Form { ...form }>
      <form onSubmit={ form.handleSubmit(handleFormSubmit) }>
        <div className="grid sm:grid-cols-1">
          <fieldset disabled={ form.formState.isSubmitting } className="grid sm:grid-cols-3 gap-x-1 gap-y-3 border-[1] rounded-2xl p-3">
            { notificationOptions.map((notification, index) => (
              <FormField
                key={ notification.optionId }
                control={ form.control }
                name={ `notifications.${ index }.isSelected` }
                render={ ({ field }) => (
                  <FormItem className="flex items-center gap-2 rounded-md border p-2">
                    <FormControl>
                      <Checkbox
                        checked={ !!field.value }
                        onCheckedChange={ (checked) => field.onChange(checked === true) }
                        className="text-xs font-extralight"
                      />
                    </FormControl>
                    <FormLabel className="font-extrabold">{ notification.optionName }</FormLabel>
                    <FormMessage />
                  </FormItem>
                ) }
              />
            )) }
          </fieldset>
          <div className="flex justify-center p-2 gap-2 ">
            <Button
              disabled={ !isDirty ? true : false }
              variant="outline"
              className="h-10 rounded-xl border-[#9edcf4] bg-white text-xs font-semibold text-[#315363] hover:bg-[#dff6ff]"
              type="reset"
              onClick={ resetForm }
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
            <Button
              type="submit"
              disabled={ !isDirty ? true : false }
              className="h-10 rounded-xl bg-[linear-gradient(135deg,#005472_0%,#0a779f_52%,#59cdf7_100%)] px-4 text-xs font-bold text-white shadow-[0_18px_30px_-18px_rgba(0,84,114,0.8)] hover:brightness-110"
            >
              <BellRing className="h-3.5 w-3.5" />
              Update Notifications
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>

        </div>
      </form>
    </Form >
  )
}