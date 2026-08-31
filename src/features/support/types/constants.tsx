import { FileText, Folder, Settings, Users, HelpCircle, Info, Heart, CircleAlert } from "lucide-react";

// Import feature FAQ items from category-specific files
import { movieReviewsFaqItems } from "./movie-reviews-constants";
import { tvReviewsFaqItems } from "./tv-reviews-constants";
import { discussionGroupsFaqItems } from "./discussion-groups-constants";
import { musicSalonFaqItems } from "./music-salon-constants";
import { theKitchenFaqItems } from "./the-kitchen-constants";
import { poetryNookFaqItems } from "./poetry-nook-constants";
import { libraryFaqItems } from "./library-constants";
import { livingRoomFaqItems } from "./living-room-constants";
import { mailBoxFaqItems } from "./mail-box-constants";
import { pictureHallwayFaqItems } from "./picture-hallway-constants";
import { memberGalleryFaqItems } from "./member-gallery-constants";
import { gameRoomFaqItems } from "./game-room-constants";

export const featureFaqItems = [
  ...tvReviewsFaqItems,
  ...movieReviewsFaqItems,
  ...discussionGroupsFaqItems,
  ...musicSalonFaqItems,
  ...theKitchenFaqItems,
  ...poetryNookFaqItems,
  ...libraryFaqItems,
  ...livingRoomFaqItems,
  ...mailBoxFaqItems,
  ...pictureHallwayFaqItems,
  ...memberGalleryFaqItems,
  ...gameRoomFaqItems,
];

export const REQUIRED_IMAGE_CREDIT_ATTRIBUTES = ["Title", "Source"] as const;

export function validateImageCredit(credit: string | null | undefined): { isValid: boolean; errorMessage?: string } {
  if (!credit || !credit.trim()) {
    return {
      isValid: false,
      errorMessage: "Image Credit is required. Format: Title: [Source Name] | Source: [image URL]",
    };
  }

  const trimmed = credit.trim();

  const requiredAttributes = REQUIRED_IMAGE_CREDIT_ATTRIBUTES;
  const missingAttributes = requiredAttributes.filter((attr) => !trimmed.includes(`${ attr }:`));

  if (missingAttributes.length > 0) {
    return {
      isValid: false,
      errorMessage: `Image Credit is missing required attributes: ${ missingAttributes.join(", ") }. Format: Title: [Source Name] | Source: [image URL]`,
    };
  }

  return { isValid: true };
}

export const SHOW_SITE_BACKGROUND_COLOR_SCHEMES = [
  { label: "Red", value: "#FF292D" },
  { label: "Black", value: "#000000" },
  { label: "Navy", value: "#007BA9" },
  { label: "Orange", value: "#FF9500" },
  { label: "Green", value: "#02C00C" },
] as const;

const LEGACY_SHOW_SITE_BACKGROUND_MAP: Record<string, (typeof SHOW_SITE_BACKGROUND_COLOR_SCHEMES)[number]["value"]> = {
  red: "#FF292D",
  black: "#000000",
  navy: "#007BA9",
  orange: "#FF9500",
  green: "#02C00C",
};

export const getShowSiteBackgroundColor = (backgroundColorInput: string | null | undefined): (typeof SHOW_SITE_BACKGROUND_COLOR_SCHEMES)[number]["value"] => {
  if (!backgroundColorInput) {
    return SHOW_SITE_BACKGROUND_COLOR_SCHEMES[0].value;
  }

  const input = backgroundColorInput.trim().toLowerCase();

  // First, check if it's a valid scheme value
  const matchedScheme = SHOW_SITE_BACKGROUND_COLOR_SCHEMES.find((scheme) => scheme.value.toLowerCase() === input);
  if (matchedScheme) {
    return matchedScheme.value;
  }

  // Then, check the legacy map
  const legacyMatch = LEGACY_SHOW_SITE_BACKGROUND_MAP[input];
  if (legacyMatch) {
    return legacyMatch;
  }

  // Default to the first scheme if no match found
  return SHOW_SITE_BACKGROUND_COLOR_SCHEMES[0].value;
};

const SHOW_SITE_BACKGROUND_VALUE_SET = new Set(
  SHOW_SITE_BACKGROUND_COLOR_SCHEMES.map((scheme) => scheme.value)
);

export function normalizeShowSiteBackgroundHex(value?: string | null) {
  if (!value) {
    return "#000000" as const;
  }

  const trimmed = value.trim();
  const upper = trimmed.toUpperCase();

  if (SHOW_SITE_BACKGROUND_VALUE_SET.has(upper as (typeof SHOW_SITE_BACKGROUND_COLOR_SCHEMES)[number]["value"])) {
    return upper as (typeof SHOW_SITE_BACKGROUND_COLOR_SCHEMES)[number]["value"];
  }

  return LEGACY_SHOW_SITE_BACKGROUND_MAP[trimmed.toLowerCase()] ?? "#000000";
}
