import { CANONICAL_HOST, DEFAULT_SITE_TITLE, SITE_DISPLAY_NAME } from "@/lib/site-url"

function mergeKeywords(...lists: Array<readonly string[]>): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const list of lists) {
    for (const keyword of list) {
      const key = keyword.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      result.push(keyword)
    }
  }
  return result
}

export const BRAND_SLUG_LADDER = [
  "igoe",
  "goigoe",
  "igoe login",
  "goigoe login",
  "igoe hr",
  "goigoe hr",
  "igoe hr login",
  "goigoe hr login",
  "igoe hsa",
  "goigoe hsa",
  "igoe fsa",
  "goigoe fsa",
  "goigoe hsa login",
  "goigoe fsa login",
  "igoe benefits login",
  "goigoe benefits login",
  "goigoewealthcare",
  "goigoewealthcare login",
  "goigoe wealthcare",
  "goigoe wealthcare login",
  "igoe administrative services",
  "goigoe administrative services",
] as const

const HOST_KEYWORDS = [
  CANONICAL_HOST,
  `www.${CANONICAL_HOST.replace(/^www\./, "")}`,
  "goigoewealthcare-portal.com",
  "www.goigoewealthcare-portal.com",
  "goigoewealthcare-portal.com login",
  "goigoe-wealthcareportal.com",
  "goigoe wealthcare portal",
]

const BRAND_PHRASES = [
  SITE_DISPLAY_NAME,
  `${SITE_DISPLAY_NAME} login`,
  `${SITE_DISPLAY_NAME} sign in`,
  `${SITE_DISPLAY_NAME} member portal`,
  `${SITE_DISPLAY_NAME} benefits`,
  `${SITE_DISPLAY_NAME} employee benefits`,
  `${SITE_DISPLAY_NAME} HSA`,
  `${SITE_DISPLAY_NAME} FSA`,
  `${SITE_DISPLAY_NAME} Portal`,
  DEFAULT_SITE_TITLE,
  "Login goigoewealthcare",
  "Login Goigoe",
  "Homepage Goigoe Wealthcare",
  "Homepage Goigoe",
  "Login Assistant - Goigoe",
  "Goigoe Wealthcare Authentication",
  "Goigoe Authentication",
  "Forgot your Username Goigoe Wealthcare",
  "Forgot your Username Goigoe",
  "Forgot your Password Goigoe Wealthcare",
  "Forgot your Password Goigoe",
  "Register Goigoe Wealthcare",
  "Register Goigoe",
  "Don't have an account Goigoe Wealthcare",
  "goigoewealthcare portal",
  "Goigoe portal",
  "Igoe Administrative Services",
  "Igoe Administrative Services benefits",
  "GoigoeHR",
  "Goigoe HR",
  "Goigoe HR login",
  "Goigoe Benefits login",
  "Goigoe HSA",
  "Goigoe FSA",
  "Goigoe Sign in",
  "Goigoe healthcare benefits",
  "Goigoe healthcare benefits sign in",
  "Goigoe healthcare benefits login",
  "Goigoe healthcare benefits portal",
  "Goigoe healthcare benefits portal login",
]

const FINAL_URL_KEYWORDS = [
  "goigoe.wealthcareportal.com",
  "goigoe.wealthcareportal.com login",
  "goigoe wealthcareportal Authentication Handshake",
  "Goigoe Wealthcare UserId",
  "Goigoe Wealthcare Handshake",
  "Goigoe Wealthcare Aptia",
  "Goigoe Wealthcare Consumer Funding Solutions",
  "Goigoe Wealthcare SITE MAP",
  "wealthcare member sign in",
  "employer wealthcare portal",
  "healthcare benefits portal",
  "member wealthcare portal",
  "wealthcare portal",
  "wealthcare benefits",
  "employee benefits portal",
]

const SHARED_GENERIC_KEYWORDS = [
  "healthcare benefits",
  "health insurance",
  "employee benefits",
  "benefits portal",
  "member portal",
  "HSA login",
  "FSA login",
]

/**
 * NEW — employer entity cluster.
 * Sourced from the live portal's own About Us and Contact Us pages, which publish
 * Igoe Administrative Services' founding dates, ownership model, HQ, service lines
 * and participant contact details. These are real brand entities the current
 * keyword set never named, and they are the only winnable navigational surface
 * for a login-only page.
 */
const EMPLOYER_ENTITY_KEYWORDS = [
  "Igoe Administrative Services San Diego",
  "Igoe Administrative Services employee benefits",
  "Igoe Administrative Services login",
  "Igoe Administrative Services portal",
  "Igoe Administrative Services account",
  "Igoe benefits administrator",
  "Igoe participant portal",
  "Igoe spending account",
  "Igoe COBRA administration",
  "Igoe flexible benefit plan administration",
  "Igoe participant services",
  "Igoe flex department",
  "Igoe benefits login help",
  "Goigoe participant account",
] as const

/**
 * NEW — portal route cluster.
 * Sourced from the live portal's own page titles across its 13 anonymously
 * reachable pages and from the public /sitemap/urls JSON endpoint. These are the
 * exact labels a participant searching by page name would use.
 */
const PORTAL_ROUTE_KEYWORDS = [
  "Igoe sign in",
  "Igoe log in",
  "Igoe register",
  "Igoe sign up",
  "Igoe enrollment",
  "Igoe forgot password",
  "Igoe username retrieval",
  "Igoe change password",
  "Igoe registration help",
  "Igoe site map",
  "Igoe about us",
  "Igoe contact us",
  "Igoe terms of use",
  "Igoe privacy policy",
  "Igoe FAQ",
  "Igoe dashboard",
  "Goigoe registration help",
  "Goigoe forgot password",
  "Goigoe username retrieval",
  "Goigoe change password",
  "Goigoe terms of use",
  "Goigoe privacy policy",
  "Goigoe FAQ",
  "Goigoe participant services",
  "Goigoe spending account participant",
] as const

/**
 * NEW — recovery / problem cluster.
 * The highest-value long-tail demand in this vertical is users locked out of an
 * account. "Igoe" never appeared against that demand in current coverage, while
 * Reddit threads (r/HSA, r/healthequity, r/personalfinance) confirm the demand is
 * real and recurring.
 */
const RECOVERY_KEYWORDS = [
  "Igoe forgot username",
  "Igoe recover username",
  "Igoe reset password",
  "Igoe password reset",
  "Igoe account locked out",
  "Igoe login not working",
  "Igoe login help",
  "Igoe cannot sign in",
  "Igoe one time passcode not received",
  "Goigoe forgot username",
  "Goigoe reset password",
  "Goigoe login not working",
  "Goigoe login help",
] as const

/**
 * NEW — platform identity cluster.
 * The live portal runs on the Alegeus / WealthCare Saver platform. The existing
 * set named "Aptia" and "Consumer Funding Solutions" but never the platform that
 * actually serves the login, so participants searching the vendor could not match.
 */
const PLATFORM_KEYWORDS = [
  "WealthCare Saver login",
  "Alegeus login",
  "Alegeus HSA login",
  "Alegeus FSA login",
  "Goigoe WealthCare Saver",
  "Igoe WealthCare Saver",
  "Goigoe Alegeus",
  "Igoe Alegeus",
  "Goigoe Aptia",
  "Igoe Aptia",
] as const

export function buildSiteKeywords(): string[] {
  return mergeKeywords(
    BRAND_SLUG_LADDER,
    HOST_KEYWORDS,
    BRAND_PHRASES,
    FINAL_URL_KEYWORDS,
    SHARED_GENERIC_KEYWORDS,
    EMPLOYER_ENTITY_KEYWORDS,
    PORTAL_ROUTE_KEYWORDS,
    RECOVERY_KEYWORDS,
    PLATFORM_KEYWORDS,
  )
}
