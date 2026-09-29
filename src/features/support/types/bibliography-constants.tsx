import { FileText } from "lucide-react";

export const bibliographyFaqItems = [
  {
    value: "item-0",
    category: "Bibliography",
    trigger: (
      <div>
        <p className="text-base font-semibold">What is the bibliography to be used for?</p>
        <p className="text-xs text-slate-600">It is <u>your</u> list of books you&apos;ve read. It is separate from the book reviews seen on the <b>Library</b> home page.</p>
      </div>
    ),
    content: (
      <div className="grid md:grid-cols-1 text-base">
        <span>
          <p className="text-base font-semibold pb-2">Avid book readers often keep a list of the books that they&apos;ve read. 
            <br></br>My Family Social provides a way to keep a list of the books you&apos;ve read.
          </p>
          <ul className="list-disc ml-6 mt-2 text-sm">
            <li>A book in the bibliography with a draft or private status is not viewable by other family members.</li>
            <li>A book with a public status is viewable by other family members who can also search for books with matching book titles.</li>
            <li>In your bibliography, you can have a mixture of public and private books, but only the public ones will be visible to other members.</li>
            <li>If you want to post one of your bibliography books as a review, most of the information in your bibliography will be used.</li>
          </ul>
        </span>
      </div>
    ),
    icon: FileText,
  },
  {
    value: "item-11",
    category: "Bibliography",
    trigger: (
      <div>
        <p className="text-base font-semibold pb-2">Is the bibliography the same as a book review?</p>
        <p className="text-sm text-slate-600">No, they are separate. The bibliography is for keeping track of the books you&apos;ve read, while book reviews are for sharing your thoughts on those books with other family members.</p>
      </div>
    ),
    content: (
      <div className="grid md:grid-cols-1 text-base">
        <span>
          <p className="text-base font-semibold pb-2">If you want to have a bibliography, then the following process is suggested.</p>
          <p className="text-sm text-slate-600 pb-2">Define the basic book information in the <b>My Books</b> bibliography page:</p>
          <ol className="list-decimal ml-6 mt-2 text-sm">
            <li className="pb-2">In the <b>My Books</b> page select the <b>Add Book</b> button.</li>
            <li className="pb-2">Add the basic book facts and a short comment on what you liked about the book.<br></br> (The comment is <u>not</u> the book review!)</li>
            <li className="pb-2"><b>Save</b> the book in your bibliography.</li>
            <li className="pb-2">Select your new bibliography entry then click on the <b>Create Review</b> button.</li>
            <li className="pb-2">Most of the bibliography information will be copied into the add review dialog.</li>
            <li className="pb-2">Now, write your book review and submit it with a <u>published</u> status for the rest of the family to see.</li>
          </ol>
          <div className="flex justify-center pt-2 pb-2">
            <img className="aspect-auto object-cover w-180 h-140 md:w-170 md:h-170"
              src="/images/support/faq-add-book-review.jpg"
              alt="Book Review Sections"
            />
          </div>
        </span>
      </div>
    ),
    icon: FileText,
  },
];
