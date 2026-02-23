'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { sourceMapsEnabled } from 'process';

export default function NavBar({ href, src }: { href: string, src: string }) {
  const pathName = usePathname();
  return (
    <li>
      <Link href={ href } className='h-4 w-4 md:h-10 md:w-10'>
        <div className="h-4 w-4 md:h-10 md:w-10">
          <img src={ src } alt="feature" />
        </div>

      </Link>
    </li>

  );
}