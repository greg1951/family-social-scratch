import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

import PublicHelpMenu from '@/components/common/public-help-menu';

const featureImages = [
  {
    src: '/images/family-foodies-tablet.png',
    alt: 'Family Foodies community preview',
    title: 'Swap recipes and table stories',
    className: 'left-3 top-14 hidden w-24 rotate-[-10deg] md:block md:w-30 lg:left-6 lg:top-9 lg:w-34',
    accent: 'from-[#fff2d8] to-[#ffd68a]',
  },
  {
    src: '/images/family-threads-tablet.png',
    alt: 'Family Threads community preview',
    title: 'Keep family conversations alive',
    className: 'left-1/2 top-2 z-10 w-34 -translate-x-1/2 rotate-[3deg] md:top-1 md:w-38 lg:w-40',
    accent: 'from-[#dff6ff] to-[#8fdcff]',
  },
  {
    src: '/images/movies-maniacs-tablet.png',
    alt: 'Movies Maniacs community preview',
    title: 'Share watchlists and reactions',
    className: 'right-3 top-15 hidden w-24 rotate-[11deg] md:block md:w-30 lg:right-6 lg:top-10 lg:w-34',
    accent: 'from-[#ffe3ee] to-[#ffb0cd]',
  },
  {
    src: '/images/poetry-cafe-tablet.png',
    alt: 'Poetry Cafe community preview',
    title: 'Celebrate creative family voices',
    className: 'left-10 top-34 hidden w-26 rotate-[6deg] xl:block',
    accent: 'from-[#efe5ff] to-[#cab5ff]',
  },
  {
    src: '/images/tv-junkies-tablet.png',
    alt: 'TV Junkies community preview',
    title: 'Turn favorites into family traditions',
    className: 'right-10 top-34 hidden w-26 rotate-[-8deg] xl:block',
    accent: 'from-[#e7ffd9] to-[#b9f57e]',
  },
];

export default function PublicEntryShell({ children }: { children: ReactNode }) {
  return (
    <div className="font-app min-h-screen bg-[radial-gradient(circle_at_top,_#ffffff_0%,_#f5fbff_34%,_#dff6ff_100%)] text-[#10364a]">
      <div className="absolute inset-x-0 top-0 h-72 bg-[linear-gradient(180deg,rgba(89,205,247,0.28),rgba(255,255,255,0))]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-10 pt-4 sm:px-6 lg:px-8">
        <header className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/70 shadow-[0_20px_80px_-38px_rgba(16,54,74,0.45)] backdrop-blur">
          <div className="grid gap-3 px-4 py-3 md:grid-cols-[minmax(15rem,21rem)_minmax(0,1fr)_auto] md:items-start md:px-6 lg:px-8">
            <div className="flex flex-col gap-3 md:pt-1">
              <Link
                href="/"
                className="group inline-flex w-fit items-center gap-3 rounded-2xl border border-[#bdeeff] bg-white/80 px-3 py-2 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="rounded-2xl bg-[linear-gradient(145deg,#dff6ff,#ffffff)] p-2 shadow-inner">
                  <Image
                    src="/images/family-social-icon-only.png"
                    alt="Family Social home"
                    width={ 56 }
                    height={ 56 }
                    className="h-10 w-10 object-contain md:h-12 md:w-12"
                    priority
                  />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2f7a95]">Family Social</p>
                  <p className="text-sm text-[#5a7381] group-hover:text-[#10364a]">Return home</p>
                </div>
              </Link>

              <div className="max-w-sm rounded-[1.5rem] border border-white/65 bg-white/58 px-4 py-3 shadow-[0_18px_45px_-35px_rgba(16,54,74,0.65)] backdrop-blur">
                <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#2f7a95] md:text-xs">Find Your People</p>
                {/* <h1 className="mt-2 text-sm font-extrabold leading-tight text-[#10364a] md:text-[1rem]">
                  Bring family stories and shared interests into one welcoming place.
                </h1> */}
                <p className="mt-2 text-sm leading-5 text-[#5a7381]">
                  From movie nights to recipes and poetry, the space stays warm, visual, and easy to return to.
                </p>
              </div>
            </div>

            <div className="relative min-h-36 overflow-hidden rounded-[1.75rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(255,255,255,0.58))] px-3 py-3 shadow-inner md:min-h-40 md:px-4 lg:min-h-44">
              <div className="pointer-events-none absolute inset-x-8 top-4 h-20 rounded-full bg-[radial-gradient(circle,rgba(255,222,170,0.7)_0%,rgba(255,255,255,0)_72%)] blur-2xl" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-[linear-gradient(180deg,rgba(255,255,255,0),rgba(255,255,255,0.2))]" />
              <div className="absolute inset-x-0 bottom-2 flex justify-center px-6 md:hidden">
                <div className="rounded-full bg-white/78 px-3 py-1 text-sm font-semibold tracking-[0.14em] text-[#315363] shadow-sm backdrop-blur">
                  A few circles your family could create
                </div>
              </div>
              { featureImages.map((image) => (
                <div
                  key={ image.src }
                  className={ `absolute ${ image.className }` }
                >
                  <div className={ `rounded-[1.4rem] bg-linear-to-br ${ image.accent } p-0.75 shadow-[0_18px_30px_-22px_rgba(16,54,74,0.75)]` }>
                    <div className="overflow-hidden rounded-4xl border border-white/70 bg-white/85 p-1.5 backdrop-blur">
                      <Image
                        src={ image.src }
                        alt={ image.alt }
                        width={ 180 }
                        height={ 122 }
                        className="h-auto w-full rounded-3xl object-cover"
                      />
                      <p className="hidden px-1 pb-0.5 pt-2 text-[10px] font-semibold tracking-[0.08em] text-[#315363] md:block md:text-[11px]">
                        { image.title }
                      </p>
                    </div>
                  </div>
                </div>
              )) }
            </div>

            <div className="flex items-start justify-end md:pt-1 md:self-start">
              <PublicHelpMenu href="/faq" />
            </div>
          </div>
        </header>

        <main className="flex flex-1 items-start justify-center px-1 py-6 md:px-0 md:py-8">
          { children }
        </main>
      </div>
    </div>
  );
}
