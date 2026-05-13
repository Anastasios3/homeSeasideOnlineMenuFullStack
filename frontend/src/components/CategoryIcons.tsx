import type { FC, SVGProps } from "react";

/**
 * Hand-drawn-feel category icons. Same chunky black ink line as
 * raw-assets/VISUALS/ICONS/HOME_ICONS.svg — rounded caps, organic curves,
 * deliberately slight asymmetry. Designed at 24x24 with stroke-width 2.
 *
 * These replace the generic Lucide cup/martini/wine/beer/fork on the customer
 * menu. They're not the final commissioned set — a brand designer can swap
 * the SVG paths later without touching CategoryNav.
 */

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const base = (size: number): SVGProps<SVGSVGElement> => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
});

export const CoffeeIcon: FC<IconProps> = ({ size = 22, ...props }) => (
  <svg {...base(size)} {...props} aria-hidden="true">
    {/* Espresso cup + saucer with a small steam wisp */}
    <path d="M5 9 C5 9 6 8.5 8 8.7 C10 8.9 14 8.9 16 8.7 C18 8.5 19 9 19 9 L18 16.5 C17.9 17.6 17 18.3 16 18.4 C14 18.6 10 18.6 8 18.4 C7 18.3 6.1 17.6 6 16.5 Z" />
    <path d="M19.5 11.2 C20.5 11.3 21.7 12 21.7 13.5 C21.7 14.9 20.6 15.6 19.7 15.7" />
    <path d="M4.5 20.5 C8 21 16 21 19.5 20.5" />
    <path d="M10.5 4.5 C10.2 5.5 10.8 5.9 11 6.5 C11.2 7.1 10.9 7.5 10.7 8" />
    <path d="M13.5 4.5 C13.2 5.4 13.8 5.8 14 6.4" />
  </svg>
);

export const CocktailIcon: FC<IconProps> = ({ size = 22, ...props }) => (
  <svg {...base(size)} {...props} aria-hidden="true">
    {/* Martini glass with olive on a pick */}
    <path d="M4 5 L20 5 L13 14 L13 19.5" />
    <path d="M9.5 19.5 L16.5 19.5" />
    <path d="M11 14 L11.2 19.5" />
    <circle cx="15" cy="9" r="1.3" />
    <path d="M15.7 8.3 L17.5 5.5" />
  </svg>
);

export const WineIcon: FC<IconProps> = ({ size = 22, ...props }) => (
  <svg {...base(size)} {...props} aria-hidden="true">
    {/* Wine glass next to beer mug — represents "beer & wine" */}
    <path d="M5 4 C5 7.5 6 10 7.5 10.5 C7.5 13 7.4 16 7.4 18.5" />
    <path d="M5.5 20 L9.5 20" />
    <path d="M9 4 C9 7.5 8 10 7.5 10.5" />
    <path d="M13 8 L13 19 C13 19.6 13.4 20 14 20 L18.5 20 C19.1 20 19.5 19.6 19.5 19 L19.5 8 Z" />
    <path d="M19.5 11 L21 11 L21 15 L19.5 15" />
    <path d="M14.5 9.5 L18 9.5" />
  </svg>
);

export const SpiritsIcon: FC<IconProps> = ({ size = 22, ...props }) => (
  <svg {...base(size)} {...props} aria-hidden="true">
    {/* Whisky bottle with a tumbler beside */}
    <path d="M9 3 L13 3" />
    <path d="M9.5 3 L9.5 7 C8.5 7.5 8 8.5 8 9.5 L8 19 C8 19.6 8.4 20 9 20 L13 20 C13.6 20 14 19.6 14 19 L14 9.5 C14 8.5 13.5 7.5 12.5 7 L12.5 3" />
    <rect x="9" y="12" width="4" height="3.5" rx="0.3" />
    <path d="M16.5 11 L20 11 L20 19 C20 19.6 19.6 20 19 20 L17 20 C16.4 20 16 19.6 16 19 Z" />
    <path d="M17 13.5 L19.5 13.5" />
  </svg>
);

export const FoodIcon: FC<IconProps> = ({ size = 22, ...props }) => (
  <svg {...base(size)} {...props} aria-hidden="true">
    {/* Plate from above with fork + knife crossed — friendlier than utensils */}
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="6" />
    <path d="M8.5 9 L15 15.5" />
    <path d="M15.5 8.5 L9 15" />
  </svg>
);

/** Map by category id for convenience. */
export const CATEGORY_ICONS = {
  coffee: CoffeeIcon,
  cocktails: CocktailIcon,
  "beer&wine": WineIcon,
  spirits: SpiritsIcon,
  food: FoodIcon,
} as const;
