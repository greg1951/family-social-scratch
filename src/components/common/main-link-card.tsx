import Link from "next/link";
import { Card } from "../ui/card";

export default function MainLinkCard({ isLoggedIn, href, title, src, tw }
  : { isLoggedIn: boolean, href: string, title: string, src: string, tw: string }) {
  return (
    (isLoggedIn ? (
      <Link href={ href } >
        <Card className={ tw }>
          <img src={ src } alt={ title } className="aspect-auto w-full object-cover" />
        </Card>
      </Link>

    ) : (
      <Card className={ tw }>
        <img src={ src } alt={ title } className="aspect-auto w-full object-cover" />
      </Card>
    )
    ));
}

