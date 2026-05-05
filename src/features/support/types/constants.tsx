import { FileText, Folder, Settings, Users, HelpCircle, Info, Heart, CircleAlert } from "lucide-react";

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

export const generalFaqItems = [
  {
    value: "item-10",
    category: "Family Social",
    trigger: (
      <div>
        <p className="text-base font-semibold">What is Family Social?</p>
        <p className="text-xs text-slate-600">Learn about our platform and features.</p>
      </div>
    ),
    content: (
      <div className="grid md:grid-cols-2 text-base">
        <span>
          <p>Family Social is a platform that helps families stay connected and organized. All of the features are available during trial period.</p>
          <ul className="list-disc ml-6 mt-2">
            <li>Family Messaging and picture sharing</li>
            <li>TV, Music, Movie, Book Reviews</li>
            <li>Recipe Sharing with customizable recipe templates</li>
            <li>Family Game Scoreboards with game scores, leaderboards, player stats</li>
          </ul>

        </span>
        <div className="flex items-center justify-center mt-0">
          <span>
            <p className="text-center">Video coming soon, stay tuned!</p>
            <video controls width="500" height="300" style={ { marginTop: 12, borderRadius: 8 } }>
              <source src="/videos/faq-tv-home.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>

          </span>

        </div>
      </div>
    ),
    icon: Settings,
  },
  {
    value: "item-20",
    category: "Start a Family",
    trigger: (
      <div>
        <p className="text-base font-semibold">How to create a family in Family Social?</p>
        <p className="text-xs text-slate-600">Learn how easy the setup is for a new family.</p>
      </div>
    ),
    content: (
      <div className="grid md:grid-cols-2 text-base">
        <span>
          <p>There is a guided process to create a family account. It consists of the four steps shown below. In five minutes or less you will have your family set up and ready to go.</p>
          <ol className="list-decimal ml-6 mt-2">
            <li>Create the family founder account with email and password</li>
            <li>Create a unique family name</li>
            <li>Invite family members to join via email</li>
            <li>Confirm and create the family account.</li>
          </ol>
          <p className="pt-2 italic pb-2">If you are already registered in Family Social, you must use a different email to create a new family.</p>
          <p style={ { marginTop: 8 } }>
            <a href="https://kbgfamilysocial.com/family-setup-home" target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">Start a Family today!</a>
          </p>
        </span>
        <div className="flex items-center justify-center mt-0">
          <img
            src="images/support/faq-tv-home.jpg"
            alt="Family setup screenshot"
            style={ { maxWidth: '500px', maxHeight: '500px', marginTop: 12, borderRadius: 8 } }
          />

        </div>
      </div>
    ),
    icon: FileText,
  },
  {
    value: "item-30",
    category: "Family Social",
    trigger: (
      <div>
        <p className="text-base font-semibold">What does the Family Registration form look like?</p>
        <p className="text-xs text-slate-600">It's a simple form but you need to fill it out correctly because of the credentials it will create when submitted.</p>
      </div>
    ),
    content: (
      <div className="flex items-center justify-center pt-2">
        <span>
          <p className="pb-2 text-base">👇Here is the form on Family Social where the link in the invitation email will redirect you.👇</p>
          <img
            src="images/support/faq-registration.jpg"
            alt="Family Registration screenshot"
          // style={ { maxWidth: '300px', marginTop: 12, borderRadius: 8 } }
          />
          <span className="flex flex-col items-start gap-2 mt-4 text-base">
            <p>The form is filled in with the information the family founder provided to inviting you.</p>
            <ul className="list-disc ml-6 mt-2">
              <li>Confirm your first and last name.</li>
              <li>The <i>nick name</i> and <i>cell phone</i> fields are optional. You can change them after registration. </li>
              <li>The two password fields <b>must be filled in</b>. The passwords must match and must be at least 5 characters long.</li>
            </ul>
            <p><b>Tip:</b> Unhide the passwords when you are entering them and validate they are the same and it's something you can remember.</p>
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
          <p>After you register there is a link on the page to take you to the login page. However, you can always find the login on the Family Social homepage.</p>
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
        <p className="text-xs text-slate-600">It's easy to do, just follow these steps.</p>
      </div>
    ),
    content: (
      <div className="grid md:grid-cols-2 text-base gap-2 mt-4">
        <span className="flex flex-col items-start gap-2 mt-4">
          <p>If you have forgotten your password, you can reset it by following these steps:</p>
          <ol className="list-decimal ml-6 mt-2">
            <li>Go to the login page.</li>
            <li>Click on "Forgot Password". 👉</li>
            <li>Enter your email address and submit the form.</li>
          </ol>
          <span className="flex flex-col items-start gap-2 mt-4">
            <p>You will receive a link to reset your password on the Family Social site. The link expires in 1 hour, so check your email promptly.</p>
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
        <p className="text-base font-semibold">I've signed in! Now what?</p>
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
          <p>On the Family Social main page header, select the <b>Settings</b> option and follow the steps below.</p>
          <ol className="list-decimal ml-6 mt-2 py-2">
            <li>In Settings, select the <b>My Account</b> option.</li>
            <li>In My Account header, click on the <b>Upload Profile Image</b> option.</li>
            <li>Upload a good mugshot of yourself. Follow the recommended guidelines for image size and format.</li>
            <li>Once uploaded <b>Go Back</b> to My Account add <u>optional</u> info, like <i>cell number</i>, <i>nick name</i>, and your <i>birthday</i>.</li>
            <li>Open the <b>My Settings</b> tab and select which Family Social features you would like to be notified when someone posts or interacts with your content.</li>
            <li>Open the <b>My Family</b> tab to see all your family members.</li>
            <li>If you would like to recommend a new family member fill out the <b>Suggest New Family Member</b> form and submit it.
              The family founder will get a private message in Family Threads about your suggestion.</li>
          </ol>
        </span>
      </div>
    ),
    icon: FileText,
  },
]
export const founderFaqItems = [
  {
    value: "item-30",
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
          <p>At the present time, an email address is the only means of identifying family members.</p>
          <ol className="list-decimal ml-6 mt-2">
            <li>Each family member must have a unique email address.</li>
            <li>If you are the family founder, you cannot start another family using your current email address.</li>
            <li>If a family member belongs to another family, they cannot join a new family without leaving their current one.</li>
            <li>The family founder can invite new members and remove existing members from the family, if necessary.</li>
          </ol>
        </span>
      </div>
    ),
    icon: FileText,
  },
  {
    value: "item-50",
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
            <ol className="list-decimal ml-6 mt-2">
              <li>Family member who wants to retire sends a high-priority thread to the family founder.</li>
              <li>The family founder acknowledges the request and initiates the removal process.</li>
              <li>There's a "soft" removal which temporarily deactivates the member's access and sets the status to "retired". This allows the member's posts and comments to remain intact.</li>
              <li>There's a "hard" removal which permanently removes the member from the family. This action removes the member and their content from the family.</li>
            </ol>
            <p className="pt-2">There are two ways the founder can remove the member.</p>
            <ol className="list-decimal ml-6 mt-2">
              <li>"soft" removal: effectively deactivates the member's access and sets the status to "retired". This allows the member's posts and comments to remain intact.</li>
              <li>"hard" removal: permanently removes the member from the family by deleting the member and all of their content from the family.</li>
            </ol>
          </span>
        </div>
      </div>
    ),
    icon: FileText,
  },
]
export const featureFaqItems = [
  {
    value: "item-10",
    category: "TV and Movie Reviews",
    trigger: (
      <div>
        <p className="text-base font-semibold">What's the general layout of the TV Junkies home page?</p>
        <p className="text-xs text-slate-600">The <i>Movie Maniacs</i>, <i>Music Lovers</i>, and <i>Family Foodies</i> layouts are similar in behavior.</p>
      </div>
    ),
    content: (
      <div className="grid md:grid-cols-1 text-base">
        <span>
          <div className="flex justify-center pb-4">
            <img
              src="/images/support/faq-tv-home.jpg"
              alt="TV Junkies Home"
              style={ { maxWidth: '900px', maxHeight: '800px', marginTop: 12, borderRadius: 8 } }
            />

          </div>
          <p className="text-base font-semibold">The TV Junkies home page let's you find shows that have been reviewed by others in the family.</p>
          <ol className="list-decimal ml-6 mt-2 text-sm">
            <li>The <b>Show Finder</b> let's you type in a name, a genre, a family member.</li>
            <li>When you find what you're looking for you can select it and see <b>View the Show</b>.</li>
            <li>In the <b>Show Type</b> selector you can toggle between the <b>Latest TV Shows</b> or the <b>Top Rated TV Shows</b>. </li>
            <li>The <b>TV Picks</b> gallery lets you scroll through the latest or highest rates shows at a glance.</li>
            <li>The <b>Show Reactions</b> allow you to like or love a show and post your own comment about it.</li>
          </ol>
          <p className="pt-2"></p>
        </span>
      </div>
    ),
    icon: FileText,
  },
  {
    value: "item-20",
    category: "TV and Movie Reviews",
    trigger: (
      <div>
        <p className="text-base font-semibold">How do I add a TV show review?</p>
        <p className="text-xs text-slate-600">It works the same way in <i>Movie Maniacs</i>, <i>Music Lovers</i>, and <i>Family Foodies</i> as well.</p>
      </div>
    ),
    content: (
      <div className="grid md:grid-cols-1 text-base">
        <span>
          <p className="text-base font-semibold">Adding a TV show review is easy. Start by clicking on the "Add Show" button in the upper right corner.</p>
          <ol className="list-decimal ml-6 mt-2 text-sm">
            <li>Start with a good template. Family Social provides a "Global" template, but a family member can create their own.</li>
            <li>When you pick a template it will prefill the review edit area with helpful headings.</li>
            <li>Next, start filling in the general information about the show, starting at the top of the page.</li>
            <li>Find a good image of the show or even easier, a website link to IMDB or YouTube. There's a separate FAQ on uploading images.</li>
            <li>Tag the show with relevant keywords to make it easier for others to find.</li>
            <li>Don't forget to rate the show! Chances are it will always be <i>Love</i> but maybe you've come back and changed it to <i>Like</i>.</li>
            <li>Your show can be in <b>Draft</b> mode until you decide to <b>Publish</b> it and make the review visible to others.</li>
          </ol>
          <div className="flex justify-center pt-2 pb-2">
            <img className="aspect-auto object-cover w-100 h-75 md:w-200 md:h-150"
              src="/images/support/faq-add-tv-show.jpg"
              alt="Add TV Show"
            />
          </div>
          <div className="flex justify-center align-middle pb-4">
            <Heart size={ 40 } className="inline-block mr-1" />
            <p className="text-sm pt-2">When writing your review (see 2️⃣ above), make use of external websites that provide information about the show. We recommend the IMDB site. You can add a link in your review to the show on IMDB!</p>
          </div>
          <div className="flex justify-center align-middle pb-4">
            <Info size={ 30 } className="inline-block mr-1" />
            <p className="text-sm pt-2">When you create and submit a review, you are the only person who can edit the show. Other members may only react or add comments about your show.</p>
          </div>
        </span>
      </div>
    ),
    icon: FileText,
  },
  {
    value: "item-30",
    category: "TV and Movie Reviews",
    trigger: (
      <div>
        <p className="text-base font-semibold">Why TV show image uploads require special handling?</p>
        <p className="text-xs text-slate-600">The same applies to <i>Movie Maniacs</i> as well.</p>
      </div>
    ),
    content: (
      <div className="grid md:grid-cols-1 text-base">
        <span>
          <p className="text-base font-semibold">You found some great TV show image but wait, don't upload it just yet! There are licensing considerations!</p>
          <ol className="list-decimal ml-6 mt-2 text-sm">
            <li>Google is just a search engine and it will return wonderful images but they are <u>licensed</u>.</li>
            <li>You need to find images that are either in the public domain (good luck with that) or that have a Creative Commons license which allows for reuse.</li>
            <li>So, if you want to use an image, you <u>must</u> provide proper attribution for the image.</li>
            <li>If you don't know what any of this means, consider an alternative which is to reference the show via IMDB or YouTube.</li>
          </ol>
          <div className="flex justify-center pt-2 pb-2">
            <img className="aspect-auto object-cover w-100 h-65 md:w-205 md:h-100"
              src="/images/support/faq-tv-image-credit.jpg"
              alt="Add TV Show"
            />
          </div>
          <div className="flex justify-center align-middle pb-4">
            <CircleAlert size={ 30 } className="inline-block mr-1 text-red-500" />
            <p className="text-base pt-2 font-semibold">The important message here is to always provide proper attribution for any image you use.</p>
          </div>
        </span>
      </div>
    ),
    icon: FileText,
  },
  {
    value: "item-40",
    category: "TV and Movie Reviews",
    trigger: (
      <div>
        <p className="text-base font-semibold">I want to try to use an image. How do I find Creative Commons images?</p>
        <p className="text-xs text-slate-600">This answer also applies to <i>Movie Maniacs</i>, <i>Music Lovers</i>, and <i>Family Foodies</i>.</p>
      </div>
    ),
    content: (
      <div className="grid md:grid-cols-1 text-base">
        <span>
          <p className="text-base font-semibold">The instructions for finding Creative Commons images are as follows:</p>
          <ol className="list-decimal ml-6 mt-2 text-sm">
            <li>In Google/Images, select <i>Tools ➡️ Usage Rights ➡️ Creative Common Licenses</i> and perform the image search.</li>
            <li>If you aren't seeing much in the way of results, try different search terms or check other image repositories.</li>
            <li>Generally only actor or press release images are common licensed. Wikimedia is a good source for such images.</li>
            <li>Select the image you want to use (see <i>Example 1</i> below) and scroll down to see the <b>Image Credit</b> information.</li>
            <li>Copy the Image Credit information (see <i>Example 2</i>) to your clipboard and paste it into the Credit Information field in the Add Show dialog.</li>
          </ol>
          <p className="pt-2 text-base font-semibold">Google Search Examples</p>
          <p className="pt-2 text-sm">1. The image below shows an example of where to find the link to Image Credit information in a Google/Image search.</p>
          <div className="flex justify-center pt-2 pb-2">
            <img className="aspect-auto object-cover w-100 h-75 md:w-170 md:h-110"
              src="/images/support/faq-google-commons-link.jpg"
              alt="Google Common License Link"
            />
          </div>
          <p className="pt-2 text-sm">2. Scroll down the page and copy the <b>Licensing information</b> to your clipboard which is to be pasted into the <b>Credit Information </b> field in the Add Show dialog.</p>
          <div className="flex justify-center pt-2 pb-2">
            <img className="aspect-auto object-cover w-100 h-75 md:w-180 md:h-80"
              src="/images/support/faq-google-commons-text.jpg"
              alt="Common License Text"
            />
          </div>
        </span>
      </div>
    ),
    icon: FileText,
  },
  {
    value: "item-50",
    category: "TV and Movie Reviews",
    trigger: (
      <div>
        <p className="text-base font-semibold">How do I use an IMDB or YouTube link rather than an image of the show?</p>
        <p className="text-xs text-slate-600">This answer also applies <i>anywhere</i> you upload an image.</p>
      </div>
    ),
    content: (
      <div className="grid md:grid-cols-1 text-base">
        <span>
          <p className="text-base font-semibold">Perform these steps in IMDB or YouTube.</p>
          <ol className="list-decimal ml-6 mt-2 text-sm">
            <li>Go to IMDB or YouTube and find the TV Show you want to use.</li>
            <li>Copy the URL of the TV Show to your clipboard.</li>
            <li>In Family Social TV Junkies home page, select the Add Show option and complete the form as instructed below.</li>
          </ol>
          <div className="flex justify-center pt-2 pb-2">
            <img className="aspect-auto object-cover w-100 h-75 md:w-230 md:h-110"
              src="/images/support/faq-tv-imdb-url.jpg"
              alt="IMDB Link"
            />
          </div>
          <p className="text-base font-semibold">In Family Social TV Junkies <b>Add Show</b>:</p>
          <ol className="list-decimal ml-6 mt-2 text-sm">
            <li>Enter the <b>Show Name</b> as you want it to appear in the home page.</li>
            <li>By default, the <b>Show Image Option</b> is set to <u>Option 2</u> to enter a Show Site URL</li>
            <li>Paste the URL you copied from IMDB or YouTube into the <b>Show Site URL</b> field.</li>
            <li>Select one of five <b>background colors</b> to be used when your show is displayed.</li>
            <li>Complete the rest of the form and add or update your show review.</li>
          </ol>
        </span>
      </div>
    ),
    icon: FileText,
  },
  {
    value: "item-60",
    category: "Music Lovers",
    trigger: (
      <div>
        <p className="text-base font-semibold">How do I add Music Lyrics for an Album I created in the Music Lovers feature?</p>
        <p className="text-xs text-slate-600">Lyrics have a different twist that you won't find in the other features.</p>
      </div>
    ),
    content: (
      <div className="grid md:grid-cols-1 text-base">
        <span>
          <p className="text-base font-semibold">The short answer is that Lyrics are associated with a <b>Song</b> and not an <b>Album</b>.</p>
          <ol className="list-decimal ml-6 mt-2 text-sm">
            <li>Select <b>Add Music</b> at the top right of the Music Lovers heading.</li>
            <li>If you look right above the Music Image section, you'll see the <b>Type</b> option defaults to <i>Song</i>.</li>
            <li>Add information relevant to your song and <b>Save the Song</b>.</li>
            <li>Once the song is safely saved, you can add lyrics to it by choosing the <b>Add Lyrics</b> button. </li>
          </ol>
          <div className="flex justify-center pt-2 pb-2">
            <img className="aspect-auto object-cover w-100 h-75 md:w-200 md:h-80"
              src="/images/support/faq-edit-song-lyrics.jpg"
              alt="Music Lyrics"
            />
          </div>
          <p className="text-base font-semibold">As shown above, when adding the Lyrics:</p>
          <ol className="list-decimal ml-6 mt-2 text-sm">
            <li>If you paste in lyrics (which most likely you will do), be sure to add blank lines between the song verses.</li>
            <li>When you are about to save the song lyrics, change the status to <b>Published</b> if you are ready for others to see the Lyrics.</li>
            <li>Be sure to <b>Save the Lyrics</b>.</li>
          </ol>
        </span>
      </div>
    ),
    icon: FileText,
  },
]
