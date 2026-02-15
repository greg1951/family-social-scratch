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
    <div
      className="relative w-[1024px] h-[1370px] bg-[#b6ebff] border border-solid border-[#002400]"
      data-model-id="820:5142"
    >
      <header className="absolute top-0 left-0 w-[1024px] h-[116px] bg-[#59cdf7] overflow-hidden shadow-[0px_4px_4px_2px_#0000007d]">
        <button
          className="absolute w-[6.84%] h-[60.34%] top-[26.72%] left-0"
          aria-label="Open menu"
        >
          <img
            src="/icons/hamburger.png"
            alt="Hamburger"
            className="w-full h-full"
          />
        </button>

        <h1 className="absolute w-[41.41%] h-[52.59%] top-[28.45%] left-[29.30%] flex items-center justify-center font-body-bold-48 font-[number:var(--body-bold-48-font-weight)] text-black text-[length:var(--body-bold-48-font-size)] text-center tracking-[var(--body-bold-48-letter-spacing)] leading-[var(--body-bold-48-line-height)] [font-style:var(--body-bold-48-font-style)]">
          Family Social
        </h1>

        <button
          className="absolute w-[3.91%] h-[34.48%] top-[37.93%] left-[89.26%]"
          aria-label="Search"
        >
          <img
            className="w-full h-full object-cover"
            alt="Search icons"
            src="/icons/search-icons.png"
          />
        </button>

        <button
          className="absolute w-[3.91%] h-[34.48%] top-[35.34%] left-[93.85%]"
          aria-label="Account"
        >
          <img
            className="w-full h-full"
            alt="Account"
            src="/icons/account.png"
          />
        </button>

        {/* <img
          className="absolute w-[19.53%] h-[137.93%] top-[511.21%] left-[107.91%] object-cover"
          alt="Rectangle"
          src="https://c.animaapp.com/1wfnLv4n/img/rectangle@2x.png"
        /> */}
      </header>

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

        {/* <img
          className="absolute top-[calc(50.00%_-_4px)] left-[calc(50.00%_+_726px)] w-[35px] h-[35px]"
          alt="Message"
          src="https://c.animaapp.com/1wfnLv4n/img/rectangle@2x.png"
        /> */}
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
    </div>
  );
};
