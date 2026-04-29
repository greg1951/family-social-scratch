import { FileText, Folder, LucideIcon, Settings, Users, HelpCircle, Icon } from "lucide-react";

export const faqItems = [
  {
    value: "item-1",
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
              <source src="/videos/faq-change-plan.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>

          </span>

        </div>
      </div>
    ),
    icon: Settings,
  },
  {
    value: "item-2",
    category: "Family Social",
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
          <p style={ { marginTop: 8 } }>
            <a href="https://kbgfamilysocial.com/family-setup-home" target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">Start a Family today!</a>
          </p>
        </span>
        <div className="flex items-center justify-center mt-0">
          <img
            src="images/support/faq-family-setup-start.jpg"
            alt="Family setup screenshot"
            style={ { maxWidth: '500px', maxHeight: '500px', marginTop: 12, borderRadius: 8 } }
          />

        </div>
      </div>
    ),
    icon: FileText,
  },
  {
    value: "item-3",
    category: "Family Social",
    trigger: (
      <div>
        <p className="text-base font-semibold">I can't find my family invitation email. Was it sent?</p>
        <p className="text-xs text-slate-600">It's not always easy to find that doggone email in your inbox.</p>
      </div>
    ),
    content: (
      <div className="grid md:grid-cols-1 text-base">
        <span className="py-2">
          <p>The email invitation from your family founder is from <b>family.social</b> and seldom is it in your inbox the first time.</p>
          <ul className="list-disc ml-6 mt-2">
            <li>Search your inbox for "Family Social".</li>
            <li>Check your spam/junk folder and any other tabs like promotions or updates.</li>
            <li>Mark it as "Not Spam" to ensure future emails are delivered to your inbox.</li>
          </ul>
          <p>The email invitation contains a link to register yourself in the family account. The link will expire in one week.</p>
        </span>
      </div>
    ),
    icon: FileText,
  },
  {
    value: "item-4",
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
    value: "item-5",
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
    value: "item-6",
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
    value: "item-7",
    category: "Account Profile",
    trigger: (
      <div>
        <p className="text-base font-semibold">Alright, I've signed in! Now what?</p>
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
            <li>Once uploaded <b>Go Back</b> to My Account add <u>optional</u> info, like <i>cell number</i>, <i>nick name</i>, and select your <i>birthday</i>.</li>
            <li>Open the <b>My Settings</b> tab and select which Family Social features you would like to be notified when someone posts or interacts with your content.</li>
            <li>Open the <b>My Family</b> tab to see all your family members.</li>
            <li>If you would like to recommend a new family member fill out the <b>Suggest New Family Member</b> form and submit it. The family founder will get a private message from you about your suggestion.</li>
          </ol>
        </span>
      </div>
    ),
    icon: FileText,
  },
]
