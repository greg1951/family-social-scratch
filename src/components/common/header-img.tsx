'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';


export default function HeaderImage({ href, src, title }: { href: string, src: string, title: string }) {
  const pathName = usePathname();
  const tooltipClasses = [
    "font-app text-center rounded-full absolute -bottom-7 left-15 -translate-x-1/2 whitespace-nowrap",
    "px-2 py-1 bg-sky-900 text-sky-50 text-[10px] md:text-xs shadow-md",
    "opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200"
  ].join(" ");

  return (
    <div className="relative group">
      <Link href={ href } className='h-4 w-4 md:h-7 md:w-7'>
        <div className="h-7 w-7 md:h-15 pt-0 md:w-15">
          <img src={ src } className='transition-transform duration-300 transform hover:scale-110 ' />
        </div>
        <p className={ tooltipClasses }>
          { title }
        </p>
        {/* </span> */ }

      </Link>
    </div>

  );
}