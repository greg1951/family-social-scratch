import { FileText } from "lucide-react";

export const poetryNookFaqItems = [
  {
    value: "item-10",
    category: "Poetry Nook",
    trigger: (
      <div>
        <p className="text-base font-semibold">Poetry is a very technical art form. What resources are available to help with the terminology?</p>
        <p className="text-xs text-slate-600">Poetry has been around for thousands of years and has a rich vocabulary of terms and techniques.</p>
      </div>
    ),
    content: (
      <div className="grid md:grid-cols-1 text-base pb-2 pt-2">
        <span>
          <p className="text-base font-semibold">Visit the Poetry Terms page for poetry definitions and explanations.</p>
          <p className="text-sm text-slate-600">My Family Social provides a dictionary of poetry terms to help define terms you may see in the poetry submissions.</p>
          <ol className="list-decimal ml-6 mt-2 text-sm pb-2 pt-2">
            <li>Select the <b>Poetry Terms</b> button in the <b>Poetry Nook</b> heading.</li>
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
    value: "item-11",
    category: "Poetry Nook",
    trigger: (
      <div>
        <p className="text-base font-semibold">I have a long poem I'd like to submit. How difficult will it be to post it?</p>
        <p className="text-xs text-slate-600">Can you cut and paste?</p>
      </div>
    ),
    content: (
      <div className="grid md:grid-cols-1 text-base pb-2 pt-2">
        <span>
          <p className="text-base font-semibold">Here we'll focus on the Poetry Verse and the Poem Analysis sections of that form.</p>
          <p className="text-sm text-slate-600"></p>
          <ol className="list-decimal ml-6 mt-2 text-sm pb-2 pt-2">
            <li>Select <b>Add Poem</b> from the Poetry Nook home page.</li>
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
    value: "item-20",
    category: "Poetry Nook",
    trigger: (
      <div>
        <p className="text-base font-semibold">How does a poetry club work in My Family Social?</p>
        <p className="text-sm text-slate-600">The My Family Social poetry clubs are virtual. Other than that, they would operate the same way.</p>
      </div>
    ),
    content: (
      <div className="grid md:grid-cols-1 text-base pb-2 pt-2">
        <span>
          <p className="text-base font-semibold">In the Poetry Nook home pages there is a <b>Clubs</b> button that will navigate to the Clubs home page.</p>
          <p className="text-sm text-slate-600">A family member can create a club and a club session In the Club home page. </p>
          <ul className="list-disc ml-6 mt-2 text-sm pb-2 pt-2">
            <li>If there is an existing club defined, the next question is do I want to use that club to create a club session for my book review?</li>
            <p className="pt-2 pb-2 text-xs"><u>Remember</u>: To create a book review, you must create a club session, and that club session is associated with a club.</p>
          </ul>
          <p className="text-sm text-slate-600">Shown below is an example of a Clubs home page, where you can see that there are two clubs. 
            The first club has both a book and a poem club session associated with it.</p>
          <div className="flex justify-center pt-2 pb-2">
            <img className="aspect-auto object-cover w-130 h-95 md:w-200 md:h-150"
              src="/images/support/faq-clubs-home-page.jpg"
              alt="Clubs Home Page"
            />
          </div>
          <p className="text-sm text-slate-600 pt-2">In the club&apos;s home page a family member can create a club. A club can have one or more sessions associated with it.</p>
          <ol className="list-decimal ml-6 mt-2 text-sm pb-2 pt-2">
            <li>Then create a club <u>session</u> for the book or poem you want the Club to review.</li>
            <p className="pt-2 pb-2 text-xs"><u>Note</u>: If a club already exists, it&apos;s best to use an existing club rather than creating a club specifically for one book review.</p>
            <li> Whoever creates the club session is the <u>moderator</u>. The moderator will send an email to members to participate in the poem club session.</li>
            <li>A discussion group is created for the new club session.</li>
            <p className="pt-2 pb-2 text-xs"><u>Note</u>: On the book or the poetry home page, the club session is visible for the selected poem.</p>
            <li>Family members can see the club session (#1 below) on the Poetry Nook home page, and can participate (#2 below) as well.</li>
            <div className="flex justify-center pt-2 pb-2">
              <img className="aspect-auto object-cover w-130 h-95 md:w-100 md:h-150"
                src="/images/support/faq-view-poem-session.jpg"
                alt="View Club session."
              />
            </div>
          </ol>
        </span>
      </div>
    ),
    icon: FileText,
  },
];
