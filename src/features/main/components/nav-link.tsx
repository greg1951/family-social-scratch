'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NavLink({ href, children }: { href: string, children: string }) {
  const pathName = usePathname();
  return (
    <li className='text-amber-800 text-center'>
      <Link
        href={ href }
        className={ pathName.startsWith(href) ? "active:active" : undefined }>
        { children }
      </Link>
    </li>

  );
}