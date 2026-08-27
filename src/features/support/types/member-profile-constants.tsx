import { FileText } from "lucide-react";

export const memberProfileFaqItems = [
  {
    value: "item-10",
    category: "Member Profile",
    trigger: (
      <div>
        <p className="text-base font-semibold">There&apos;s a lot of content in the member profile. Tell me about it.</p>
        <p className="text-xs text-slate-600"> I&apos;ll address the buttons in the heading section as well as the four main tabs.</p>
      </div>
    ),
    content: (
      <div className="grid md:grid-cols-1 text-base">
        <span>
          <p className="text-base font-semibold">🎯At the top of the page, there are buttons that allow you to change your password or to upload your mugshot or avatar.</p>
          <ul className="list-disc ml-6 mt-2 text-sm pt-2 pb-2">
            <li>Every now and then, we recommend that you <b>change your password</b>. </li>
            <li>If you implement <b>multi-factor authentication</b> you will be sent a six-digit code in an email when you are logging into My Family Social.</li>
            <li>The <b>Upload Profile Mugshot</b> button allows you to upload your favorite mug shot or avatar to your profile that will then be shown in your posts and comments in my family social.</li>
          </ul>
          <p className="text-base font-semibold pt-2 pb-2">🎯 The content is divided into four different tabs.</p>
          <ol className="list-decimal ml-6 mt-2 text-sm">
            <li>The default tab is open to your main <b>Profile</b>. Here you may change your name, add a nickname if you choose to go by that. You can also provide your phone number and birthday as well.</li>
            <li>In the <b>Settings</b> tab, most of the options are optional, but here you can define the <u>music player</u> you prefer, and you can also turn off the <u>guided tours</u> that new members will default to initially.</li>
            <li>The <b>My Family</b> tab will show you the names of the members of the family. There&apos;s also a form where you can suggest to the family founder the names of other family members or friends that you would like to add to the family.</li>
            <li>In the <b>My Activity</b> tab, you can see metrics on how other people react to your posts and your activity on other members&apos; posts in the family.</li>
          </ol>
        </span>
      </div>
    ),
    icon: FileText,
  },
  {
    value: "item-20",
    category: "Member Profile",
    trigger: (
      <div>
        <p className="text-base font-semibold">What are the requirements when changing a password?</p>
        <p className="text-xs text-slate-600"> Eight letters, a number, and a special character</p>
      </div>
    ),
    content: (
      <div className="grid md:grid-cols-1 text-base">
        <span>
          <p className="text-base font-semibold">🫆 The password value rules are described below.</p>
          <ul className="list-disc ml-6 mt-2 text-sm pt-2 pb-2">
            <li>Eight letters, including both uppercase and lowercase</li>
            <li>At least one number</li>
            <li>At least one special character</li>
          </ul>
          <p className="text-base font-semibold pt-2 pb-2">🫆 If you are using a Google or Apple email address:</p>
          <ol className="list-decimal ml-6 mt-2 text-sm">
            <li>The password is used for a credential login and <u>must be created</u> in any case.</li>
            <li>Using the Google or Apple login is more convenient, as you can skip entering a password entirely.</li>
          </ol>
        </span>
      </div>
    ),
    icon: FileText,
  },
  {
    value: "item-21",
    category: "Member Profile",
    trigger: (
      <div>
        <p className="text-base font-semibold">What is MFA and why would I use it?</p>
        <p className="text-xs text-slate-600"> Multi-factor authentication further protects your account, even if your password is compromised.</p>
      </div>
    ),
    content: (
      <div className="grid md:grid-cols-1 text-base">
        <span>
          <p className="text-base font-semibold">🔒 If MFA is enabled, then a secret key is created that will be used in the following way.</p>
          <ul className="list-disc ml-6 mt-2 text-sm pt-2 pb-2">
            <li>The secret key is used to generate a time-based six-digit one-time passcode (OTP).</li>
            <li>The OTP will be emailed to you.</li>
            <li>The OTP is valid for a short period (2 minutes) of time.</li>
          </ul>
          <p className="text-base font-semibold">🔒 Enter the OTP into the login form.</p>
          <ol className="list-decimal ml-6 mt-2 text-sm p-1">
            <li>In your email, you will find a six-digit code.</li>
            <li>Enter the six-digit code into the login form and continue your login.</li>
            <li>If the OTP has expired, then simply request another OTP.</li>
          </ol>
        </span>
      </div>
    ),
    icon: FileText,
  },
  {
    value: "item-22",
    category: "Member Profile",
    trigger: (
      <div>
        <p className="text-base font-semibold">Does My Family Social provide a set of avatars that I can use?</p>
        <p className="text-xs text-slate-600">No. You can upload a good mug shot of yourself or your own favorite avatar instead.</p>
      </div>
    ),
    content: (
      <div className="grid md:grid-cols-1 text-base">
        <span>
          <p className="text-base font-semibold">🎨 Your mug shot or an avatar is just an image that you can upload.</p>
          <ul className="list-disc ml-6 mt-2 text-sm">
            <li>A good size for the headshot or avatar is a 160 by 160 pixels.</li>
            <li>Try to keep the image size to less than 2 MB if possible.</li>
          </ul>
        </span>
      </div>
    ),
    icon: FileText,
  },
  {
    value: "item-30",
    category: "Member Profile",
    trigger: (
      <div>
        <p className="text-base font-semibold">In the <b>My Profile</b> tab, what fields are the most important?</p>
        <p className="text-xs text-slate-600"> The most important fields are your first and last name.</p>
      </div>
    ),
    content: (
      <div className="grid md:grid-cols-1 text-base">
        <span>
          <p className="text-base font-semibold">🚶🏼 Most profile fields are optional.</p>
          <ul className="list-disc ml-6 mt-2 text-sm p-2">
            <li>Your <b>first and last name</b> are required.</li>
            <li>If you have a <b>nickname</b> that you would prefer to be used in My Family Social, then enter it.</li>
            <li>The <b>cell phone</b> and <b>birthday</b> are optional.</li>
          </ul>
        </span>
      </div>
    ),
    icon: FileText,
  },
  {
    value: "item-40",
    category: "Member Profile",
    trigger: (
      <div>
        <p className="text-base font-semibold">In the <b>My Settings</b> tab, what fields are the most important?</p>
        <p className="text-xs text-slate-600"> There are a number of settings that are most important. Expand this section for a description.</p>
      </div>
    ),
    content: (
      <div className="grid md:grid-cols-1 text-base">
        <span>
          <p className="text-base font-semibold">💾 Most settings are optional, but listed below are the more important ones.</p>
          <ul className="list-disc ml-6 mt-2 text-sm p-2">
            <li>The <b>preferred music player</b> should be defined, particularly if you have a Spotify account.</li>
            <li>By default, after you register to My Family Social, the <b>tour guide</b> option will be checked, as it is an invaluable tool to learn My Family Social.</li>
            <li>The <b>other notifications</b> option is important too, as there are weekly activity summaries sent to your my family social mailbox. If you want to be notified when one of your posts has been reacted to or commented on, make sure this option is checked.</li>
            <li>There are weekly <b>activity summaries</b> sent to your my family social mailbox. If you want to be notified when one of your posts has been reacted to or commented on, make sure this option is checked.</li>
            <li>If you want to be notified when one of your posts has been reacted to or commented on, then check the <b>Post Reactions</b> option.</li>
          </ul>
        </span>
      </div>
    ),
    icon: FileText,
  },
  {
    value: "item-50",
    category: "Member Profile",
    trigger: (
      <div>
        <p className="text-base font-semibold">What value does the <b>My Family</b> tab provide?</p>
        <p className="text-xs text-slate-600"> It provides a list of the members in the family as well as a form to invite future family members.</p>
      </div>
    ),
    content: (
      <div className="grid md:grid-cols-1 text-base ">
        <span className="pb-2">
          <p className="text-base font-semibold">❤️ The Family Founder is the one that controls the list of current and future family members and friends.</p>
          <ul className="list-disc ml-6 mt-2 text-sm">
            <li>The family founder information is shown at the top.</li>
            <li>Below it are cards for the current members in the family as well as invited members but who have not yet joined.</li>
          </ul>
        </span>
        <span>
          <p className="text-base font-semibold">❤️ At the bottom this is a form to suggest new family member or friend to be invited to the family.</p>
          <ul className="list-disc ml-6 mt-2 text-sm">
            <li>The family member who wants to invite someone would put in the first and last name of that family member or friend, as well as the email address.</li>
            <li>The suggestion will go to the family founder&apos;s mailbox in My Family Social. The family founder will review it and, in all likelihood, invite that person to join the family.</li>
          </ul>
        </span>
      </div>
    ),
    icon: FileText,
  },
  {
    value: "item-60",
    category: "Member Profile",
    trigger: (
      <div>
        <p className="text-base font-semibold">What are the <i>You</i> and <i>Family</i> charts that I see in the <b>My Activity</b> tab?</p>
        <p className="text-xs text-slate-600"> These charts provide a visual representation of your activity and your familys activity within the platform.</p>
      </div>
    ),
    content: (
      <div className="grid md:grid-cols-1 text-base ">
        <span className="pb-2">
          <p className="text-base font-semibold">👏 The <b>You Chart</b> shows your activity on other family members&apos; posts.</p>
          <ul className="list-disc ml-6 mt-2 text-sm">
            <li>When you react to another family member&apos;s post using 👍 or ❤️</li>
            <li>When you add a comment to another family member&apos;s post.</li>
          </ul>
        </span>
        <span>
          <p className="text-base font-semibold">👏 The <b>Family Chart</b> shows other members&apos; activity on your posts.</p>
          <ul className="list-disc ml-6 mt-2 text-sm">
            <li>When they react to your posts using 👍 or ❤️</li>
            <li>When they add a comment to your posts.</li>
          </ul>
        </span>
      </div>
    ),
    icon: FileText,
  },
];
