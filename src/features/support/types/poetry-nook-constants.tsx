import { FileText } from "lucide-react";

export const poetryNookFaqItems = [
  {
    value: "item-90",
    category: "Poetry Nook",
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
    value: "item-91",
    category: "Poetry Nook",
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
];
