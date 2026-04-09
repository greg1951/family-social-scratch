import Link from "next/link";

const updates = [
  {
    title: "Game Scoreboards Home Page Launch",
    summary: "The Game Scoreboards home page is now available and nearly complete. It support a variety of games like Mexican Train and Acquire.",
    category: "Features",
    date: "April 9, 2026",
  },
  {
    title: "Family Threads Home Page Launch",
    summary: "The Family Threads is where we keep the family conversations. The data you see there are real but there's not a way to reply to the posts yet. That is coming next! ",
    category: "Features",
    date: "April 7, 2026",
  },
  {
    title: "Movie Maniacs and Music Lovers Home Page Launches",
    summary: "The Movie Maniacs and Music Lovers prototype home pages are now available. Check them out and let us know what you think!",
    category: "Features",
    date: "Apr 1, 2026",
  },
  {
    title: "TV Junkies Home Page Launch",
    summary: "The TV Junkies feature will be the first one to be fully released. Right now it's just a prototype but it will be available to fully functional soon.",
    category: "Features",
    date: "Mar 15, 2026",
  },
  {
    title: "Family Foodies Home Page Launch",
    summary: "The Family Foodies feature is going to be very popular and it comes after the TV Junkies release.",
    category: "Features",
    date: "Mar 16, 2026",
  },
  {
    title: "Family Dashboard",
    summary: "On the home page is a link to the Family Dashboard. Right now the two charts are hard-coded but the idea is to provide some graphical view of who's doing what where in the family.",
    category: "Dashboard",
    date: "Mar 27, 2026",
  },
  {
    title: "New Members Suggested",
    summary: "You can now suggest other people be invited to join the family. This feature is available in the Family Members tab of your My Account page. Feel free to invite your friends as well.",
    category: "Family Activity",
    date: "Mar 25, 2026",
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
