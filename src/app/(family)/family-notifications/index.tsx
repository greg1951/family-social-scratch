'use client';

import { GetMemberNotificationsReturn } from "@/components/db/types/family-member";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { NotificationsFormSchema } from "@/features/family/components/validation/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import z from "zod";
import { useRouter } from "next/navigation";
import { ArrowRight, BellRing, CircleQuestionMark, RotateCcw } from "lucide-react";
import { updateNotifications } from "./actions";

const formSchema = NotificationsFormSchema;

type FormValues = z.infer<typeof formSchema>;

export default function FamilyNotificationsForm({ notifications }: { notifications: Extract<GetMemberNotificationsReturn, { success: true }>["notifications"] }) {
  const router = useRouter();

  const sectionHeadingMap: Record<string, string> = {
    browser: "Preferred Browser",
    device: "Preferred Device",
    feature: "Feature Notifications",
    notification: "Other Notifications",
    user: "User Settings",
  };

  const sectionHelpTextMap: Record<string, string[]> = {
    browser: ["If accessing My Family Social with a browser, indicate your preferred browser."],
    device: ["What device would prefer to use in My Family Social or othe web apps."],
    feature: ["Choose which feature categories you want notifications for."],
    notification: [
      "The Activity Summary: Send me a weekly email summary of the family activyt.",
      "When someone in the family has a birthday, send me a reminder the week before.",
    ],
    user: [
      "Tour Guide: provides useful tips as you navigate through My Family Social, good for new members!",
      "Post Reactions: Send me a thread in the family mailbox when another family member reacts to one of my posts or comments.",
      "Use Nickname: If you go by a nickname and want that used instead of your name, check this.",
    ],
  };

  const sectionDisplayOrder: Record<string, number> = {
    device: 1,
    browser: 2,
    feature: 3,
    notification: 4,
    user: 5,
  };

  const notificationOptions = (notifications ?? []).map((notification) => ({
    memberOptionId: notification.memberOptionId,
    optionId: notification.optionId,
    optionName: notification.optionName,
    optionCategory: notification.optionCategory,
    optionSeqNo: notification.optionSeqNo,
    isSelected: notification.isSelected,
  }));

  const sectionCategories = Array.from(
    new Set(
      notificationOptions
        .map((notification) => notification.optionCategory)
        .filter((category) => category && category.trim().length > 0)
    )
  ).sort((left, right) => {
    const leftKey = left.toLowerCase();
    const rightKey = right.toLowerCase();
    const leftOrder = sectionDisplayOrder[leftKey] ?? Number.MAX_SAFE_INTEGER;
    const rightOrder = sectionDisplayOrder[rightKey] ?? Number.MAX_SAFE_INTEGER;
    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }
    return left.localeCompare(right);
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      notifications: notificationOptions,
    },
  });

  const { formState: { isDirty, dirtyFields } } = form;

  const handleFormSubmit = async (data: z.infer<typeof formSchema>) => {
    const notificationUpdateResult = await updateNotifications({
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
          <fieldset disabled={ form.formState.isSubmitting } className="space-y-3 rounded-2xl border-[1] p-3">
            { sectionCategories.map((category) => {
              const sectionKey = category.toLowerCase();
              const sectionHelpLines = sectionHelpTextMap[sectionKey] ?? [];
              const hoverCardWidthClass = sectionKey === "user" ? "w-[283px]" : "w-[226px]";
              const sectionNotifications = notificationOptions
                .map((notification, index) => ({ notification, index }))
                .filter((entry) => entry.notification.optionCategory === category)
                .sort((a, b) => a.notification.optionSeqNo - b.notification.optionSeqNo);

              return (
                <div key={ category } className="rounded-xl border p-3">
                  <div className="mb-3 flex items-center gap-1.5">
                    <h3 className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#2f7a95]">
                      { sectionHeadingMap[sectionKey] ?? category }
                    </h3>
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[#2f7a95] transition hover:bg-[#e8f6fb]"
                          aria-label={ `About ${sectionHeadingMap[sectionKey] ?? category}` }
                        >
                          <CircleQuestionMark className="h-4 w-4" />
                        </button>
                      </HoverCardTrigger>
                      <HoverCardContent side="right" align="start" className={`${ hoverCardWidthClass } border-[#cfe8f2] bg-[#f9fdff] p-3 text-xs leading-5 text-[#315363]`}>
                        <div className="space-y-2">
                          { sectionHelpLines.map((line) => (
                            <p key={ line }>{ line }</p>
                          )) }
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-5 lg:grid-cols-5">
                    { sectionNotifications.map(({ notification, index }) => (
                      <FormField
                        key={ notification.memberOptionId }
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
                            <FormLabel className="font-light">{ notification.optionName }</FormLabel>
                            <FormMessage />
                          </FormItem>
                        ) }
                      />
                    )) }
                  </div>
                </div>
              );
            }) }
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