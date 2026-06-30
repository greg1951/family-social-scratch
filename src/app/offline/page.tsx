import Image from "next/image";
import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#ffffff_0%,#f5fbff_34%,#dff6ff_100%)] px-4 py-10 text-[#10364a]">
      <div className="mx-auto flex w-full max-w-xl flex-col items-center rounded-[2rem] border border-white/70 bg-white/80 px-6 py-10 text-center shadow-[0_20px_80px_-38px_rgba(16,54,74,0.45)] backdrop-blur">
        <Image
          src="/images/family-social-icon-only.png"
          alt="Family Social"
          width={ 160 }
          height={ 160 }
          priority
          className="h-28 w-28 rounded-3xl object-cover"
        />
        <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.32em] text-[#2f7a95]">
          You are offline
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#10364a]">
          Family Social is unavailable right now.
        </h1>
        <p className="mt-4 max-w-md text-sm leading-6 text-[#315568]">
          Check your connection and try again. When you are back online, the app will reconnect automatically.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="rounded-full bg-[#005472] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0a6a90]"
          >
            Try again
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-sky-200 bg-white px-5 py-2.5 text-sm font-semibold text-[#10364a] transition hover:bg-sky-50"
          >
            Go to login
          </Link>
        </div>
      </div>
    </main>
  );
}