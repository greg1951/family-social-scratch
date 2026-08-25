import { FileText } from "lucide-react";

export const libraryFaqItems = [
  {
    value: "item-100",
    category: "Library",
    trigger: (
      <div>
        <p className="text-base font-semibold">I like to read but I&apos;m not sure how to get started with Library. What do you recommend?</p>
        <p className="text-sm text-slate-600">First of all, you&apos;ve already met the first criteria which is you like to read!</p>
      </div>
    ),
    content: (
      <div className="grid md:grid-cols-1 text-base">
        <span>
          <p className="text-base font-semibold">Writing a book review is easy. Writing a good one takes a little more time and thought.</p>
          <ol className="list-decimal ml-6 mt-2 text-sm">
            <li>The Library provides a number of <b>sample book reviews</b>. Read those to get a sense of what a good review looks like.</li>
            <li>Visit the <b>Book Terms</b> page. There you&apos;ll find definitions and explanations for various book-related terms.</li>
            <p className="pt-2 pb-2 text-sm"><u>Tip</u>: Personalizing the review to your experience is the kind of review people enjoy reading.</p>
            <li>Write your own book review, incorporating what you&apos;ve learned from the sample reviews and book terms.</li>
            <li>Keep your book review in Draft status until you&apos;re ready to submit it. Then, let it rip!</li>
            <p className="text-sm">Explore the Terms Page, theres a lot of good information to help you write better reviews.</p>
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
    category: "Library",
    trigger: (
      <div>
        <p className="text-base font-semibold">I've read a wonderful book and want to share and discuss it with others. What resources are available in the library?</p>
        <p className="text-sm text-slate-600">Expand this section to see the resources that are available to you in the library.!</p>
      </div>
    ),
    content: (
      <div className="grid md:grid-cols-1 text-base">
        <span>
          <p className="text-base font-semibold">Writing a book review is easy. Writing a good one takes a little more time and thought.</p>
          <p className="text-sm text-slate-600">Begin by selecting <b>Add Book</b> from the Library home page.</p>
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
          <div>
            <p className="text-base font-semibold pt-2">Start a book club!</p>
              <ul className="list-disc ml-6 mt-2 text-sm">
                <li>A book club is an excellent way to get other family members to read the book and share their experience with it.</li>
                <li>A book club can meet once or many times on one or more books. Give it a try!</li>
              </ul>
          </div>
        </span>
      </div>
    ),
    icon: FileText,
  },
];
