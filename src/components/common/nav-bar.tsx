'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NavBar({ isLoggedIn, href, src, title }
  : { isLoggedIn: boolean, href: string, src: string, title: string }) {
  const pathName = usePathname();
  return (
    (isLoggedIn ? (
      <li className="relative group">
        <Link href={ href } className='h-4 w-4 md:h-10 md:w-10'>
          <div className="h-4 w-4 md:h-10 md:w-10">
            <img src={ src } alt={ title } className='transition-transform duration-300 transform hover:scale-150 ' />
          </div>
          <span className="font-app text-center rounded absolute bottom left-0 bg-blue-300 text-blue-700 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
            { title }
          </span>
        </Link>
      </li>

    ) : (
      <li className="relative group">
        <div className="h-4 w-4 md:h-10 md:w-10">
          <img src={ src } alt={ title } className='transition-transform duration-300 transform hover:scale-150 ' />
        </div>
        <span className="font-app text-center rounded absolute bottom left-0 bg-blue-300 text-blue-700 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
          { title }
        </span>

      </li>
    )
    ));
}