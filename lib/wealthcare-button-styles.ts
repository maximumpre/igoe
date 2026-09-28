/** WealthCare portal button chrome (Plansource pattern). */
export const WEALTHCARE_BUTTON_BORDER = "border border-[#bec5c2] rounded-none" as const

export const WEALTHCARE_PRIMARY_BUTTON_SHADOW =
  "shadow-[0_0_3px_0_#0066a1]" as const

export const WEALTHCARE_NEUTRAL_BUTTON_SHADOW =
  "shadow-[0_0_3px_0_#bec5c2]" as const

export const WEALTHCARE_BUTTON_CHROME = [
  WEALTHCARE_BUTTON_BORDER,
  WEALTHCARE_PRIMARY_BUTTON_SHADOW,
].join(" ")

export const WEALTHCARE_NEUTRAL_BUTTON_CLASS = [
  WEALTHCARE_BUTTON_BORDER,
  WEALTHCARE_NEUTRAL_BUTTON_SHADOW,
].join(" ")
