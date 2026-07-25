import Link from "next/link";
import { Card } from "../ui/card";

export default function MainLinkCard({ isLoggedIn, href, title, src, tw, imageClassName, phoneSrc, tabletSrc }
  : { isLoggedIn: boolean, href: string, title: string, src: string, tw: string, imageClassName?: string, phoneSrc?: string, tabletSrc?: string }) {
  const imageClasses = imageClassName ?? "aspect-auto object-cover h-23 md:h-33 w-full";
  const picturePhoneSrc = phoneSrc ?? src;
  const pictureTabletSrc = tabletSrc ?? src;

  return (
    (isLoggedIn ? (
      <Link href={ href } >
        <Card className={ tw }>
          <picture>
            <source media="(min-width: 768px)" srcSet={ pictureTabletSrc } />
            <img src={ picturePhoneSrc } alt={ title } className={ imageClasses } />
          </picture>
        </Card>
      </Link>

    ) : (
      <Card className={ tw }>
        <picture>
          <source media="(min-width: 768px)" srcSet={ pictureTabletSrc } />
          <img src={ picturePhoneSrc } alt={ title } className={ imageClasses } />
        </picture>
      </Card>
    )
    ));
}

