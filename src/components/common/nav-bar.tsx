'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NavBar({ isLoggedIn, href, src, title }
  : { isLoggedIn: boolean, href: string, src: string, title: string }) {
  const pathName = usePathname();
  const isActive = pathName === href;

  const iconTileClasses = [
    "relative grid place-items-center h-8 w-8 md:h-14 md:w-14  rounded-2xl border",
    "bg-gradient-to-b from-white/90 to-sky-100/70 shadow-[0_6px_14px_rgba(1,98,151,0.2)]",
    "transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_10px_20px_rgba(1,98,151,0.28)]",
    isActive
      ? "border-sky-400/90 ring-2 ring-sky-500/50"
      : "border-sky-200/80"
  ].join(" ");

  const tooltipClasses = [
    "font-app text-center rounded-full absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap",
    "px-2 py-1 bg-sky-900 text-sky-50 text-[10px] md:text-xs shadow-md",
    "opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200"
  ].join(" ");

  const icon = (
    <>
      <div className={ iconTileClasses }>
        <img
          src={ src }
          alt={ title }
          className="h-6 w-6 md:h-9 md:w-9 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.18)] transition-transform duration-300 group-hover:scale-110"
        />
      </div>
      <span className={ tooltipClasses }>
        { title }
      </span>
    </>
  );

  return (
    (isLoggedIn ? (
      <li className="relative group">
        <Link href={ href }>
          { icon }
        </Link>
      </li>

    ) : (
      <li className="relative group">
        { icon }

      </li>
    )
    ));
}