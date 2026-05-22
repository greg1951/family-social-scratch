import { FileText, Folder, Settings, Users, HelpCircle, Info, Heart, CircleAlert } from "lucide-react";

export const generalFaqItems = [
  {
    value: "item-10",
    category: "My Family Social",
    trigger: (
      <div>
        <p className="text-base font-semibold">What is My Family Social?</p>
        <p className="text-xs text-slate-600">Learn about our platform and features.</p>
      </div>
    ),
    content: (
      <div className="grid md:grid-cols-2 text-base">
        <span>
          <p>My Family Social is a platform that helps families stay connected and organized. All of the features are available during trial period.</p>
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
        <p className="text-base font-semibold">How to create a family in My Family Social?</p>
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
          <p className="pt-2 italic pb-2">If you are already registered in My Family Social, you must use a different email to create a new family.</p>
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
    category: "My Family Social",
    trigger: (
      <div>
        <p className="text-base font-semibold">What does the My Family Social Registration form look like?</p>
        <p className="text-xs text-slate-600">It's a simple form but you need to fill it out correctly because of the credentials it will create when submitted.</p>
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
          <p>On the My Family Social main page header, select the <b>Settings</b> option and follow the steps below.</p>
          <ol className="list-decimal ml-6 mt-2 py-2">
            <li>In Settings, select the <b>My Account</b> option.</li>
            <li>In My Account header, click on the <b>Upload Profile Image</b> option.</li>
            <li>Upload a good mugshot of yourself. Follow the recommended guidelines for image size and format.</li>
            <li>Once uploaded <b>Go Back</b> to My Account add <u>optional</u> info, like <i>cell number</i>, <i>nick name</i>, and your <i>birthday</i>.</li>
            <li>Open the <b>My Settings</b> tab and select which My Family Social features you would like to be notified when someone posts or interacts with your content.</li>
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
              <li>Family member who wants to leave a family needs to let the family founder know via a private message in Family Threads.</li>
              <li>That family member should select and fill in the <b>Leave a Family Notification</b> template in Family Threads.</li>
              <li>When the family founder gets the message the founder will remove the member in the Founder Account settings.</li>
            </ul>
            <p className="pt-2">The founder can remove the member using one of two methods:</p>
            <ul className="list-disc ml-6 mt-2">
              <li>"soft" delete: effectively deactivates the member's access and sets the status to "retired". This allows the member's posts and comments to remain intact, known as "Retired Member". The retired member could be reactivated at a later time.</li>
              <li>"hard" delete: permanently removes the member from the family by deleting the member and all of their content from the family. The member could be reinvited at a later time.</li>
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
            <li>Start with a good template. My Family Social provides a "Global" template, but a family member can create their own.</li>
            <li>When you pick a template it will prefill the review edit area with helpful headings.</li>
            <li>Next, start filling in the general information about the show, starting at the top of the page.</li>
            <li>Find a good image of the show or even easier, a website link to IMDB or YouTube. There's a separate FAQ on uploading images.</li>
            <li>Tag the show with relevant keywords to make it easier for others to find.</li>
            <li>Don't forget to rate the show! Chances are it will always be <i>Love</i> but maybe you've come back and changed it to <i>Like</i>.</li>
            <li>Your show can be in <b>Draft</b> mode until you decide to <b>Publish</b> it and make the review visible to others.</li>
          </ol>
          <div className="flex justify-center pt-2 pb-2">
            <img className="aspect-auto object-cover w-130 h-95 md:w-200 md:h-150"
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
        <p className="text-xs text-slate-600">Images must be properly credited to comply with Fair Use guidelines in copyright laws.</p>
      </div>
    ),
    content: (
      <div className="grid md:grid-cols-1 text-base">
        <span>
          <p className="text-base font-semibold">You found some great TV show image but wait, don't upload it just yet! There are licensing considerations!</p>
          <ol className="list-decimal ml-6 mt-2 text-sm">
            <li>Google is just a search engine and it will return wonderful images but they are <u>licensed</u>.</li>
            <li>In My Family Social they are used not for commercial purposes but for reviews and discussion. This means they must be credited to comply with <u>Fair Use guidelines</u>.</li>
            <li>Fair Use image attribution requires a <b>Title</b> and a <b>Source</b>.</li>
            <pre className="pt-2 pb-2">
              <code>
                Title: [Source Name] | Source: [image URL]
              </code>
            </pre>
            <li>The <i>Title</i> is simply where the image was found, e.g. Flikr, Netflix, MovieWeb, Hulu, IMDB, YouTube, etc.</li>
            <li>The <i>Source</i> is the URL to the original image or website where it was found.</li>
            <li>The format shown here is required, otherwise the <u>upload will not be permitted</u>.</li>
          </ol>
          <div className="flex justify-center pt-2 pb-2">
            <img className="aspect-auto object-cover w-150 h-85 md:w-220 md:h-120"
              src="/images/support/faq-tv-image-credit.jpg"
              alt="TV Show Image Credit"
            />
          </div>
        </span>
      </div>
    ),
    icon: FileText,
  },
  {
    value: "item-35",
    category: "Discussion Groups",
    trigger: (
      <div>
        <p className="text-base font-semibold">Nearly all of the features have Discussion Threads. What are they and how do they work?</p>
        <p className="text-xs text-slate-600">Discussion Threads, unlike comments, provide a space for more in-depth conversations and interactions among the family members.</p>
      </div>
    ),
    content: (
      <div className="grid md:grid-cols-1 text-base">
        <span>
          <p className="text-base font-semibold">Discussion Threads provide a space for more in-depth conversations and interactions among family members.</p>
          <ul className="list-disc ml-6 mt-2 text-sm">
            <li>A TV show or movie can have multiple discussion threads, depending on who wants to start one.</li>
            <li>The family member who starts a discussion becomes the moderator of the thread. (Don't worry, there's no moderation tasks to do!)</li>
            <li>When the moderator creates a discussion thread, they define a short caption which is a call to action for the discussion. </li>
            <li>The moderator should post their opinion about the show or movie and invite others to question that opinion. This will hopefully generate discussion?</li>
          </ul>
          <p className="text-base font-semibold pt-2 pb-2">Some of the basic mechanics of posting and replying are described below.</p>
          <ol className="list-decimal ml-6 mt-2 text-sm">
            <li><u>Greg</u> posted a seemingly contentious discussion topic, to which <u>George</u> promptly responded.</li>
            <li><u>George</u> further selected a <i>Thumbs Down</i> on <u>Greg's</u> post!</li>
            <li>After replying, <u>George</u> can return and edit his reply if needed.</li>
            <li>When editing a post or reply, the rich text editor provides formatting options like adding a link to <u>George</u>'s favorite Batman.</li>
          </ol>
          <div className="flex justify-center pt-2 pb-2">
            <img className="aspect-auto object-cover w-120 h-95 md:w-220 md:h-180"
              src="/images/support/faq-discuss-post-reply.jpg"
              alt="Discussion Group Post Reply"
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
        <p className="text-base font-semibold">How do I use an IMDB or YouTube link?</p>
        <p className="text-xs text-slate-600">IMDB or YouTube links can be used and can be combined with an image as well!.</p>
      </div>
    ),
    content: (
      <div className="grid md:grid-cols-1 text-base">
        <span>
          <p className="text-base font-semibold">Perform these steps in IMDB or YouTube.</p>
          <ol className="list-decimal ml-6 mt-2 text-sm">
            <li>Go to IMDB or YouTube and find the TV Show you want to use.</li>
            <li>Copy the URL of the TV Show to your clipboard.</li>
            <li>In My Family Social TV Junkies home page, select the Add Show option and complete the form as instructed below.</li>
          </ol>
          <div className="flex justify-center pt-2 pb-2">
            <img className="aspect-auto object-cover w-150 h-95 md:w-230 md:h-130"
              src="/images/support/faq-tv-imdb-url.jpg"
              alt="IMDB Link"
            />
          </div>
          <p className="text-base font-semibold">In My Family Social TV Junkies <b>Add Show</b>:</p>
          <ol className="list-decimal ml-6 mt-2 text-sm">
            <li>Enter the <b>Show Name</b> as you want it to appear in the home page.</li>
            <li>Paste the URL you copied from IMDB or YouTube into the <b>Show Site URL</b> field.</li>
            <li>Select one of five <b>background colors</b> to be used when your show is displayed.</li>
            <li>Complete the rest of the form and add or update your show review.</li>
          </ol>
          <p className="text-base font-semibold pt-2">On the home page, this show will display the title and background in place of an image which was not provided.</p>
          <ol className="list-decimal ml-6 mt-2 text-sm">
            <li>Where an image would be shown, now the title and background are shown instead.</li>
            <li>The Show Title below the image is a link that will take you to the show's page.</li>
          </ol>
          <div className="flex justify-center pt-4">
            <img className="aspect-auto object-cover w-100 h-75 md:w-230 md:h-160"
              src="/images/support/faq-tv-no-image-only-url.jpg"
              alt="IMDB Link"
            />
          </div>
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
            <img className="aspect-auto object-cover w-190 h-65 md:w-200 md:h-80"
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
  {
    value: "item-70",
    category: "Family Foodies",
    trigger: (
      <div>
        <p className="text-base font-semibold">What are recipe templates and how do I use them?</p>
        <p className="text-xs text-slate-600">Here we will address how to create a recipe template.</p>
      </div>
    ),
    content: (
      <div className="grid md:grid-cols-1 text-base">
        <span>
          <p className="text-base font-semibold">Writing a recipe can be time consuming, but we think we've made it easier with our recipe templates.</p>
          <ol className="list-decimal ml-6 mt-2 text-sm">
            <li>Select the <b>Manage Templates</b> button in the Family Foodies heading.</li>
            <li>By default the General Template will be shown. Selecting it will allow you to preview its content. However, you cannot edit this template.</li>
            <li>To create a new template, select the <b>Create Template</b> button.</li>
            <li>In all likelihood, you have your recipe written up nicely in a document or text editor. You can copy and paste it into the template.</li>
          </ol>
          <span className="flex justify-left pt-2 pb-2">
            <CircleAlert size={ 30 } className="inline-block mr-1" />
            <p className="text-base font-semibold pt-2 pb-2">Remember this is a template you want to use when adding recipes, not your actual recipe.</p>
          </span>
          <div className="flex justify-center pt-2 pb-2">
            <img className="aspect-auto object-cover w-180 h-95 md:w-220 md:h-110"
              src="/images/support/faq-foodies-edit-template.jpg"
              alt="Recipe Template"
            />
          </div>
          <p className="text-base font-semibold pt-2 pb-2">As shown above, when adding the Recipe Template:</p>
          <ol className="list-decimal ml-6 mt-2 text-sm">
            <li>Provide a name for the recipe template that bespeaks its content value.</li>
            <li>In the main template text area, paste in an example of one your recipes, or type away!</li>
            <p className="pt-2 pb-2">Now <u>genericize</u> the template details. Leave in a few minor details just to provide some intent in the template.</p>
            <li>Change the status from <b>Draft</b> to <b>Published</b>, if your ready to use the template.</li>
            <li>Be sure to <b>Create the Template</b>.</li>
          </ol>
          <p className="text-base font-semibold pt-2 pb-2">Notice in the list of templates that your template is editable, <u>by you, no one else!</u></p>
          <div className="flex justify-center pt-2 pb-2">
            <img className="aspect-auto object-cover w-100 h-75 md:w-220 md:h-90"
              src="/images/support/faq-foodies-editable-new-template.jpg"
              alt="Recipe Template"
            />
          </div>
        </span>
      </div>
    ),
    icon: FileText,
  },
  {
    value: "item-80",
    category: "Family Foodies",
    trigger: (
      <div>
        <p className="text-base font-semibold">How best to add a recipe in the Family Foodies feature?</p>
        <p className="text-xs text-slate-600">Adding a recipe is easier with a template and following some of the suggestions here.</p>
      </div>
    ),
    content: (
      <div className="grid md:grid-cols-1 text-base">
        <span>
          <p className="text-base font-semibold">Ahead of creating your recipe, review the available templates and decide which one best fits your needs.</p>
          <p className="text-sm text-slate-600">If you have a recipe already written, you can paste it right in to the new recipe dialog.</p>
          <ol className="list-decimal ml-6 mt-2 text-sm">
            <li>Select the <b>Add Recipe</b> button in the Family Foodies heading.</li>
            <p className="pt-2 pb-2"><u>Note:</u> Using a template is optional. If you don't use a template you have to jam the recipe content in manually.</p>
            <li>When you select a template, it will prefill the Recipe edit area below. Pick different template and see which template fits your needs.</li>
          </ol>
          <div className="flex justify-center pt-2 pb-2">
            <img className="aspect-auto object-cover w-180 h-75 md:w-220 md:h-80"
              src="/images/support/faq-foodies-add-recipe-templates-list.jpg"
              alt="Recipe Templates list"
            />
          </div>
          <p className="text-base font-semibold pt-2 pb-2">Do you have a good picture of your delicious dish? Upload it to make your recipe more appealing!</p>
          <ol className="list-decimal ml-6 mt-2 text-sm">
            <li>Click your mouse inside the <b>Choose File</b> field and a file dialog will appear.</li>
            <li>If you are happy with the image preview, select the <b>Upload Image</b> button.</li>
          </ol>
          <div className="flex justify-center pt-2 pb-2">
            <img className="aspect-auto object-cover w-150 h-75 md:w-220 md:h-80"
              src="/images/support/faq-foodies-add-recipe-file-upload.jpg"
              alt="Recipe File Upload"
            />
          </div>
          <p className="text-base font-semibold pt-2 pb-2">Don't forget the Pro Tips section at the bottom of the recipe dialog!</p>
          <ul className="list-decimal ml-6 mt-2 text-sm">
            <li>If you have any time- or cost-saving tips, be sure to include them in the Pro Tips section.</li>
            <li>If you originally got the recipe from another source and then changed it, be sure to credit the original source in the Pro Tips section.</li>
          </ul>
          <div className="flex justify-center pt-2 pb-2">
            <img className="aspect-auto object-cover w-170 h-65 md:w-220 md:h-80"
              src="/images/support/faq-foodies-pro-tips.jpg"
              alt="Pro Tips"
            />
          </div>
        </span>
      </div>
    ),
    icon: FileText,
  },
  {
    value: "item-90",
    category: "Poetry Cafe",
    trigger: (
      <div>
        <p className="text-base font-semibold">Poetry is a very technical art form. What resources are available to help with the terminology?</p>
        <p className="text-xs text-slate-600">Poetry has been around for thousands of years and has a rich vocabulary of terms and techniques.</p>
      </div>
    ),
    content: (
      <div className="grid md:grid-cols-1 text-base">
        <span>
          <p className="text-base font-semibold">Visit the Poetry Terms page for poetry definitions and explanations.</p>
          <p className="text-sm text-slate-600">My Family Social provides a dictionary of poetry terms to help define terms you may see in the poetry submissions.</p>
          <ol className="list-decimal ml-6 mt-2 text-sm">
            <li>Select the <b>Poetry Terms</b> button in the <b>Poetry Cafe</b> heading.</li>
            <li>A term search field is provided or scroll the list to find a term.</li>
            <li>Selecting the term will display its definition and explanation.</li>
          </ol>
          <div className="flex justify-center pt-2 pb-2">
            <img className="aspect-auto object-cover w-220 h-55 md:w-270 md:h-60"
              src="/images/support/faq-poetry-term-search.jpg"
              alt="Poetry Term Search"
            />
          </div>
        </span>
      </div>
    ),
    icon: FileText,
  },
  {
    value: "item-91",
    category: "Poetry Cafe",
    trigger: (
      <div>
        <p className="text-base font-semibold">I have a long poem I'd like to submit. How difficult will it be to post it?</p>
        <p className="text-xs text-slate-600">Can you cut and paste?</p>
      </div>
    ),
    content: (
      <div className="grid md:grid-cols-1 text-base">
        <span>
          <p className="text-base font-semibold">Here we'll focus on the Poetry Verse and the Poem Analysis sections of that form.</p>
          <p className="text-sm text-slate-600"></p>
          <ol className="list-decimal ml-6 mt-2 text-sm">
            <li>Select <b>Add Poem</b> from the Poetry Cafe home page.</li>
            <li>If you were able to copy the poem verse, paste it into the <b>Poem Text</b>. See the example below.</li>
            <p className="pt-2 pb-2 text-xs"><u>Note:</u> Sometimes when you paste into the Poem Text area you lose the blank lines between verses. Add those back in the editor.</p>
            <li>In the <b>Poem Text</b> a numbered column appears next to each line of the poem.</li>
            <li>In the <b>Poem Analysis</b> section, you can provide your interpretation and insights about the poem, referencing <u>line numbers</u>.</li>
          </ol>
          <div className="flex justify-center pt-2 pb-2">
            <img className="aspect-auto object-cover w-170 h-80 md:w-250 md:h-120"
              src="/images/support/faq-poetry-verse-analysis.jpg"
              alt="Poetry Verse Analysis"
            />
          </div>
        </span>
      </div>
    ),
    icon: FileText,
  },
  {
    value: "item-100",
    category: "Book Besties",
    trigger: (
      <div>
        <p className="text-base font-semibold">I like to read but I'm not sure how to get started with Book Besties. What do you recommend?</p>
        <p className="text-sm text-slate-600">First of all, you've already met the first criteria which is you like to read!</p>
      </div>
    ),
    content: (
      <div className="grid md:grid-cols-1 text-base">
        <span>
          <p className="text-base font-semibold">Book Besties provides a number of resources to get you going.</p>
          <ol className="list-decimal ml-6 mt-2 text-sm">
            <li>Book Besties provides a number of <b>sample book reviews</b>. Read those to get a sense of what a good review looks like.</li>
            <li>Visit the <b>Book Terms</b> page. There you'll find definitions and explanations for various book-related terms.</li>
            <p className="pt-2 pb-2 text-xs"><u>Tip</u>: Personalizing the review to your experience is the kind of review people enjoy reading.</p>
            <li>Write your own book review, incorporating what you've learned from the sample reviews and book terms.</li>
            <li>Keep your book review in Draft status until you're ready to submit it. Then, let it rip!</li>
            <p className="text-sm">Explore the Terms Page, there's a lot of good information to help you write better reviews.</p>
          </ol>
          <div className="flex justify-center pt-2 pb-2">
            <img className="aspect-auto object-cover w-150 h-95 md:w-220 md:h-125"
              src="/images/support/faq-book-terms.jpg"
              alt="Book Terms Page"
            />
          </div>
        </span>
      </div>
    ),
    icon: FileText,
  },
  {
    value: "item-101",
    category: "Book Besties",
    trigger: (
      <div>
        <p className="text-base font-semibold">I've read a wonderful book and want to share it with others. What's the best way to write it up?</p>
        <p className="text-sm text-slate-600">Book Besties provides a complete book club for the family!</p>
      </div>
    ),
    content: (
      <div className="grid md:grid-cols-1 text-base">
        <span>
          <p className="text-base font-semibold">Writing a book review is easy. Writing a good one takes a little more time and thought.</p>
          <p className="text-sm text-slate-600">Begin by selecting <b>Add Book</b> from the Book Besties home page.</p>
          <ol className="list-decimal ml-6 mt-2 text-sm">
            <li>Provide general <b>Book Details</b>.</li>
            <li>In the <b>Book Analysis</b> section, write your review.</li>
            <p className="pt-2 pb-2 text-xs"><u>Tip</u>: Personalizing the review to your experience is the kind of review people enjoy reading.</p>
            <li>There are three lists of <b>Book Tags</b> to choose from, pick at least one.</li>
          </ol>
          <div className="flex justify-center pt-2 pb-2">
            <img className="aspect-auto object-cover w-180 h-140 md:w-170 md:h-170"
              src="/images/support/faq-book-add-sections.jpg"
              alt="Book Review Sections"
            />
          </div>
        </span>
      </div>
    ),
    icon: FileText,
  },
  {
    value: "item-200",
    category: "Family Threads",
    trigger: (
      <div>
        <p className="text-base font-semibold">Why should I use Family threads? I can simply text someone!</p>
        <p className="text-sm text-slate-600">We're not trying to replace texting, but Family Threads offers a more organized and private way to communicate within your family.</p>
      </div>
    ),
    content: (
      <div className="grid md:grid-cols-1 text-base">
        <span>
          <p className="text-base font-semibold">Listed below are some reasons to use Family Threads.</p>
          <p className="text-sm">All of the reasons listed below have one thing in common: they help you stay connected with your family in a more organized and private way.</p>
          <ol className="list-decimal ml-6 mt-2 text-sm">
            <li>You're planning a family event around a certain date and want to know who can make it</li>
            <li>You've just shared some exciting news and want to see everyone's reactions</li>
            <li>You have a question or need advice from your family</li>
            <li>You want to share a special moment or achievement with your family</li>
            <li>You have some pictures you'd like your family to see</li>
            <li>You want to send a private message to a family member and don't want to text or email it</li>
          </ol>
          <div className="flex justify-center pt-2 pb-2">
            <img className="aspect-auto object-cover w-150 h-95 md:w-210 md:h-130"
              src="/images/support/faq-threads-pics.jpg"
              alt="Family Threads Pictures"
            />
          </div>
        </span>
      </div>
    ),
    icon: FileText,
  },
  {
    value: "item-300",
    category: "Photo Galleries",
    trigger: (
      <div>
        <p className="text-base font-semibold">I'm in the Family Photo Gallery but I don't see any way to upload pictures. How do I do this?</p>
        <p className="text-sm text-slate-600">The Family Photo Gallery is designed for viewing shared albums. To upload pictures, go to <b>My Gallery</b>.</p>
      </div>
    ),
    content: (
      <div className="grid md:grid-cols-1 text-base">
        <span>
          <p className="text-base font-semibold">Go to <b>My Gallery</b> and follow the steps below.</p>
          <ol className="list-decimal ml-6 mt-2 text-sm">
            <li>Upload pictures to your private photo gallery. No one has access to your gallery except you.</li>
            <li>Before uploading picture, edit the file names and provide a short meaningful name. After you upload, the file names will be used as photo captions. It will save you a little editing.</li>
            <li>In the upload dialog select the files you want to upload and click the upload button.</li>
            <li>The photos will be added to your family storage service, give it a  little time please!</li>
            <li>After they've uploaded, you can organize them into albums and share them with your family.</li>
            <li>If you add a short description to the pictures, that will be shown when family member mouse over your pictures.</li>
          </ol>
          <div className="flex justify-center pt-2 pb-2">
            <img className="aspect-auto object-cover w-100 h-120 md:w-150 md:h-180"
              src="/images/support/faq-member-gallery-add-album.jpg"
              alt="Photo Galleries Pictures"
            />
          </div>
        </span>
      </div>
    ),
    icon: FileText,
  },
  {
    value: "item-400",
    category: "Game Scoreboards",
    trigger: (
      <div>
        <p className="text-base font-semibold">What does the Game Scoreboard feature provide?</p>
        <p className="text-sm text-slate-600">Families play games. The Game Scoreboard feature allows you to track scores and rankings for a number of popular games.</p>
      </div>
    ),
    content: (
      <div className="grid md:grid-cols-1 text-base">
        <span>
          <p className="text-base font-semibold">In addition to tracking scores, there are leader boards, player stats and game history for each of the games.</p>
          <p className="text-sm ">Mexican Train, Acquire, Cricket (Darts) and Crokinole (for our California and our Canadian friends).</p>
          <ul className="list-disc ml-6 mt-2 text-sm">
            <li>It takes time to develop and perfect a game board. We will grow the game list over time.</li>
            <li>If there's a game we're missing, let us know by opening a support ticket and we'll take a look at adding it.</li>
          </ul>
          <p className="text-sm p-2">Shown below is an example of the Cricket dart game scoreboard. It uses a ledger entry format so the scores are automatically recorded.</p>
          <div className="flex justify-center pt-2 pb-2">
            <img className="aspect-auto object-cover w-120 h-90 md:w-230 md:h-180"
              src="/images/support/faq-game-cricket-scoreboard.jpg"
              alt="Game Scoreboard"
            />
          </div>
          <div className="flex justify-left">
            <Info size={ 30 } className="inline-block mr-1" />
            <p className="text-sm p-2">Note the <i>Leaderboard</i>, <i>Player Stats</i>, and <i>Game History</i> sections to the right of the scoreboard.</p>

          </div>
        </span>
      </div>
    ),
    icon: FileText,
  },
]


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
