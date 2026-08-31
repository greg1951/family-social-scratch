import { FileText } from "lucide-react";

export function generalFaqItems(setupStartUrl: string) {
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
