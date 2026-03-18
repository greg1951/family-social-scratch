import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { mainLogout } from "../../app/(main)/actions";
import { SettingsIcon } from 'lucide-react';


export default function MainDropMenu({ firstName, email, sessionFound, isFounder }
  : { firstName: string; email: string; sessionFound: boolean; isFounder: boolean; }) {
  let title: string = "";
  if (firstName.length === 0) title = 'Settings'
  else title = `${ firstName }'s Settings`

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="group relative">
          <div>
            <SettingsIcon className="h-7 w-7 md:h-13 md:w-13 opacity-60" />
          </div>
          <span className="font-app text-center rounded absolute bottom left-0 bg-blue-300 text-blue-700 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
            { title }
          </span>
        </div>
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