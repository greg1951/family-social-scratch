import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { mainLogout } from "../../app/(main)/actions";
import { SettingsIcon } from 'lucide-react';
import MemberAvatar from "@/components/common/member-avatar";


export default function MainDropMenu({ firstName, email, sessionFound, isFounder, isAdmin, memberImageUrl, unreadThreadCount }
  : {
    firstName: string;
    email: string;
    sessionFound: boolean;
    isFounder: boolean;
    isAdmin: boolean;
    memberImageUrl?: string | null;
    unreadThreadCount?: number;
  }) {
  let title: string = "";
  if (firstName.length === 0) title = 'Settings'
  else title = `${ firstName }'s Settings`

  const tileClasses = [
    "relative grid place-items-center h-8 w-8 md:h-14 md:w-14 rounded-2xl border border-sky-200/80",
    "bg-gradient-to-b from-white/90 to-sky-100/70 shadow-[0_6px_14px_rgba(1,98,151,0.2)]",
    "transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_10px_20px_rgba(1,98,151,0.28)]"
  ].join(" ");

  const tooltipClasses = [
    "font-app text-center rounded-full absolute -bottom-6 left-1 -translate-x-1/2 whitespace-nowrap",
    "px-2 py-1 bg-sky-900 text-sky-50 text-[10px] md:text-xs shadow-md",
    "opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200"
  ].join(" ");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="group relative cursor-pointer" aria-label={ title }>
          <div className={ tileClasses }>
            { sessionFound ? (
              <MemberAvatar
                imageUrl={ memberImageUrl ?? null }
                firstName={ firstName }
                lastName=""
                sizeClassName="h-8 w-8 md:h-14 md:w-14"
              />
            ) : (
              <SettingsIcon className="h-6 w-6 md:h-9 md:w-9 text-sky-900/85 drop-shadow-[0_2px_4px_rgba(0,0,0,0.18)] transition-transform duration-300 group-hover:scale-110" />
            ) }

            { sessionFound && (unreadThreadCount ?? 0) > 0 && (
              <span
                className="absolute -right-0.5 -top-0.5 inline-flex h-2.5 w-2.5 rounded-full border border-white bg-red-600"
                aria-label={ `${ unreadThreadCount } unread thread${ unreadThreadCount === 1 ? '' : 's' }` }
                title={ `${ unreadThreadCount } unread thread${ unreadThreadCount === 1 ? '' : 's' }` }
              />
            ) }
          </div>
          <span className={ tooltipClasses }>
            { title }
          </span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="font-app text-sm">
        { sessionFound ? (
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-base font-bold">{ email }</DropdownMenuLabel>
            <DropdownMenuSeparator />
            { !isFounder && (
              <DropdownMenuItem>
                <Link href="/family-member-account">
                  My Account
                </Link>
              </DropdownMenuItem>
            ) }
            { isFounder && (
              <DropdownMenuItem>
                <Link href="/family-founder-account">
                  My Family Account
                </Link>
              </DropdownMenuItem>
            ) }
            { isAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-base font-bold">Support</DropdownMenuLabel>
                  <DropdownMenuItem>
                    <Link href="/issues-list">
                      Issue List
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link href="/faq">
                      FAQ
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </>
            ) }
            { !isFounder && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-base font-bold">Support</DropdownMenuLabel>
                  <DropdownMenuItem>
                    <Link href="/faq">
                      FAQ
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link href="/open-issue">
                      Open Support Issue
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </>
            ) }
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-base font-bold">
              <div>
                <p onClick={ mainLogout } >
                  Logout
                </p>
              </div>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        )
          : (
            <DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-base font-bold">
                <Link href="/login">
                  Login
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          ) }
      </DropdownMenuContent>
    </DropdownMenu>
  )
}