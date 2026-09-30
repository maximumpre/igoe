import { LAYOUT_DESCRIPTION } from "@/lib/meta-description"
import { buildSiteKeywords } from "@/lib/seo-keywords"
import { DEFAULT_SITE_TITLE, CANONICAL_HOST, SITE_DISPLAY_NAME } from "@/lib/site-url"

export const SITE_TITLE = `${SITE_DISPLAY_NAME} Member Login`

export const SITE_DESCRIPTION = LAYOUT_DESCRIPTION

export const SITE_KEYWORDS: string[] = buildSiteKeywords()

const VISIBLE_HOST_TOKENS = [
  CANONICAL_HOST.toLowerCase(),
  CANONICAL_HOST.replace(/^www\./, "").toLowerCase(),
]

/**
 * Body-safe keywords for the visible `Related searches: …` crawler body block.
 * Raw domain tokens stay in `<meta name="keywords">` only — Yandex still reads
 * meta keywords; a domain in visible body copy reads as stuffing to Google/Bing.
 */
export function buildVisibleKeywords(): string[] {
  return SITE_KEYWORDS.filter((k) => !VISIBLE_HOST_TOKENS.some((h) => k.toLowerCase().includes(h)))
}

export const SITE_VISIBLE_KEYWORDS = buildVisibleKeywords()
