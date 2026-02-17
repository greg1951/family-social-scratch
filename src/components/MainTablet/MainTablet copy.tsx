import MainHeader from "@/features/main/components/main-header";
import { JSX } from "react";

export const MainTablet = (): JSX.Element => {

  const leftColumnImages = [
    {
      src: "/images/tv-junkies-tablet.png",
      alt: "Tv junkies tablet",
      className: "relative self-stretch w-full h-[275px]",
    },
    {
      src: "/images/book-besties-tablet.png",
      alt: "Book besties tablet",
      className: "relative self-stretch w-full h-[275px] object-cover",
    },
    {
      src: "/images/family-foodies-tablet.png",
      alt: "Family foodies",
      className: "relative self-stretch w-full h-[274px]",
    },
    {
      src: "/images/mx-train-tablet.png",
      alt: "Image",
      className: "relative self-stretch w-full h-[274px]",
    },
  ];

  const rightColumnImages = [
    {
      src: "/images/movies-maniacs-tablet.png",
      alt: "Movies maniacs",
      className: "relative self-stretch w-full h-[275px]",
    },
    {
      src: "/images/poetry-cafe-tablet.png",
      alt: "Poetry cafe tablet",
      className: "relative self-stretch w-full h-[275px]",
    },
    {
      src: "/images/family-threads-tablet.png",
      alt: "Family threads",
      className: "relative self-stretch w-full h-[274px] object-cover",
    },
  ];

  const actionItems = [
    {
      text: "Need Family Social info?",
      arrowSrc: "/svgs/arrow-2.svg",
      arrowWidth: "w-[132px]",
      textWidth: "w-[323px]",
    },
    {
      text: "Sign up for a trial account",
      arrowSrc: "/svgs/arrow-3.svg",
      arrowWidth: "w-[105px]",
      textWidth: "w-[337px]",
    },
    {
      text: "Check our subcriptions",
      arrowSrc: "/svgs/arrow-4.svg",
      arrowWidth: "w-[115.82px]",
      textWidth: "w-[313px]",
    },
  ];

  return (
    <>
      <MainHeader />
      <section className="absolute top-[calc(50.00%_-_540px)] left-[calc(50.00%_-_16px)] w-[520px] h-40 overflow-hidden border border-solid border-[#59cdf7]">
        <div className="inline-flex flex-col items-center justify-center gap-2.5 absolute top-2 left-[calc(50.00%_-_240px)]">
          <p className="relative w-[494px] mt-[-1.00px] font-body-bold-24 font-[number:var(--body-bold-24-font-weight)] text-transparent text-[length:var(--body-bold-24-font-size)] tracking-[var(--body-bold-24-letter-spacing)] leading-[var(--body-bold-24-line-height)] [font-style:var(--body-bold-24-font-style)]">
            <span className="text-[#002400] font-body-bold-24 [font-style:var(--body-bold-24-font-style)] font-[number:var(--body-bold-24-font-weight)] tracking-[var(--body-bold-24-letter-spacing)] leading-[var(--body-bold-24-line-height)] text-[length:var(--body-bold-24-font-size)]">
              Post pictures, announcements, TV show, movie, book reviews and
              much more,&nbsp;&nbsp;with your family members, right here, in one
              place,{ " " }
            </span>

            <span className="text-[#00ad00] font-body-bold-24 [font-style:var(--body-bold-24-font-style)] font-[number:var(--body-bold-24-font-weight)] tracking-[var(--body-bold-24-letter-spacing)] leading-[var(--body-bold-24-line-height)] text-[length:var(--body-bold-24-font-size)]">
              your very own Family Social
            </span>

            <span className="text-[#002400] font-body-bold-24 [font-style:var(--body-bold-24-font-style)] font-[number:var(--body-bold-24-font-weight)] tracking-[var(--body-bold-24-letter-spacing)] leading-[var(--body-bold-24-line-height)] text-[length:var(--body-bold-24-font-size)]">
              .
            </span>
          </p>
        </div>
      </section>

      <nav className="flex flex-col w-[515px] h-[139px] items-start gap-px p-1 absolute top-[338px] left-[498px] border border-solid border-[#00ad00]">
        { actionItems.map((item, index) => (
          <a
            key={ index }
            href="#"
            className={ `flex ${ index === 0 ? "w-[520px] mr-[-13.00px]" : index === 2 ? "w-[509px] mr-[-2.00px] gap-[7px]" : "w-[509px] mr-[-2.00px]" } h-10 items-center ${ index === 2 ? "justify-center" : index === 1 ? "justify-center" : "relative" }` }
          >
            <div
              className={ `${ index === 0 ? "relative flex items-center justify-center" : index === 2 ? "relative" : "relative" } ${ item.textWidth } ${ index === 0 ? "h-[31px]" : index === 1 ? "h-[33px]" : "h-[34px]" } font-body-bold-24 font-[number:var(--body-bold-24-font-weight)] text-[#002400] text-[length:var(--body-bold-24-font-size)] tracking-[var(--body-bold-24-letter-spacing)] leading-[var(--body-bold-24-line-height)] [font-style:var(--body-bold-24-font-style)]` }
            >
              { item.text }
            </div>

            <img
              className={ `${ item.arrowWidth } relative h-[29.46px]` }
              alt="Arrow"
              src={ item.arrowSrc }
            />

            <img
              className="relative w-[50px] h-[50px] mt-[-5.00px] mb-[-5.00px]"
              alt="Message"
              src="https://c.animaapp.com/1wfnLv4n/img/message-2@2x.png"
            />
          </a>
        )) }
      </nav>

      <div className="flex flex-col w-[450px] items-start gap-[31px] absolute top-[154px] left-[22px]">
        { leftColumnImages.map((image, index) => (
          <img
            key={ index }
            className={ image.className }
            alt={ image.alt }
            src={ image.src }
          />
        )) }
      </div>

      <div className="flex flex-col w-[450px] items-start gap-[15px] absolute top-[496px] left-[526px]">
        { rightColumnImages.map((image, index) => (
          <img
            key={ index }
            className={ image.className }
            alt={ image.alt }
            src={ image.src }
          />
        )) }
      </div>
    </>
  );
};
