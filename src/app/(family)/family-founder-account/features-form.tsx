'use client';

import { updateFamilyFeatureConfig } from "@/components/db/sql/queries-family-features";
import { GetFamilyFeatureConfigReturn } from "@/components/db/types/family-member";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { FeatureConfigFormSchema } from "@/features/family/components/validation/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, RotateCcw, SlidersHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import z from "zod";

const formSchema = FeatureConfigFormSchema;

type FormValues = z.infer<typeof formSchema>;

type FeatureConfig = Extract<GetFamilyFeatureConfigReturn, { success: true }>["features"];

export default function FounderFeaturesForm({
  features,
  familyStatus,
}: {
  features: FeatureConfig;
  familyStatus: string;
}) {
  const router = useRouter();

  const featureOptions = (features ?? []).map((feature) => ({
    familyFeatureConfigId: feature.familyFeatureConfigId,
    featureId: feature.featureId,
    featureName: feature.featureName,
    isSelected: feature.isSelected,
  }));

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      features: featureOptions,
    },
  });

  const {
    formState: { isDirty, dirtyFields },
  } = form;

  const handleFormSubmit = async (data: FormValues) => {
    const updateResult = await updateFamilyFeatureConfig({
      featureConfigFormValues: data,
      featureConfigDirtyFields: dirtyFields,
    });

    if (updateResult.success) {
      form.reset(data);
      router.refresh();
    }
  };

  const resetForm = () => {
    form.reset();
  };

  return (
    <Form { ...form }>
      <form onSubmit={ form.handleSubmit(handleFormSubmit) }>
        <div className="grid sm:grid-cols-1">
          { familyStatus === "trial" ? (
            <p className="mb-3 rounded-md border border-sky-200 bg-sky-50 p-2 text-xs text-sky-900">
              Trial families start with all active features enabled. Toggle any feature off to hide it from the family home page and header.
            </p>
          ) : null }
          <fieldset disabled={ form.formState.isSubmitting } className="grid sm:grid-cols-2 gap-x-2 gap-y-3 rounded-2xl border p-3">
            { featureOptions.map((feature, index) => (
              <FormField
                key={ feature.featureId }
                control={ form.control }
                name={ `features.${ index }.isSelected` }
                render={ ({ field }) => (
                  <FormItem className="flex items-center gap-2 rounded-md border p-2">
                    <FormControl>
                      <Checkbox
                        checked={ !!field.value }
                        onCheckedChange={ (checked) => field.onChange(checked === true) }
                      />
                    </FormControl>
                    <FormLabel className="font-light">{ feature.featureName }</FormLabel>
                    <FormMessage />
                  </FormItem>
                ) }
              />
            )) }
          </fieldset>
          <div className="flex justify-center gap-2 p-2">
            <Button
              disabled={ !isDirty }
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
              disabled={ !isDirty }
              className="h-10 rounded-xl bg-[linear-gradient(135deg,#005472_0%,#0a779f_52%,#59cdf7_100%)] px-4 text-xs font-bold text-white shadow-[0_18px_30px_-18px_rgba(0,84,114,0.8)] hover:brightness-110"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Update Features
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
