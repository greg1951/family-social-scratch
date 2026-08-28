import { FileText, Info, Heart } from "lucide-react";

export const tvReviewsFaqItems = [
  {
    value: "item-10",
    category: "TV Reviews",
    trigger: (
      <div>
        <p className="text-base font-semibold">What&apos;s the general layout of the TV Room home page?</p>
        <p className="text-xs text-slate-600">The <i>Movie Theater</i>, <i>Music Salon</i>, and <i>The Kitchen</i> layouts are similar in behavior.</p>
      </div>
    ),
    content: (
      <div className="grid md:grid-cols-1 text-base">
        <span>
          <div className="flex justify-center pb-4">
            <img
              src="/images/support/faq-tv-home.jpg"
              alt="TV Room Home"
              style={ { maxWidth: '900px', maxHeight: '800px', marginTop: 12, borderRadius: 8 } }
            />

          </div>
          <p className="text-base font-semibold">The TV Room home page let&apos;s you find shows that have been reviewed by others in the family.</p>
          <ol className="list-decimal ml-6 mt-2 text-sm">
            <li>The <b>Show Finder</b> let&apos;s you type in a name, a genre, a family member.</li>
            <li>When you find what you&apos;re looking for you can select it and see <b>View the Show</b>.</li>
            <li>In the <b>Show Type</b> selector you can toggle between the <b>Latest TV Shows</b> or the <b>Top Rated TV Shows</b>. </li>
            <li>The <b>TV Picks</b> gallery lets you scroll through the latest or highest rated shows at a glance.</li>
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
    category: "TV Reviews",
    trigger: (
      <div>
        <p className="text-base font-semibold">How do I add a TV show review?</p>
        <p className="text-xs text-slate-600">It works the same way in <i>Movie Theater</i>, <i>Music Salon</i>, and <i>The Kitchen</i> as well.</p>
      </div>
    ),
    content: (
      <div className="grid md:grid-cols-1 text-base">
        <span>
          <p className="text-base font-semibold">Adding a TV show review is easy. Start by clicking on the <b>Add Show</b> button in the upper right corner.</p>
          <ol className="list-decimal ml-6 mt-2 text-sm">
            <li>Start with a good template. My Family Social provides a <b>Global</b> template, but a family member can create their own.</li>
            <li>When you pick a template it will prefill the review edit area with helpful headings.</li>
            <li>Next, start filling in the general information about the show, starting at the top of the page.</li>
            <li>Find a good image of the show or even easier, a website link to IMDB or YouTube. There&apos;s a separate FAQ on uploading images.</li>
            <li>Tag the show with relevant keywords to make it easier for others to find.</li>
            <li>Don&apos;t forget to rate the show! Chances are it will always be <i>Love</i> but maybe you&apos;ve come back and changed it to <i>Like</i>.</li>
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
    category: "TV Reviews",
    trigger: (
      <div>
        <p className="text-base font-semibold">Why TV show and Movie image uploads require special handling?</p>
        <p className="text-xs text-slate-600">Images must be properly credited to comply with Fair Use guidelines in copyright laws.</p>
      </div>
    ),
    content: (
      <div className="grid md:grid-cols-1 text-base">
        <span>
          <p className="text-base font-semibold">You found some great TV show or Movie image but wait, don&apos;t upload it just yet! There are licensing considerations!</p>
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
    value: "item-50",
    category: "TV Reviews",
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
            <li>In My Family Social TV Room home page, select the Add Show option and complete the form as instructed below.</li>
          </ol>
          <div className="flex justify-center pt-2 pb-2">
            <img className="aspect-auto object-cover w-150 h-95 md:w-230 md:h-130"
              src="/images/support/faq-tv-imdb-url.jpg"
              alt="IMDB Link"
            />
          </div>
          <p className="text-base font-semibold">In My Family Social TV Room <b>Add Show</b>:</p>
          <ol className="list-decimal ml-6 mt-2 text-sm">
            <li>Enter the <b>Show Name</b> as you want it to appear in the home page.</li>
            <li>Paste the URL you copied from IMDB or YouTube into the <b>Show Site URL</b> field.</li>
            <li>Select one of five <b>background colors</b> to be used when your show is displayed.</li>
            <li>Complete the rest of the form and add or update your show review.</li>
          </ol>
          <p className="text-base font-semibold pt-2">On the home page, this show will display the title and background in place of an image which was not provided.</p>
          <ol className="list-decimal ml-6 mt-2 text-sm">
            <li>Where an image would be shown, now the title and background are shown instead.</li>
            <li>The Show Title below the image is a link that will take you to the show&apos;s page.</li>
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
];
