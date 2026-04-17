import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { mainLogout } from "../../app/(main)/actions";
import { SettingsIcon } from 'lucide-react';
import MemberAvatar from "@/components/common/member-avatar";


export default function MainDropMenu({ firstName, email, sessionFound, isFounder, memberImageUrl }
  : { firstName: string; email: string; sessionFound: boolean; isFounder: boolean; memberImageUrl?: string | null; }) {
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
          </div>
          <span className={ tooltipClasses }>
            { title }
          </span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent>
        { sessionFound ? (
          <DropdownMenuGroup>
            <DropdownMenuLabel>{ email }</DropdownMenuLabel>
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
            <DropdownMenuItem>
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
              <DropdownMenuItem>
                <Link href="/login">
                  Login
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href="/trial-home">
                  Start Trial
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          ) }
      </DropdownMenuContent>
    </DropdownMenu>
  )
}