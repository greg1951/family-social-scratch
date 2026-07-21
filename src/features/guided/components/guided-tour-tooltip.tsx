"use client";

import type { CSSProperties } from "react";
import type { Step, TooltipRenderProps } from "react-joyride";

type GuidedTourTheme = {
  cardClassName: string;
  titleClassName: string;
  bodyClassName: string;
  footerClassName: string;
  primaryButtonClassName: string;
  secondaryButtonClassName: string;
  accentColor: string;
  borderColor: string;
  backgroundColor: string;
  textColor: string;
  styles: NonNullable<Step["styles"]>;
};

const DEFAULT_THEME: GuidedTourTheme = {
  cardClassName: "border-[#d8e4ed] bg-white text-[#15384a] shadow-[0_18px_50px_-28px_rgba(13,33,44,0.55)]",
  titleClassName: "text-[#15384a]",
  bodyClassName: "text-[#3f6576]",
  footerClassName: "border-[#d8e4ed]",
  primaryButtonClassName: "bg-[#0d6789] text-white hover:bg-[#0b5874]",
  secondaryButtonClassName: "border-[#c8d8df] bg-white text-[#4f7a8c] hover:bg-[#f4f8fb]",
  accentColor: "#0d6789",
  borderColor: "#d8e4ed",
  backgroundColor: "#ffffff",
  textColor: "#15384a",
  styles: {
    arrow: {
      color: "#d8e4ed",
    },
    overlay: {
      backgroundColor: "#00000080",
    },
    tooltip: {
      border: "1px solid #d8e4ed",
      borderRadius: "1.35rem",
      color: "#15384a",
      backgroundColor: "#ffffff",
      boxShadow: "0 18px 50px -28px rgba(13,33,44,0.55)",
    },
    tooltipContent: {
      color: "#3f6576",
    },
    tooltipTitle: {
      color: "#15384a",
    },
    buttonPrimary: {
      backgroundColor: "#0d6789",
      color: "#ffffff",
    },
    buttonBack: {
      backgroundColor: "#ffffff",
      color: "#4f7a8c",
    },
    buttonSkip: {
      backgroundColor: "#ffffff",
      color: "#4f7a8c",
    },
  },
};

const GUIDED_TOUR_THEME_BY_KEY: Record<string, Partial<GuidedTourTheme>> = {
  music_salon: {
    cardClassName: "border-[#b8d3ef] bg-[#eef7ff] text-[#163a5a] shadow-[0_18px_50px_-28px_rgba(17,53,70,0.58)]",
    titleClassName: "text-[#163a5a]",
    bodyClassName: "text-[#365f79]",
    footerClassName: "border-[#b8d3ef]",
    primaryButtonClassName: "bg-[#2c5ead] text-white hover:bg-[#234b8d]",
    secondaryButtonClassName: "border-[#b8d3ef] bg-white text-[#2c5ead] hover:bg-[#f1f8ff]",
    accentColor: "#2c5ead",
    borderColor: "#b8d3ef",
    backgroundColor: "#eef7ff",
    textColor: "#163a5a",
    styles: {
      arrow: {
        color: "#b8d3ef",
      },
      overlay: {
        backgroundColor: "#00000080",
      },
      tooltip: {
        border: "1px solid #b8d3ef",
        borderRadius: "1.35rem",
        color: "#163a5a",
        backgroundColor: "#eef7ff",
        boxShadow: "0 18px 50px -28px rgba(17,53,70,0.58)",
      },
      tooltipContent: {
        color: "#365f79",
      },
      tooltipTitle: {
        color: "#163a5a",
      },
      buttonPrimary: {
        backgroundColor: "#2c5ead",
        color: "#ffffff",
      },
      buttonBack: {
        backgroundColor: "#ffffff",
        color: "#2c5ead",
      },
      buttonSkip: {
        backgroundColor: "#ffffff",
        color: "#2c5ead",
      },
    },
  },
  movie_tour: {
    cardClassName: "border-[#f0d9c4] bg-[#fff8f2] text-[#5c2e1a] shadow-[0_18px_50px_-28px_rgba(96,32,0,0.62)]",
    titleClassName: "text-[#5c2e1a]",
    bodyClassName: "text-[#734f3a]",
    footerClassName: "border-[#f0d9c4]",
    primaryButtonClassName: "bg-[#b8581a] text-white hover:bg-[#964815]",
    secondaryButtonClassName: "border-[#e8c4a0] bg-white text-[#7b3306] hover:bg-[#fff6ef]",
    accentColor: "#b8581a",
    borderColor: "#f0d9c4",
    backgroundColor: "#fff8f2",
    textColor: "#5c2e1a",
    styles: {
        arrow: {
          color: "#f0d9c4",
        },
        overlay: {
          backgroundColor: "#00000080",
        },
      tooltip: {
        border: "1px solid #f0d9c4",
        borderRadius: "1.35rem",
          color: "#5c2e1a",
          backgroundColor: "#fff8f2",
        boxShadow: "0 18px 50px -28px rgba(96,32,0,0.62)",
      },
      tooltipContent: {
        color: "#734f3a",
      },
      tooltipTitle: {
        color: "#5c2e1a",
      },
      buttonPrimary: {
        backgroundColor: "#b8581a",
        color: "#ffffff",
      },
      buttonBack: {
        backgroundColor: "#ffffff",
        color: "#7b3306",
      },
      buttonSkip: {
        backgroundColor: "#ffffff",
        color: "#7b3306",
      },
    },
  },
  tv_tour: {
    cardClassName: "border-[#d7ebf3] bg-[#f5fbff] text-[#15384a] shadow-[0_18px_50px_-28px_rgba(9,44,62,0.55)]",
    titleClassName: "text-[#15384a]",
    bodyClassName: "text-[#3f6576]",
    footerClassName: "border-[#d7ebf3]",
    primaryButtonClassName: "bg-[#2d87a8] text-white hover:bg-[#256e89]",
    secondaryButtonClassName: "border-[#c9e2ec] bg-white text-[#24536a] hover:bg-[#f1f8fb]",
    accentColor: "#2d87a8",
    borderColor: "#d7ebf3",
    backgroundColor: "#f5fbff",
    textColor: "#15384a",
    styles: {
        arrow: {
          color: "#d7ebf3",
        },
        overlay: {
          backgroundColor: "#00000080",
        },
      tooltip: {
        border: "1px solid #d7ebf3",
        borderRadius: "1.35rem",
          color: "#15384a",
          backgroundColor: "#f5fbff",
        boxShadow: "0 18px 50px -28px rgba(9,44,62,0.55)",
      },
      tooltipContent: {
        color: "#3f6576",
      },
      tooltipTitle: {
        color: "#15384a",
      },
      buttonPrimary: {
        backgroundColor: "#2d87a8",
        color: "#ffffff",
      },
      buttonBack: {
        backgroundColor: "#ffffff",
        color: "#24536a",
      },
      buttonSkip: {
        backgroundColor: "#ffffff",
        color: "#24536a",
      },
    },
  },
};

export function getGuidedTourTheme(tourKey?: string): GuidedTourTheme {
  const override = tourKey ? GUIDED_TOUR_THEME_BY_KEY[tourKey] : undefined;

  return {
    ...DEFAULT_THEME,
    ...override,
  };
}

function joinClasses(...classNames: Array<string | undefined | false>) {
  return classNames.filter(Boolean).join(" ");
}

export default function GuidedTourTooltip({
  continuous,
  index,
  isLastStep,
  size,
  step,
  backProps,
  closeProps,
  primaryProps,
  tooltipProps,
}: TooltipRenderProps) {
  const stepData = typeof step.data === "object" && step.data ? step.data as Partial<{
    tourKey: string;
    onSkipStep: () => void;
    onFinishTour: () => void;
  }> : undefined;
  const tourKey = stepData && "tourKey" in stepData ? String(stepData.tourKey) : undefined;
  const theme = getGuidedTourTheme(tourKey);

  const tooltipOuterStyle: CSSProperties = {
    color: theme.textColor,
    backgroundColor: theme.backgroundColor,
    borderColor: theme.borderColor,
  };

  return (
      <div
      {...tooltipProps}
      className={ joinClasses(
        "font-app max-w-[42rem] rounded-[1.35rem] border px-4 py-4 sm:px-5 sm:py-5",
        theme.cardClassName
      ) }
      style={ tooltipOuterStyle }
    >
      <div className="space-y-3">
        { step.title ? <h3 className={ joinClasses("text-base font-black tracking-tight", theme.titleClassName) }>{ step.title }</h3> : null }
        <div className={ joinClasses("space-y-2 text-sm leading-6", theme.bodyClassName) }>
          { step.content }
        </div>
      </div>

      <div className={ joinClasses("mt-4 flex items-center justify-between gap-3 border-t pt-3", theme.footerClassName) }>
        <div className="flex items-center gap-2">
          { !isLastStep && step.showProgress ? (
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f8793]">
              { index + 1 } of { size }
            </span>
          ) : null }
        </div>

        <div className="flex items-center gap-2">
          { step.buttons.includes("back") ? (
            <button
              type="button"
              { ...backProps }
              className={ joinClasses(
                "rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] whitespace-nowrap transition",
                theme.secondaryButtonClassName
              ) }
            />
          ) : null }

          { step.buttons.includes("skip") ? (
            <button
              type="button"
              onClick={ stepData?.onSkipStep }
              aria-label="Skip Step"
              className={ joinClasses(
                "rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] whitespace-nowrap transition",
                theme.secondaryButtonClassName
              ) }
            >
              Skip
            </button>
          ) : null }

          { step.buttons.includes("skip") ? (
            <button
              type="button"
              onClick={ stepData?.onFinishTour }
              aria-label="Finish Tour"
              className={ joinClasses(
                "rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] whitespace-nowrap transition",
                theme.primaryButtonClassName
              ) }
            >
              Finish
            </button>
          ) : null }

          { step.buttons.includes("close") && !continuous ? (
            <button
              type="button"
              { ...closeProps }
              className={ joinClasses(
                "rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] whitespace-nowrap transition",
                theme.primaryButtonClassName
              ) }
            />
          ) : null }

          { step.buttons.includes("primary") ? (
            <button
              type="button"
              { ...primaryProps }
              className={ joinClasses(
                "rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] whitespace-nowrap transition",
                theme.primaryButtonClassName
              ) }
            />
          ) : null }
        </div>
      </div>
    </div>
  );
}