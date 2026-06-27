import Link from "next/link";
import { Card } from "../ui/card";

export default function MainLinkCard({ isLoggedIn, href, title, src, tw, imageClassName }
  : { isLoggedIn: boolean, href: string, title: string, src: string, tw: string, imageClassName?: string }) {
  const imageClasses = imageClassName ?? "aspect-auto object-cover h-23 md:h-33 w-full";

  return (
    (isLoggedIn ? (
      <Link href={ href } >
        <Card className={ tw }>
          <img src={ src } alt={ title } className={ imageClasses } />
        </Card>
      </Link>

    ) : (
      <Card className={ tw }>
        <img src={ src } alt={ title } className={ imageClasses } />
      </Card>
    )
    ));
}

