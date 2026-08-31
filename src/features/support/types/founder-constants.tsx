import { FileText, Info } from "lucide-react";

export function founderFaqItems(setupStartUrl: string) {
  return [
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
}
