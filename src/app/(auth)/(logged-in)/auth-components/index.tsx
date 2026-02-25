'use client';

import { Button } from "@/components/ui/button";
import { logout } from "./actions";
import Image from "next/image";
import logoutImg from "@/public/icons/logout.png";
import Link from "next/link";

export default function LogoutButton() {
  return (
    <div className="relative group">
      <img src="icons/logout.png" alt="Logout" className='transition-transform duration-300 transform hover:scale-150'
        onClick={ async () => { await logout(); } }
      />
      <span className="font-app rounded absolute bottom left-0 bg-blue-300 text-blue-700 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
        Logout
      </span>

    </div>
    // <Button className="text-xs" size="sm" onClick={ async () => {
    //   await logout();
    // } }>
    //   Logout
    // </Button>
  )
}