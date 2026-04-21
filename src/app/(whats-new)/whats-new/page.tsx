import Link from "next/link";

const updates = [
  {
    title: "Movie Maniacs Go Crazy!",
    summary: "Add your favorite movies to Movie Maniacs! See what movies other family members like.",
    category: "Features",
    date: "April 21, 2026",
  },
  {
    title: "TV Junkies Unite!",
    summary: "TV Junkies is now live in the Family Social! Check it out and start adding your favorite shows.",
    category: "Features",
    date: "April 21, 2026",
  },
  {
    title: "It's alive! See Family Foodies in action.",
    summary: "Family Foodies is now live in the family social experience! You can access it from the main navigation and start sharing your favorite recipes with your family. It comes with a recipe template but you can create your own recipe template, if you hate ours 😒 ",
    category: "Features",
    date: "April 20, 2026",
  },
  {
    title: "It's Family Picture Day!",
    summary: "Upload your favority mugshot (of yourself) to be featured across the family social experience. Your image will be used in your profile and across various features to help your family members recognize you and feel more connected. To upload your image, go to the My Account page and click on the Upload Image button. We can't wait to see your smiling face!",
    category: "Features",
    date: "April 16, 2026",
  },
  {
    title: "First Live Features!",
    summary: "The Game Scoreboards, Poetry Cafe, and Book Besties are now live! Check them out and let us know what you think!",
    category: "Features",
    date: "April 15, 2026",
  },
  {
    title: "Game Scoreboards Supports Mexican Train and Acquire!",
    summary: "The Game Scoreboards feature now supports Mexican Train and Acquire! Both games support guests, so you can easily add non-family members to your game sessions. We hope you enjoy playing these games with your family!",
    category: "Features",
    date: "April 16, 2026",
  },
];

export default function WhatsNewPage() {
  return (
    <section className="font-app min-h-screen bg-linear-to-b from-slate-50 to-white px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,rgba(52,44,98,0.95),rgba(93,73,164,0.86)_56%,rgba(170,144,238,0.8))] px-6 py-8 text-white shadow-[0_28px_80px_-40px_rgba(35,27,73,0.92)] sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#e5dcff]">Family Social</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">What&apos;s New in the Family</h1>
          <p className="mt-3 max-w-3xl text-sm text-[#efe8ff] sm:text-base">
            A simple timeline of the newest activity across your family channels.
          </p>

          <div className="mt-5">
            <Link
              href="/"
              className="inline-flex items-center rounded-full border border-white/35 bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#efe8ff] transition hover:bg-white/25"
            >
              Back to Main Page
            </Link>
          </div>
        </div>

        <div className="grid gap-4">
          { updates.map((update) => (
            <article
              key={ update.title }
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#f0ebff] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5b4b9a]">
                  { update.category }
                </span>
                <span className="text-xs font-medium text-slate-500">{ update.date }</span>
              </div>
              <h2 className="mt-2 text-lg font-extrabold text-slate-900">{ update.title }</h2>
              <p className="mt-1 text-sm text-slate-700">{ update.summary }</p>
            </article>
          )) }
        </div>
      </div>
    </section>
  );
}
