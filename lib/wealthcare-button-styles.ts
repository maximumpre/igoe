/** WealthCare portal button chrome (Plansource pattern).
 *
 * Source of truth: `Sleipnir the glider/Steins Gate/snippets/wealthcare-button-styles.ts`.
 * Set `WEALTHCARE_PRIMARY_BUTTON_SHADOW` to **this site's primary button colour**.
 *
 * Reference treatment (captured CSS in the Melody-wealthcare-portal clone):
 *   border: 1px solid #bec5c2
 *   border-radius: 0
 *   box-shadow: 0 0 3px 0 <PRIMARY_HEX>     <- symmetric 3px GLOW in the brand colour
 *
 * The glow is a brand-coloured halo, not a grey bottom edge. In the reference
 * `.btn-signin` and `.btn-register` share ONE shadow hue even though their fills
 * differ, so the glow is the site's brand colour and is applied uniformly.
 *
 * igoe palette (fills, owned by this project):
 *   primary #010147  hover #0063FF
 *   neutral #646464  hover #545454
 */
export const WEALTHCARE_BUTTON_BORDER =
  "border border-[#bec5c2] rounded-none" as const;

/** 3px glow in igoe's primary button colour. */
export const WEALTHCARE_PRIMARY_BUTTON_SHADOW =
  "shadow-[0_0_3px_0_#010147]" as const;

/** 3px glow in the border colour, for neutral / Cancel buttons. */
export const WEALTHCARE_NEUTRAL_BUTTON_SHADOW =
  "shadow-[0_0_3px_0_#bec5c2]" as const;

export const WEALTHCARE_BUTTON_CHROME = [
  WEALTHCARE_BUTTON_BORDER,
  WEALTHCARE_PRIMARY_BUTTON_SHADOW,
].join(" ");

export const WEALTHCARE_NEUTRAL_BUTTON_CLASS = [
  WEALTHCARE_BUTTON_BORDER,
  WEALTHCARE_NEUTRAL_BUTTON_SHADOW,
].join(" ");

/** Shared geometry for a WealthCare button (Tailwind class string). */
export const WEALTHCARE_BUTTON_GEOMETRY =
  "w-full min-w-0 min-h-[40px] h-auto px-4 py-[5px] border text-[17px] font-light uppercase transition-colors cursor-pointer";

/** Stacked button block — the reference centres a 220px column of full-width buttons. */
export const WEALTHCARE_BUTTON_STACK = "w-[220px] mx-auto" as const;

/** igoe primary / neutral fills — pass via `style` + hover handlers. */
export const IGOE_PRIMARY_FILL = "#010147";
export const IGOE_PRIMARY_HOVER = "#0063FF";
export const IGOE_NEUTRAL_FILL = "#646464";
export const IGOE_NEUTRAL_HOVER = "#545454";
