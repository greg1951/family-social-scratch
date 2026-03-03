'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';


export default function HeaderImage({ href, src, title, tw }: { href: string, src: string, title: string, tw: string }) {
  const pathName = usePathname();
  return (
    <div className="relative group">
      <Link href={ href } className='h-4 w-4 md:h-10 md:w-10'>
        <div className={ tw }>
          <img src={ src } className='transition-transform duration-300 transform hover:scale-120 ' />
        </div>
        <span className="font-app text-center text-xs rounded absolute bottom left-0 bg-blue-300 text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity">
          { title }
        </span>

      </Link>
    </div>

  );
}