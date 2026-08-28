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

export function getGeneralFaqItems(setupStartUrl: string) {
  return [
    {
      value: "item-20",
      category: "Start a Family",
      trigger: (
        <div>
          <p className="text-base font-semibold">How do I create a family in My Family Social?</p>
          <p className="text-xs text-slate-600">Learn how easy the setup is for a new family.</p>
        </div>
      ),
      content: (
        <div className="flex items-center justify-center mt-4">
          <span>
            <p>There is a guided process to create a family account. It consists of the four steps shown below. In five minutes or less you will have your family set up and ready to go.</p>
            <ol className="list-decimal ml-6 mt-2">
              <li>Create the family founder account with email and password</li>
              <li>Create a unique family name</li>
              <li>Invite family members to join via email</li>
              <li>Confirm and create the family account.</li>
            </ol>
            <p className="pt-2 italic pb-2">If you are already registered in My Family Social, you must use a different email to create a new family.</p>
            <p className="pt-2">The link below 👇 will take you to the new family setup page.</p>
            <p style={ { marginTop: 8 } }>
              <a href={ setupStartUrl } target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">Start a Family today!</a>
            </p>
            <div className="flex items-center justify-center mt-4">
              <img
                src="images/support/faq-family-setup-start.jpg"
                alt="Family setup screenshot"
                style={ { maxWidth: '600px', maxHeight: '600px', marginTop: 12, borderRadius: 8 } }
              />
            </div>
          </span>
        </div>
      ),
      icon: FileText,
    },
    {
      value: "item-30",
      category: "My Family Social",
      trigger: (
        <div>
          <p className="text-base font-semibold">What does the My Family Social Registration form look like?</p>
          <p className="text-xs text-slate-600">It&apos;s a simple form but you need to fill it out correctly because of the credentials it will create when submitted.</p>
        </div>
      ),
      content: (
        <div className="flex items-center justify-center pt-2">
          <span>
            <p className="pb-2 text-base">👇Here is the form on My Family Social where the link in the invitation email will redirect you.👇</p>
            <img
              src="images/support/faq-registration.jpg"
              alt="My Family Social Registration screenshot"
            // style={ { maxWidth: '300px', marginTop: 12, borderRadius: 8 } }
            />
            <span className="flex flex-col items-start gap-2 mt-4 text-base">
              <p>The form is filled in with the information the family founder provided to inviting you.</p>
              <ul className="list-disc ml-6 mt-2">
                <li>Confirm your first and last name.</li>
                <li>The <i>nick name</i> and <i>cell phone</i> fields are optional. You can change them after registration. </li>
                <li>The two password fields <b>must be filled in</b>. The passwords must match and be at least 8 characters with at least one uppercase letter, one number, and one special character.</li>
              </ul>
              <p><b>Tip:</b> Unhide the passwords when you are entering them and validate they are the same and it&apos;s something you can remember.</p>
            </span>
          </span>
        </div>
      ),
      icon: FileText,
    },
    {
      value: "item-40",
      category: "Account Access",
      trigger: (
        <div>
          <p className="text-base font-semibold">After I register in the family, how do I login?</p>
          <p className="text-xs text-slate-600">Learn how to access the login page.</p>
        </div>
      ),
      content: (
        <div className="grid md:grid-cols-2 text-base">
          <span className="flex flex-col items-start gap-2 mt-4">
            <p>After you register there is a link on the page to take you to the login page. However, you can always find the login on the My Family Social homepage.</p>
            <p>There are three fields needed to login, and they are all case sensitive. These are fields you entered when you filled out the family registration form.</p>
            <ol className="list-decimal ml-6 mt-2">
              <li>The Email address</li>
              <li>Your Password</li>
              <li>The Family name</li>
            </ol>
            <span className="flex flex-col items-start gap-2 mt-4">
              <p>Make sure you enter the family name <u>exactly</u> as it was created, including capitalization. Spaces and special characters are not allowed in the family name.</p>
              <p> Refer to your registration confirmation email if needed.</p>
            </span>
            <p style={ { marginTop: 8 } }>
              <a href="https://kbgfamilysocial.com/login" target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">Access the login page here!</a>
            </p>

          </span>
          <div className="flex items-center justify-center mt-4">
            <img
              src="images/support/faq-login-form-fields.png"
              alt="Login fields screenshot"
              style={ { maxWidth: '300px', marginTop: 12, borderRadius: 8 } }
            />
          </div>
        </div>
      ),
      icon: FileText,
    },
    {
      value: "item-50",
      category: "Account Access",
      trigger: (
        <div>
          <p className="text-base font-semibold">How do I reset my password?</p>
          <p className="text-xs text-slate-600">It&apos;s easy to do, just follow these steps.</p>
        </div>
      ),
      content: (
        <div className="grid md:grid-cols-2 text-base gap-2 mt-4">
          <span className="flex flex-col items-start gap-2 mt-4">
            <p>If you have forgotten your password, you can reset it by following these steps:</p>
            <ol className="list-decimal ml-6 mt-2">
              <li>Go to the login page.</li>
              <li>Click on <i>Forgot Password</i>. 👉</li>
              <li>Enter your email address and submit the form.</li>
            </ol>
            <span className="flex flex-col items-start gap-2 mt-4">
              <p>You will receive a link to reset your password on the My Family Social site. The link expires in 1 hour, so check your email promptly.</p>
              <p style={ { marginTop: 8 } }>
                <a href="https://kbgfamilysocial.com/password-reset" target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">Reset your password</a>
              </p>
            </span>

          </span>
          <img
            src="/images/support/faq-handy-login-links.jpg"
            alt="Reset password"
            style={ { maxWidth: '300px', maxHeight: '400px', marginTop: 12, borderRadius: 8 } }
          />
        </div>
      ),
      icon: FileText,
    },
    {
      value: "item-60",
      category: "Account Profile",
      trigger: (
        <div>
          <p className="text-base font-semibold">I&apos;ve signed in! Now what?</p>
          <p className="text-xs text-slate-600">Get your account profile squared away and then explore!</p>
        </div>
      ),
      content: (
        <div className="grid grid-col-1 text-base gap-2 mt-4">
          <div className="flex items-center justify-center mt-0">
            <img
              src="/images/support/faq-account-profile.jpg"
              alt="Account profile setup"
            />

          </div>
          <span className="flex flex-col items-start gap-2 mt-4">
            <p>On the My Family Social main page header, select the <b>Settings</b> option and follow the steps below.</p>
            <ol className="list-decimal ml-6 mt-2 py-2">
              <li>In Settings, select the <b>My Account</b> option.</li>
              <li>In My Account header, click on the <b>Upload Profile Image</b> option.</li>
              <li>Upload a good mugshot of yourself. Follow the recommended guidelines for image size and format.</li>
              <li>Once uploaded <b>Go Back</b> to My Account add <u>optional</u> info, like <i>cell number</i>, <i>nick name</i>, and your <i>birthday</i>.</li>
              <li>Open the <b>My Settings</b> tab and select which My Family Social features you would like to be notified when someone posts or interacts with your content.</li>
              <li>Open the <b>My Family</b> tab to see all your family members.</li>
              <li>If you would like to recommend a new family member fill out the <b>Suggest New Family Member</b> form and submit it.
                The family founder will get a private message in Mail Box about your suggestion.</li>
            </ol>
          </span>
        </div>
      ),
      icon: FileText,
    },
  ];
}

export const founderFaqItems = [
  {
    value: "item-10",
    category: "Start a Family",
    trigger: (
      <div>
        <p className="text-base font-semibold">Are there any limitations on who can be in the family?</p>
        <p className="text-xs text-slate-600">Learn about the eligibility criteria for family members.</p>
      </div>
    ),
    content: (
      <div className="grid md:grid-cols-1 text-base">
        <span>
          <p>An email address uniquely identifies a family member.</p>
          <ol className="list-decimal ml-6 mt-2">
            <li>Therefore each family member can belong to only one family.</li>
            <li>If you are the family founder, you cannot start another family using your current email address.</li>
            <li>If a family member belongs to a family, they can only join another family if they have an alternate email address.</li>
            <li>The family founder can invite new members at any time, and can remove members from the family as well.</li>
          </ol>
        </span>
      </div>
    ),
    icon: FileText,
  },
  {
    value: "item-20",
    category: "Leave a Family",
    trigger: (
      <div>
        <p className="text-base font-semibold">How does a member leave the family?</p>
        <p className="text-xs text-slate-600">The family founder invites new members and can also remove members from the family.</p>
      </div>
    ),
    content: (
      <div className="grid md:grid-cols-1 text-base">
        <div className="flex items-center justify-center mt-0">
          <span>
            <p>The steps below would be followed.</p>
            <ul className="list-disc ml-6 mt-2">
              <li>Family member who wants to leave a family needs to let the family founder know via a private message in Mail Box.</li>
              <li>That family member should select and fill in the <b>Leave a Family Notification</b> template in Mail Box.</li>
              <li>When the family founder gets the message the founder will remove the member in the Founder Account settings.</li>
            </ul>
            <p className="pt-2">The founder can remove the member using one of two methods:</p>
            <ul className="list-disc ml-6 mt-2">
              <li>&quot;soft&quot; delete: effectively deactivates the member&apos;s access and sets the status to &quot;retired&quot;. This allows the member&apos;s posts and comments to remain intact, known as &quot;Retired Member&quot;. The retired member could be reactivated at a later time.</li>
              <li>&quot;hard&quot; delete: permanently removes the member from the family by deleting the member and all of their content from the family. The member could be reinvited at a later time.</li>
            </ul>
            <div className="flex justify-center pt-2 pb-2">
              <img className="aspect-auto object-cover w-100 h-75 md:w-220 md:h-170"
                src="/images/support/faq-founder-hard-delete.jpg"
                alt="Founder Image Example"
              />
            </div>
          </span>
        </div>
      </div>
    ),
    icon: FileText,
  },
  {
    value: "item-30",
    category: "TV and Movie Reviews",
    trigger: (
      <div>
        <p className="text-base font-semibold">As the family founder, what should I know about TV and Movie image content being uploaded?</p>
        <p className="text-xs text-slate-600">TV and Movie content must adhere to Fair Use guidelines.</p>
      </div>
    ),
    content: (
      <div className="grid md:grid-cols-1 text-base">
        <div className="flex items-center justify-center mt-0">
          <span>
            <p>My Family Social allows the family members to post TV and Movie reviews. The following guidelines must be followed:</p>
            <ul className="list-disc ml-6 mt-2">
              <li>Content in the review must not use profanity or offensive language.</li>
              <li>Content that is uploaded must adhere to Fair Use guidelines.</li>
              <li>Image Credit must be provided for any images used which consists of <i>Title</i> and <i>Source</i> (URL).</li>
            </ul>
          </span>
        </div>
        <div className="flex justify-center pt-2 pb-2">
          <img className="aspect-auto object-cover w-100 h-75 md:w-220 md:h-170"
            src="/images/support/faq-founder-image-credit.jpg"
            alt="Founder Image Example"
          />
        </div>
        <div className="flex justify-center align-middle pt-4">
          <Info size={ 30 } className="inline-block mr-1" />
          <p className="p-2">My Family Social will do its best to ensure that all content adheres to these guidelines but your help to ensure compliance is appreciated.</p>
        </div>
      </div>
    ),
    icon: FileText,
  },
];

// Feature FAQ items are now organized in separate files by category
// They are combined here for backward compatibility
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
