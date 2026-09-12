import Link from "next/link";
import { HouseHeart } from "lucide-react";

export default function GoHomeButton({ tw, stretch = true }: { tw?: string; stretch?: boolean }) {
  return (
    <Link
      id="go-home-button"
      href="/"
      title="Go Home"
      className={ `flex ${ stretch ? "w-fit sm:w-full" : "w-fit" } items-center justify-center gap-2 rounded-xl border ${ tw }` }>
      <HouseHeart className="h-4 w-4 shrink-0" />
      <span className="hidden md:inline">Go Home</span>
    </Link>
  );
}
