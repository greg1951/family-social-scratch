'use server';

import { and, eq, inArray } from "drizzle-orm";

import db from "@/components/db/drizzle";
import {
  family,
  familyFeatureConfig,
  featureReference,
} from "@/components/db/schema/family-social-schema-tables";
import {
  GetEnabledFamilyFeaturesReturn,
  GetFamilyFeatureConfigReturn,
} from "@/components/db/types/family-member";
import {
  FeatureConfigDirtyFields,
  FeatureConfigFormValues,
} from "@/features/family/types/family-steps";
import { getFeatureKeyFromReferenceName } from "@/features/family/services/family-feature-flags";

export async function getFamilyFeatureConfig(
  familyId: number
): Promise<GetFamilyFeatureConfigReturn> {
  const [familyRecord] = await db
    .select({ status: family.status })
    .from(family)
    .where(eq(family.id, familyId));

  if (!familyRecord) {
    return {
      success: false,
      message: `Family not found for familyId ${ familyId }`,
    };
  }

  const activeFeatures = await db
    .select({
      featureId: featureReference.id,
      featureName: featureReference.name,
      featureDescription: featureReference.description,
    })
    .from(featureReference)
    .where(eq(featureReference.status, "active"));

  if (activeFeatures.length === 0) {
    return {
      success: true,
      familyStatus: familyRecord.status,
      features: [],
    };
  }

  const activeFeatureIds = activeFeatures.map((feature) => feature.featureId);

  const existingConfigs = await db
    .select({
      featureId: familyFeatureConfig.featureId,
    })
    .from(familyFeatureConfig)
    .where(
      and(
        eq(familyFeatureConfig.familyId, familyId),
        inArray(familyFeatureConfig.featureId, activeFeatureIds)
      )
    );

  const existingFeatureIds = new Set(existingConfigs.map((config) => config.featureId));
  const missingFeatureIds = activeFeatureIds.filter((featureId) => !existingFeatureIds.has(featureId));

  if (missingFeatureIds.length > 0) {
    // Keep features enabled by default for continuity, including all trial families.
    const defaultSelected = true;

    await db.insert(familyFeatureConfig).values(
      missingFeatureIds.map((featureId) => ({
        familyId,
        featureId,
        isSelected: defaultSelected,
      }))
    );
  }

  const configuredFeatures = await db
    .select({
      familyFeatureConfigId: familyFeatureConfig.id,
      featureId: featureReference.id,
      featureName: featureReference.name,
      featureDescription: featureReference.description,
      isSelected: familyFeatureConfig.isSelected,
    })
    .from(familyFeatureConfig)
    .innerJoin(featureReference, eq(familyFeatureConfig.featureId, featureReference.id))
    .where(
      and(
        eq(familyFeatureConfig.familyId, familyId),
        eq(featureReference.status, "active")
      )
    );

  return {
    success: true,
    familyStatus: familyRecord.status,
    features: configuredFeatures.map((feature) => ({
      familyFeatureConfigId: feature.familyFeatureConfigId,
      featureId: feature.featureId,
      featureName: feature.featureName,
      featureDescription: feature.featureDescription ?? "",
      isSelected: feature.isSelected,
    })),
  };
}

export async function updateFamilyFeatureConfig({
  featureConfigFormValues,
  featureConfigDirtyFields,
}: {
  featureConfigFormValues: FeatureConfigFormValues;
  featureConfigDirtyFields: FeatureConfigDirtyFields;
}) {
  type UpdatedFeature = {
    familyFeatureConfigId: number;
    isSelected: boolean;
  };

  const dirtyFeatures = featureConfigDirtyFields.features ?? [];
  const updatedFeatures: UpdatedFeature[] = dirtyFeatures.flatMap((dirtyField, index) => {
    if (dirtyField?.isSelected === undefined) {
      return [];
    }

    const formValue = featureConfigFormValues.features[index];
    if (!formValue) {
      return [];
    }

    return [
      {
        familyFeatureConfigId: formValue.familyFeatureConfigId,
        isSelected: formValue.isSelected,
      },
    ];
  });

  for (const feature of updatedFeatures) {
    const updateResult = await db
      .update(familyFeatureConfig)
      .set({ isSelected: feature.isSelected })
      .where(eq(familyFeatureConfig.id, feature.familyFeatureConfigId));

    if (!updateResult) {
      return {
        success: false,
        message: `Failed to update feature config ${ feature.familyFeatureConfigId }`,
      };
    }
  }

  return {
    success: true,
  };
}

export async function getEnabledFamilyFeatures(
  familyId: number
): Promise<GetEnabledFamilyFeaturesReturn> {
  const featureConfigResult = await getFamilyFeatureConfig(familyId);
  if (!featureConfigResult.success) {
    return featureConfigResult;
  }

  const enabledFeatureKeys = featureConfigResult.features
    .filter((feature) => feature.isSelected)
    .map((feature) => getFeatureKeyFromReferenceName(feature.featureName))
    .filter((featureKey): featureKey is NonNullable<typeof featureKey> => featureKey !== null);

  return {
    success: true,
    enabledFeatureKeys,
  };
}