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

export function buildSiteKeywords(): string[] {
  return mergeKeywords(
    BRAND_SLUG_LADDER,
    HOST_KEYWORDS,
    BRAND_PHRASES,
    FINAL_URL_KEYWORDS,
    SHARED_GENERIC_KEYWORDS,
  )
}
