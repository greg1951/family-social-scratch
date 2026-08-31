import { FileText } from "lucide-react";

export const libraryFaqItems = [
  {
    value: "item-10",
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
    value: "item-11",
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
  {
    value: "item-20",
    category: "Library",
    trigger: (
      <div>
        <p className="text-base font-semibold">I&apos;ve been in a number of book clubs. How do book clubs work in My Family Social?</p>
        <p className="text-sm text-slate-600">The My Family Social book clubs are virtual. Other than that, they would operate the same way.</p>
      </div>
    ),
    content: (
      <div className="grid md:grid-cols-1 text-base p-2">
        <span>
          <p className="text-base font-semibold">In the Library home pages there is a <b>Clubs</b> button that will navigate to the Clubs home page.</p>
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
            <li> Whoever creates the club session is the <u>moderator</u>. The moderator will send an email to members to participate in the book club session.</li>
            <li>A discussion group is created for the new club session.</li>
            <p className="pt-2 pb-2 text-xs"><u>Note</u>: On the book or the poetry home page, the club session is visible for the selected book or poem.</p>
            <li>Family members can see the club session (#1 below) on the book home page, and can participate (#2 below).</li>
            <div className="flex justify-center pt-2 pb-2">
              <img className="aspect-auto object-cover w-130 h-95 md:w-100 md:h-150"
                src="/images/support/faq-view-club-session.jpg"
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
